import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { sendLeaveApprovalEmail } from '@/lib/email';

export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const body = await req.json();
  const { type, startDate, endDate, reason } = body;
  try {
    // Create the leave request
    const leave = await Leave.create({
      user: user.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    });

    // Get user's reporting managers
    const userWithDept = await User.findById(user.id).lean();
    if (userWithDept.department) {
      const department = await Department.findById(userWithDept.department);
      
      let managersToNotify = [];
      
      // Use user-specific managers if assigned, otherwise use department managers
      if (userWithDept.reportingManagers && userWithDept.reportingManagers.length > 0) {
        managersToNotify = userWithDept.reportingManagers;
      } else if (department && department.reportingManagers && department.reportingManagers.length > 0) {
        managersToNotify = department.reportingManagers;
      }

      // Create approval entries for each manager and send emails
      if (managersToNotify.length > 0) {
        leave.managerApprovals = managersToNotify.map(manager => ({
          managerEmail: manager.email,
          managerName: manager.name,
          status: 'Pending',
          emailSent: false,
          emailSentAt: null
        }));
        
        await leave.save();

        // Send approval emails to all reporting managers with 3 second gap
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
              }
            }

            await leave.save();
          } catch (error) {
            console.error(`Failed to send email to ${manager.email}:`, error);
          }
        }
      }
    }

    return NextResponse.json({ 
      leave,
      notificationsSent: leave.managerApprovals?.length || 0
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
