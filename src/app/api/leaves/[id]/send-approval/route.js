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

    // Get user for leave stats calculation
    const userWithDept = await User.findById(leave.user._id).lean();

    // Check if there are additional recipients who need emails
    const hasAdditionalRecipients = leave.additionalRecipients && leave.additionalRecipients.length > 0;
    const additionalRecipientsNeedingEmail = hasAdditionalRecipients 
      ? leave.additionalRecipients.filter(r => r.status === 'Pending')
      : [];

    // If no additional recipients need emails, return early
    if (additionalRecipientsNeedingEmail.length === 0) {
      console.log('⚠️ No additional recipients need email notification');
      return NextResponse.json({ 
        message: 'No pending additional recipients need email notification',
        additionalRecipients: leave.additionalRecipients
      });
    }

    // Calculate leave statistics for email (pass user object for leave_limit)
    const leaveStats = await calculateLeaveStats(leave.user._id, leave.user);

    // Send approval emails to additional recipients with pending status
    let emailsSentCount = 0;
    console.log(`📨 Starting to send emails to ${additionalRecipientsNeedingEmail.length} additional recipient(s)...`);
    
    for (let i = 0; i < additionalRecipientsNeedingEmail.length; i++) {
      const recipient = additionalRecipientsNeedingEmail[i];
      console.log(`📧 [${i + 1}/${additionalRecipientsNeedingEmail.length}] Sending email to additional recipient: ${recipient.email}`);
      
      try {
        // Add 3 second delay between emails (except for the first one)
        if (i > 0) {
          console.log(`⏳ Waiting 3 seconds before next email...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

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
            emailsSentCount++;
          }
        }

        await leave.save();
      } catch (error) {
        console.error(`❌ Failed to send email to additional recipient ${recipient.email}:`, error);
      }
    }
    
    console.log(`✅ Email sending complete: ${emailsSentCount}/${additionalRecipientsNeedingEmail.length} sent successfully`);

    return NextResponse.json({ 
      message: `Approval emails sent to ${emailsSentCount} additional recipient(s)`,
      totalSent: emailsSentCount,
      totalRecipients: additionalRecipientsNeedingEmail.length,
      additionalRecipients: leave.additionalRecipients
    });

  } catch (error) {
    console.error('Error sending approval emails:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
