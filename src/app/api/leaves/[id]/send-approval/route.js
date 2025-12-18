import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { sendLeaveApprovalEmail } from '@/lib/email';
import { calculateLeaveStats } from '@/lib/leave-stats';

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
    
    let managersToNotify = [];
    
    // Only check for department and managers if user has a department
    if (userWithDept.department) {
      const department = await Department.findById(userWithDept.department);
      
      // Get user's specific reporting managers or use all from department
      if (userWithDept.reportingManagers && userWithDept.reportingManagers.length > 0) {
        managersToNotify = userWithDept.reportingManagers;
      } else if (department && department.reportingManagers && department.reportingManagers.length > 0) {
        managersToNotify = department.reportingManagers;
      }
    }

    // Initialize managerApprovals if managers exist and not already initialized
    if (managersToNotify.length > 0 && (!leave.managerApprovals || leave.managerApprovals.length === 0)) {
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
    const managersNeedingEmail = (leave.managerApprovals || []).filter(
      approval => approval.status === 'Pending'
    );

    console.log('🔍 Managers needing email (with Pending status):', managersNeedingEmail);

    // Check if there are additional recipients who need emails
    const hasAdditionalRecipients = leave.additionalRecipients && leave.additionalRecipients.length > 0;
    const additionalRecipientsNeedingEmail = hasAdditionalRecipients 
      ? leave.additionalRecipients.filter(r => r.status === 'Pending')
      : [];

    // If no managers and no additional recipients need emails, return early
    if (managersNeedingEmail.length === 0 && additionalRecipientsNeedingEmail.length === 0) {
      console.log('⚠️ No managers or additional recipients need email notification');
      return NextResponse.json({ 
        message: 'No pending recipients need email notification',
        managerApprovals: leave.managerApprovals,
        additionalRecipients: leave.additionalRecipients
      });
    }

    // Calculate leave statistics for email
    const leaveStats = await calculateLeaveStats(leave.user._id);

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
          employee: userWithDept,
          leaveStats: leaveStats
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

    // Send emails to additional recipients who have Pending status
    let recipientEmailsSentCount = 0;
    if (leave.additionalRecipients && leave.additionalRecipients.length > 0) {
      const recipientsNeedingEmail = leave.additionalRecipients.filter(
        recipient => recipient.status === 'Pending'
      );

      console.log(`📨 Starting to send emails to ${recipientsNeedingEmail.length} additional recipient(s)...`);

      for (let i = 0; i < recipientsNeedingEmail.length; i++) {
        const recipient = recipientsNeedingEmail[i];
        console.log(`📧 [${i + 1}/${recipientsNeedingEmail.length}] Sending email to additional recipient: ${recipient.email}`);
        
        try {
          // Add 3 second delay between emails
          console.log(`⏳ Waiting 3 seconds before next email...`);
          await new Promise(resolve => setTimeout(resolve, 3000));

          const emailSent = await sendLeaveApprovalEmail({
            managerEmail: recipient.email,
            managerName: recipient.name,
            leave: leave,
            employee: userWithDept,
            leaveStats: leaveStats
          });

          console.log(`${emailSent ? '✅' : '❌'} Email ${emailSent ? 'sent' : 'failed'} to ${recipient.email}`);

          // Update the recipient entry to mark email as sent
          const recipientIndex = leave.additionalRecipients.findIndex(
            r => r.email === recipient.email
          );
          if (recipientIndex !== -1) {
            leave.additionalRecipients[recipientIndex].emailSent = emailSent;
            if (emailSent) {
              leave.additionalRecipients[recipientIndex].emailSentAt = new Date();
              recipientEmailsSentCount++;
            }
          }

          await leave.save();
        } catch (error) {
          console.error(`❌ Failed to send email to additional recipient ${recipient.email}:`, error);
        }
      }

      console.log(`✅ Additional recipient emails complete: ${recipientEmailsSentCount}/${recipientsNeedingEmail.length} sent successfully`);
    }

    const totalSent = emailsSentCount + recipientEmailsSentCount;
    const totalRecipients = managersNeedingEmail.length + (leave.additionalRecipients?.filter(r => r.status === 'Pending').length || 0);

    return NextResponse.json({ 
      message: `Approval emails sent to ${emailsSentCount} manager(s) and ${recipientEmailsSentCount} additional recipient(s)`,
      totalSent,
      totalRecipients,
      managerApprovals: leave.managerApprovals,
      additionalRecipients: leave.additionalRecipients
    });

  } catch (error) {
    console.error('Error sending approval emails:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
