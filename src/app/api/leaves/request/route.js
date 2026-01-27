import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { sendLeaveApprovalEmail, sendHRNotificationEmail, sendAdminNotificationEmail } from '@/lib/email';
import { calculateLeaveStats } from '@/lib/leave-stats';

export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const body = await req.json();
  const { type, startDate, endDate, reason, additionalRecipients } = body;
  
  console.log('📥 Received additionalRecipients:', JSON.stringify(additionalRecipients, null, 2));
  
  try {
    // Ensure additional recipients have proper status
    const processedRecipients = (additionalRecipients || []).map(recipient => ({
      name: recipient.name,
      email: recipient.email,
      status: 'Pending',
      emailSent: false
    }));

    console.log('✅ Processed recipients:', JSON.stringify(processedRecipients, null, 2));

    // Create the leave request
    const leave = await Leave.create({
      user: user.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      additionalRecipients: processedRecipients,
    });

    console.log('💾 Leave created with recipients:', JSON.stringify(leave.additionalRecipients, null, 2));

    // Get user's department for HR notification
    const userWithDept = await User.findById(user.id).lean();
    
    // Send emails to additional recipients with status tracking
    if (additionalRecipients && additionalRecipients.length > 0) {
      // Calculate leave statistics for email
      const leaveStats = await calculateLeaveStats(user.id, user);
      
      // Send email to each additional recipient
      for (let i = 0; i < additionalRecipients.length; i++) {
        const recipient = leave.additionalRecipients[i];
        
        try {
          // Add 3 second delay between emails
          await new Promise(resolve => setTimeout(resolve, 3000));

          const emailSent = await sendLeaveApprovalEmail({
            managerEmail: recipient.email,
            managerName: recipient.name,
            leave: leave,
            employee: userWithDept,
            leaveStats: leaveStats
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

    // Send notification to all admin users
    try {
      const adminUsers = await User.find({ role: 'Admin' }).lean();
      
      if (adminUsers && adminUsers.length > 0) {
        // Populate leave with user info for email
        const populatedLeave = await Leave.findById(leave._id).populate('user');
        const employeeWithDept = await User.findById(user.id).populate('department');
        
        // Calculate leave statistics
        const leaveStats = await calculateLeaveStats(user.id, user);
        
        for (const admin of adminUsers) {
          try {
            await sendAdminNotificationEmail({
              adminEmail: admin.email,
              adminName: admin.name,
              leave: populatedLeave,
              employee: employeeWithDept,
              leaveStats: leaveStats,
              eventType: 'new_request'
            });
            
            console.log(`✅ Admin notification sent to ${admin.email}`);
          } catch (error) {
            console.error(`Failed to send admin notification to ${admin.email}:`, error);
          }
        }
      }
    } catch (adminEmailError) {
      console.error('Failed to send admin notifications:', adminEmailError);
      // Don't fail the request if admin email fails
    }

    return NextResponse.json({ 
      leave,
      message: 'Leave request submitted successfully'
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
