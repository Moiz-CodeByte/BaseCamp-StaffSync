/**
 * Email Service Utility
 * 
 * This utility provides functions to send emails for various purposes.
 * Currently using a placeholder implementation.
 * 
 * To enable actual email sending, integrate one of these services:
 * 1. SendGrid (npm install @sendgrid/mail)
 * 2. AWS SES (npm install @aws-sdk/client-ses)
 * 3. Nodemailer (npm install nodemailer)
 * 4. Resend (npm install resend)
 */
    import { Resend } from 'resend';

/**
 * Send leave approval request email to reporting managers
 * @param {Object} params - Email parameters
 * @param {string} params.managerEmail - Manager's email address
 * @param {string} params.managerName - Manager's name
 * @param {Object} params.leave - Leave request object
 * @param {Object} params.employee - Employee object
 * @returns {Promise<boolean>} - Success status
 */
export async function sendLeaveApprovalEmail({ managerEmail, managerName, leave, employee }) {
  try {
    // TODO: Replace with actual email service integration
    // Example implementations below:

    /* 
    // Using SendGrid:
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to: managerEmail,
      from: process.env.FROM_EMAIL,
      subject: `Leave Approval Request from ${employee.name}`,
      html: generateLeaveApprovalHTML({ managerName, leave, employee })
    });
    */

    
   // Using Resend:
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: managerEmail,
      subject: `Leave Approval Request from ${employee.name}`,
      html: generateLeaveApprovalHTML({ managerName, managerEmail, leave, employee })
    });
    

    // Placeholder: Log email details
    console.log('📧 Email would be sent to:', managerEmail);
    console.log('Subject: Leave Approval Request from', employee.name);
    console.log('Leave Details:', {
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason
    });

    return true;
  } catch (error) {
    console.error('Error sending leave approval email:', error);
    return false;
  }
}

/**
 * Generate HTML template for leave approval email
 */
function generateLeaveApprovalHTML({ managerName, managerEmail, leave, employee }) {
  const startDate = new Date(leave.startDate).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const endDate = new Date(leave.endDate).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const approveUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/leaves/${leave._id}/manager-action?action=approve&email=${encodeURIComponent(managerEmail)}`;
  const rejectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/leaves/${leave._id}/manager-action?action=reject&email=${encodeURIComponent(managerEmail)}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f58327 0%, #ff9d4d 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #ffffff; padding: 30px; }
        .detail-box { margin: 20px 0; padding: 20px; background: #fff7f0; border-left: 4px solid #f58327; border-radius: 4px; }
        .detail-row { margin: 12px 0; display: flex; }
        .label { font-weight: bold; color: #f58327; min-width: 120px; }
        .value { color: #333; flex: 1; }
        .button-container { margin: 30px 0; text-align: center; }
        .button { display: inline-block; padding: 14px 32px; margin: 0 8px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; transition: all 0.3s; }
        .approve { background: #10b981; color: white; box-shadow: 0 2px 4px rgba(16,185,129,0.3); }
        .approve:hover { background: #059669; box-shadow: 0 4px 8px rgba(16,185,129,0.4); }
        .reject { background: #ef4444; color: white; box-shadow: 0 2px 4px rgba(239,68,68,0.3); }
        .reject:hover { background: #dc2626; box-shadow: 0 4px 8px rgba(239,68,68,0.4); }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .logo { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">BaseCamp StaffSync</div>
          <h1>Leave Approval Request</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #333;">Dear <strong>${managerName}</strong>,</p>
          <p style="font-size: 15px; color: #555; line-height: 1.8;"><strong style="color: #f58327;">${employee.name}</strong> has submitted a leave request that requires your approval.</p>
          
          <div class="detail-box">
            <div class="detail-row">
              <span class="label">Employee:</span>
              <span class="value">${employee.name} (${employee.email})</span>
            </div>
            <div class="detail-row">
              <span class="label">Leave Type:</span>
              <span class="value">${leave.type}</span>
            </div>
            <div class="detail-row">
              <span class="label">From:</span>
              <span class="value">${startDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">To:</span>
              <span class="value">${endDate}</span>
            </div>
            ${leave.reason ? `
            <div class="detail-row">
              <span class="label">Reason:</span>
              <span class="value">${leave.reason}</span>
            </div>
            ` : ''}
          </div>

          <div class="button-container">
            <a href="${approveUrl}" class="button approve">Approve Leave</a>
            <a href="${rejectUrl}" class="button reject">Reject Leave</a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-top: 20px; text-align: center;">Or you can review and approve this request by logging into the BaseCamp StaffSync dashboard.</p>
        </div>
        <div class="footer">
          <p style="margin: 5px 0;"><strong style="color: #f58327;">BaseCamp StaffSync</strong></p>
          <p style="margin: 5px 0;">This is an automated email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send leave status notification to employee
 */
export async function sendLeaveStatusEmail({ employeeEmail, employeeName, leave, status, managerName }) {
  try {
    // TODO: Implement actual email sending
    console.log('📧 Leave status email would be sent to:', employeeEmail);
    console.log(`Your ${leave.type} leave has been ${status} by ${managerName}`);
    return true;
  } catch (error) {
    console.error('Error sending leave status email:', error);
    return false;
  }
}
