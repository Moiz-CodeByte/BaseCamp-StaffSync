import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { sendLeaveApprovalEmail, sendHRNotificationEmail } from '@/lib/email';
import { calculateLeaveStats } from '@/lib/leave-stats';

export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const body = await req.json();
  const { type, startDate, endDate, reason, additionalRecipients } = body;
  try {
    // Create the leave request
    const leave = await Leave.create({
      user: user.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      additionalRecipients: additionalRecipients || [],
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

      // Send emails to additional recipients with status tracking
      if (additionalRecipients && additionalRecipients.length > 0) {
        // Initialize additional recipients with status tracking (already set in Leave.create above)
        for (let i = 0; i < additionalRecipients.length; i++) {
          const recipient = leave.additionalRecipients[i];
          
          try {
            // Add 3 second delay between emails
            await new Promise(resolve => setTimeout(resolve, 3000));

            const emailSent = await sendLeaveApprovalEmail({
              managerEmail: recipient.email,
              managerName: recipient.name,
              leave: leave,
              employee: userWithDept
            });

            // Update the recipient entry to mark email as sent
            leave.additionalRecipients[i].emailSent = emailSent;
            if (emailSent) {
              leave.additionalRecipients[i].emailSentAt = new Date();
            }

            await leave.save();
            console.log(`✅ Notification sent to additional recipient: ${recipient.email}`);
          } catch (error) {
            console.error(`Failed to send email to additional recipient ${recipient.email}:`, error);
          }
        }
      }
    }

    // Send notification to assigned HR
    try {
      const employeeWithDept = await User.findById(user.id).populate('department');
      
      if (employeeWithDept.department && employeeWithDept.department.hr) {
        const hrUser = await User.findById(employeeWithDept.department.hr);
        
        if (hrUser && hrUser.email) {
          // Calculate leave statistics
          const leaveStats = await calculateLeaveStats(user.id);
          
          // Populate leave with user info for email
          const populatedLeave = await Leave.findById(leave._id).populate('user');
          
          await sendHRNotificationEmail({
            hrEmail: hrUser.email,
            hrName: hrUser.name,
            leave: populatedLeave,
            employee: employeeWithDept,
            leaveStats: leaveStats,
            eventType: 'request'
          });
          
          console.log(`✅ HR notification sent to ${hrUser.email}`);
        }
      }
    } catch (hrEmailError) {
      console.error('Failed to send HR notification:', hrEmailError);
      // Don't fail the request if HR email fails
    }

    return NextResponse.json({ 
      leave,
      notificationsSent: leave.managerApprovals?.length || 0
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
