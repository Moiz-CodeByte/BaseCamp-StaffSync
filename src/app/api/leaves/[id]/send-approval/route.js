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
    if (!leave.managerApprovals || leave.managerApprovals.length === 0) {
      console.log('📋 Initializing manager approvals for leave:', leave._id);
      leave.managerApprovals = [];
      
      // Create approval entries for each manager
      leave.managerApprovals = managersToNotify.map(manager => ({
        managerEmail: manager.email,
        managerName: manager.name,
        status: 'Pending',
        emailSent: false,
        emailSentAt: null
      }));
      
      await leave.save();
      console.log('✅ Manager approvals initialized:', leave.managerApprovals);
    }

    console.log('📊 Current manager approvals:', leave.managerApprovals);

    // Filter managers who have Pending status (send email regardless of previous emailSent status)
    const managersNeedingEmail = leave.managerApprovals.filter(
      approval => approval.status === 'Pending'
    );

    console.log('🔍 Managers needing email (with Pending status):', managersNeedingEmail);

    if (managersNeedingEmail.length === 0) {
      console.log('⚠️ No managers need email notification');
      return NextResponse.json({ 
        message: 'No pending managers need email notification',
        managerApprovals: leave.managerApprovals
      });
    }

    // Send approval emails only to managers with pending status who haven't received email
    let emailsSentCount = 0;
    console.log(`📨 Starting to send emails to ${managersNeedingEmail.length} manager(s)...`);
    
    for (let i = 0; i < managersNeedingEmail.length; i++) {
      const approvalEntry = managersNeedingEmail[i];
      console.log(`📧 [${i + 1}/${managersNeedingEmail.length}] Sending email to: ${approvalEntry.managerEmail}`);
      
      try {
        // Add 3 second delay between emails (except for the first one)
        if (i > 0) {
          console.log(`⏳ Waiting 3 seconds before next email...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const emailSent = await sendLeaveApprovalEmail({
          managerEmail: approvalEntry.managerEmail,
          managerName: approvalEntry.managerName,
          leave: leave,
          employee: userWithDept
        });

        console.log(`${emailSent ? '✅' : '❌'} Email ${emailSent ? 'sent' : 'failed'} to ${approvalEntry.managerEmail}`);

        // Update the approval entry to mark email as sent
        const approvalIndex = leave.managerApprovals.findIndex(
          a => a.managerEmail === approvalEntry.managerEmail
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
        console.error(`❌ Failed to send email to ${approvalEntry.managerEmail}:`, error);
      }
    }
    
    console.log(`✅ Email sending complete: ${emailsSentCount}/${managersNeedingEmail.length} sent successfully`);

    return NextResponse.json({ 
      message: `Approval emails sent to ${emailsSentCount} of ${managersNeedingEmail.length} manager(s) with pending status`,
      managerApprovals: leave.managerApprovals
    });

  } catch (error) {
    console.error('Error sending approval emails:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
