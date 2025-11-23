import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { sendLeaveApprovalEmail } from '@/lib/email';

export async function POST(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  
  await connectDB();

  try {
    const { id } = await params;
    const leave = await Leave.findById(id).populate('user');
    
    if (!leave) {
      return NextResponse.json({ message: 'Leave request not found' }, { status: 404 });
    }

    // Get user's department with reporting managers
    const userWithDept = await User.findById(leave.user._id).lean();
    if (!userWithDept.department) {
      return NextResponse.json({ message: 'User has no department assigned' }, { status: 400 });
    }

    const department = await Department.findById(userWithDept.department);
    if (!department || !department.reportingManagers || department.reportingManagers.length === 0) {
      return NextResponse.json({ message: 'No reporting managers found for this department' }, { status: 400 });
    }

    // Get user's specific reporting managers or use all from department
    let managersToNotify = [];
    if (userWithDept.reportingManagers && userWithDept.reportingManagers.length > 0) {
      managersToNotify = userWithDept.reportingManagers;
    } else {
      managersToNotify = department.reportingManagers;
    }

    // Initialize managerApprovals if not exists
    if (!leave.managerApprovals) {
      leave.managerApprovals = [];
    }

    // Create approval entries for each manager
    leave.managerApprovals = managersToNotify.map(manager => ({
      managerEmail: manager.email,
      managerName: manager.name,
      status: 'Pending',
      emailSent: false,
      emailSentAt: null
    }));

    await leave.save();

    // Send approval emails to all reporting managers with 3 second gap
    let emailsSentCount = 0;
    for (let i = 0; i < managersToNotify.length; i++) {
      const manager = managersToNotify[i];
      
      try {
        // Add 3 second delay between emails (except for the first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const emailSent = await sendLeaveApprovalEmail({
          managerEmail: manager.email,
          managerName: manager.name,
          leave: leave,
          employee: userWithDept
        });

        // Update the approval entry to mark email as sent
        const approvalIndex = leave.managerApprovals.findIndex(
          a => a.managerEmail === manager.email
        );
        if (approvalIndex !== -1) {
          leave.managerApprovals[approvalIndex].emailSent = emailSent;
          if (emailSent) {
            leave.managerApprovals[approvalIndex].emailSentAt = new Date();
            emailsSentCount++;
          }
        }

        await leave.save();
      } catch (error) {
        console.error(`Failed to send email to ${manager.email}:`, error);
      }
    }

    return NextResponse.json({ 
      message: `Approval emails sent to ${emailsSentCount} of ${managersToNotify.length} manager(s)`,
      managerApprovals: leave.managerApprovals
    });

  } catch (error) {
    console.error('Error sending approval emails:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
