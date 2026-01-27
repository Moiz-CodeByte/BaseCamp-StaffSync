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

// Calculate business days (excluding weekends)
const calculateBusinessDays = (startDate, endDate) => {
  let start, end;
  if (typeof startDate === 'string') {
    start = new Date(startDate.includes('T') ? startDate : startDate + 'T00:00:00');
  } else {
    start = new Date(startDate);
  }
  if (typeof endDate === 'string') {
    end = new Date(endDate.includes('T') ? endDate : endDate + 'T00:00:00');
  } else {
    end = new Date(endDate);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (end < start) return 0;
  let businessDays = 0;
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDays++;
    current.setDate(current.getDate() + 1);
  }
  return businessDays;
};

/**
 * Send leave approval request email to reporting managers
 * @param {Object} params - Email parameters
 * @param {string} params.managerEmail - Manager's email address
 * @param {string} params.managerName - Manager's name
 * @param {Object} params.leave - Leave request object
 * @param {Object} params.employee - Employee object
 * @param {Object} params.leaveStats - Leave statistics (thisMonth, lastMonth, thisYear, thisQuarter, etc.)
 * @returns {Promise<boolean>} - Success status
 */
export async function sendLeaveApprovalEmail({ managerEmail, managerName, leave, employee, leaveStats }) {
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
      from: process.env.FROM_EMAIL ||'BaseCamp StaffSync <onboarding@resend.dev>',
      to: managerEmail,
      subject: `Leave Approval Request from ${employee.name}`,
      html: generateLeaveApprovalHTML({ managerName, managerEmail, leave, employee, leaveStats })
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
function generateLeaveApprovalHTML({ managerName, managerEmail, leave, employee, leaveStats }) {
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f58327 0%, #ff9d4d 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #ffffff; padding: 30px; }
        .detail-box { margin: 20px 0; padding: 20px; background: #fff7f0; border-left: 4px solid #f58327; border-radius: 4px; }
        .detail-row { margin: 12px 0; display: flex; flex-wrap: wrap; }
        .label { font-weight: bold; color: #f58327; min-width: 120px; }
        .value { color: #333; flex: 1; }
        .button-container { margin: 30px 0; text-align: center; }
        .button { display: inline-block; padding: 14px 32px; margin: 8px 4px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; transition: all 0.3s; }
        .approve { background: #10b981; color: white; box-shadow: 0 2px 4px rgba(16,185,129,0.3); }
        .approve:hover { background: #059669; box-shadow: 0 4px 8px rgba(16,185,129,0.4); }
        .reject { background: #ef4444; color: white; box-shadow: 0 2px 4px rgba(239,68,68,0.3); }
        .reject:hover { background: #dc2626; box-shadow: 0 4px 8px rgba(239,68,68,0.4); }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .logo { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 5px; }
        
        @media only screen and (max-width: 600px) {
          .container { margin: 10px !important; border-radius: 4px !important; }
          .header { padding: 20px 15px !important; }
          .header h1 { font-size: 20px !important; }
          .content { padding: 20px 15px !important; }
          .detail-box { padding: 15px !important; margin: 15px 0 !important; }
          .detail-row { flex-direction: column; margin: 10px 0 !important; }
          .label { min-width: auto !important; margin-bottom: 4px; }
          .button-container { margin: 20px 0 !important; }
          .button { display: block !important; width: 100% !important; margin: 8px 0 !important; padding: 12px 16px !important; font-size: 14px !important; box-sizing: border-box; }
          .footer { padding: 15px 10px !important; font-size: 11px !important; }
        }
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

          ${leaveStats ? `
          <div style="margin: 25px 0; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 15px 0; color: #f58327; font-size: 16px; font-weight: 600;">📊 Employee Leave Balance</h3>

            ${leave.type === 'Sick' ? `
            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 6px; border-left: 4px solid #ef4444;">
              <h4 style="margin: 0 0 12px 0; color: #ef4444; font-size: 14px; font-weight: 600;">🤒 Sick Leaves (Requested)</h4>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #3b82f6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Limit/Year</div>
                  <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${leaveStats.sickLeaveLimit || 3}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Used</div>
                  <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">${leaveStats.sickThisYear || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid ${(leaveStats.remainingSickLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingSickLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Available</div>
                  <div style="font-size: 20px; font-weight: 700; color: ${(leaveStats.remainingSickLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingSickLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingSickLeaves || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #f59e0b;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">This Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${leaveStats.sickThisMonth || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #ec4899;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Last Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #ec4899;">${leaveStats.sickLastMonth || 0}</div>
                </div>
              </div>
            </div>

            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 6px; border-left: 4px solid #f58327;">
              <h4 style="margin: 0 0 12px 0; color: #f58327; font-size: 14px; font-weight: 600;">🌴 Annual Leaves</h4>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #3b82f6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Limit/Year</div>
                  <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${leaveStats.leaveLimit || 10}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Used</div>
                  <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">${leaveStats.thisYear || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Available</div>
                  <div style="font-size: 20px; font-weight: 700; color: ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingLeaves || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #f59e0b;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">This Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #ec4899;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Last Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #ec4899;">${leaveStats.lastMonth || 0}</div>
                </div>
              </div>
            </div>
            ` : leave.type === 'Maternity' ? `
            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 6px; border-left: 4px solid #ec4899;">
              <h4 style="margin: 0 0 12px 0; color: #ec4899; font-size: 14px; font-weight: 600;">🤰 Maternity Leave (Requested)</h4>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #3b82f6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Limit/Year</div>
                  <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${leaveStats.maternityLeaveLimit || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Used</div>
                  <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">${leaveStats.maternityThisYear || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid ${(leaveStats.remainingMaternityLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingMaternityLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Available</div>
                  <div style="font-size: 20px; font-weight: 700; color: ${(leaveStats.remainingMaternityLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingMaternityLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingMaternityLeaves || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #f59e0b;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">This Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${leaveStats.maternityThisMonth || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #ec4899;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Last Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #ec4899;">${leaveStats.maternityLastMonth || 0}</div>
                </div>
              </div>
            </div>

            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 6px; border-left: 4px solid #f58327;">
              <h4 style="margin: 0 0 12px 0; color: #f58327; font-size: 14px; font-weight: 600;">🌴 Annual Leaves</h4>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #3b82f6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Limit/Year</div>
                  <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${leaveStats.leaveLimit || 10}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Used</div>
                  <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">${leaveStats.thisYear || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Available</div>
                  <div style="font-size: 20px; font-weight: 700; color: ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingLeaves || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #f59e0b;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">This Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #ec4899;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Last Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #ec4899;">${leaveStats.lastMonth || 0}</div>
                </div>
              </div>
            </div>
            ` : leave.type === 'Paternity' ? `
            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 6px; border-left: 4px solid #3b82f6;">
              <h4 style="margin: 0 0 12px 0; color: #3b82f6; font-size: 14px; font-weight: 600;">👨‍👦 Paternity Leave (Requested)</h4>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #3b82f6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Limit/Year</div>
                  <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${leaveStats.paternityLeaveLimit || 2}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Used</div>
                  <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">${leaveStats.paternityThisYear || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid ${(leaveStats.remainingPaternityLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingPaternityLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Available</div>
                  <div style="font-size: 20px; font-weight: 700; color: ${(leaveStats.remainingPaternityLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingPaternityLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingPaternityLeaves || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #f59e0b;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">This Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${leaveStats.paternityThisMonth || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #ec4899;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Last Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #ec4899;">${leaveStats.paternityLastMonth || 0}</div>
                </div>
              </div>
            </div>

            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 6px; border-left: 4px solid #f58327;">
              <h4 style="margin: 0 0 12px 0; color: #f58327; font-size: 14px; font-weight: 600;">🌴 Annual Leaves</h4>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #3b82f6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Limit/Year</div>
                  <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${leaveStats.leaveLimit || 10}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Used</div>
                  <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">${leaveStats.thisYear || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Available</div>
                  <div style="font-size: 20px; font-weight: 700; color: ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingLeaves || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #f59e0b;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">This Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #ec4899;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Last Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #ec4899;">${leaveStats.lastMonth || 0}</div>
                </div>
              </div>
            </div>
            ` : `
            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 6px; border-left: 4px solid #f58327;">
              <h4 style="margin: 0 0 12px 0; color: #f58327; font-size: 14px; font-weight: 600;">🌴 Annual Leaves</h4>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #3b82f6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Limit/Year</div>
                  <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${leaveStats.leaveLimit || 10}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Used</div>
                  <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">${leaveStats.thisYear || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Available</div>
                  <div style="font-size: 20px; font-weight: 700; color: ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingLeaves || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #f59e0b;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">This Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
                </div>
                <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #ec4899;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Last Month</div>
                  <div style="font-size: 20px; font-weight: 700; color: #ec4899;">${leaveStats.lastMonth || 0}</div>
                </div>
              </div>
            </div>
            `}
          </div>
          ` : ''}

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
 * @param {Object} params - Email parameters
 * @param {string} params.employeeEmail - Employee's email address
 * @param {string} params.employeeName - Employee's name
 * @param {Object} params.leave - Leave request object
 * @param {string} params.status - 'Approved' | 'Rejected'
 * @param {string} params.managerName - Name of person who approved/rejected
 * @param {string} params.approverType - 'Manager' | 'CC' | 'HR' (for final approval)
 * @returns {Promise<boolean>} - Success status
 */
export async function sendLeaveStatusEmail({ 
  employeeEmail, 
  employeeName, 
  leave, 
  status, 
  managerName,
  approverType = 'Manager'
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const isFinalApproval = approverType === 'HR';
    const subject = isFinalApproval 
      ? `Leave ${status}: Final Approval - ${leave.type} Leave`
      : `Leave Update: ${status} by ${approverType} - ${leave.type} Leave`;
    
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'BaseCamp StaffSync <onboarding@resend.dev>',
      to: employeeEmail,
      subject: subject,
      html: generateLeaveStatusHTML({ 
        employeeName, 
        leave, 
        status, 
        managerName,
        approverType,
        isFinalApproval
      })
    });

    console.log(`📧 Leave status email sent to: ${employeeEmail} (${status} by ${approverType})`);
    return true;
  } catch (error) {
    console.error('Error sending leave status email:', error);
    return false;
  }
}

/**
 * Generate HTML template for employee leave status notification
 */
function generateLeaveStatusHTML({ 
  employeeName, 
  leave, 
  status, 
  managerName,
  approverType,
  isFinalApproval
}) {
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

  const leaveDays = calculateBusinessDays(leave.startDate, leave.endDate);

  // Status colors and icons
  const isApproved = status === 'Approved';
  const statusColor = isApproved ? '#10b981' : '#ef4444';
  const statusIcon = isApproved ? '✅' : '❌';
  const headerGradient = 'linear-gradient(135deg, #f58327 0%, #ff9d4d 100%)';

  // Message based on approver type
  let statusMessage = '';
  if (isFinalApproval) {
    statusMessage = `Your <strong>${leave.type}</strong> leave request has been <strong style="color: ${statusColor};">${status.toLowerCase()}</strong> by <strong>HR (${managerName})</strong>. This is the <strong style="color: #f58327;">FINAL APPROVAL</strong>.`;
  } else if (approverType === 'CC') {
    statusMessage = `Your <strong>${leave.type}</strong> leave request has been <strong style="color: ${statusColor};">${status.toLowerCase()}</strong> by <strong>Additional Recipient (${managerName})</strong>.`;
  } else {
    statusMessage = `Your <strong>${leave.type}</strong> leave request has been <strong style="color: ${statusColor};">${status.toLowerCase()}</strong> by <strong>Reporting Manager (${managerName})</strong>.`;
  }

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/employee`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: ${headerGradient}; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .content { background: #ffffff; padding: 30px; }
        .detail-box { margin: 20px 0; padding: 20px; background: #fff7f0; border-left: 4px solid #f58327; border-radius: 4px; }
        .detail-row { margin: 12px 0; display: flex; flex-wrap: wrap; }
        .label { font-weight: bold; color: #f58327; min-width: 120px; }
        .value { color: #333; flex: 1; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; background: ${statusColor}; color: white; font-size: 16px; margin: 10px 0; }
        .final-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; background: #f58327; color: white; font-size: 14px; margin: 10px 0; }
        .button { display: inline-block; padding: 14px 32px; margin: 20px 0; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; background: #f58327; color: white; box-shadow: 0 2px 4px rgba(245,131,39,0.3); }
        .button:hover { background: #e66f1a; box-shadow: 0 4px 8px rgba(245,131,39,0.4); }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .logo { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 5px; }
        .info-box { padding: 15px; background: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${statusColor}; border-radius: 4px; margin: 20px 0; }
        
        @media only screen and (max-width: 600px) {
          .container { margin: 10px !important; border-radius: 4px !important; }
          .header { padding: 20px 15px !important; }
          .header h1 { font-size: 18px !important; flex-direction: column; gap: 5px !important; }
          .content { padding: 20px 15px !important; }
          .detail-box { padding: 15px !important; margin: 15px 0 !important; }
          .detail-row { flex-direction: column; margin: 10px 0 !important; }
          .label { min-width: auto !important; margin-bottom: 4px; }
          .status-badge { font-size: 14px !important; padding: 6px 12px !important; }
          .final-badge { font-size: 12px !important; padding: 6px 12px !important; }
          .button { display: block !important; width: 100% !important; padding: 12px 16px !important; font-size: 14px !important; box-sizing: border-box; text-align: center; }
          .info-box { padding: 12px !important; margin: 15px 0 !important; font-size: 13px !important; }
          .footer { padding: 15px 10px !important; font-size: 11px !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">BaseCamp StaffSync</div>
          <h1><span>${statusIcon}</span> Leave ${status}</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #333;">Dear <strong>${employeeName}</strong>,</p>
          <p style="font-size: 15px; color: #555; line-height: 1.8;">${statusMessage}</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <span class="status-badge">${statusIcon} ${status}</span>
            ${isFinalApproval ? '<br><span class="final-badge">🎯 FINAL APPROVAL BY HR</span>' : ''}
          </div>

          ${isFinalApproval ? `
          <div class="info-box">
            <p style="margin: 0; font-size: 14px; color: ${statusColor}; font-weight: 600;">
              ${isApproved 
                ? '✅ Your leave has been officially approved by HR. You can now proceed with your leave plans.' 
                : '❌ Your leave has been rejected by HR. Please contact HR for more information.'}
            </p>
          </div>
          ` : `
          <div class="info-box">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              ${isApproved 
                ? '⏳ Your leave is progressing through the approval workflow. HR will provide the final approval.' 
                : '⚠️ Your leave was rejected at this stage. Please check your dashboard for more details.'}
            </p>
          </div>
          `}

          <div class="detail-box">
            <div class="detail-row">
              <span class="label">Leave Type:</span>
              <span class="value">${leave.type}</span>
            </div>
            <div class="detail-row">
              <span class="label">Duration:</span>
              <span class="value">${leaveDays} business day${leaveDays !== 1 ? 's' : ''} <span style="font-size: 11px; color: #6b7280;">(weekends excluded)</span></span>
            </div>
            <div class="detail-row">
              <span class="label">From:</span>
              <span class="value">${startDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">To:</span>
              <span class="value">${endDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">${isFinalApproval ? 'Approved by HR:' : approverType === 'CC' ? 'Reviewed by:' : 'Approved by Manager:'}</span>
              <span class="value">${managerName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Current Status:</span>
              <span class="value"><strong style="color: ${statusColor};">${leave.status || status}</strong></span>
            </div>
            ${leave.reason ? `
            <div class="detail-row">
              <span class="label">Reason:</span>
              <span class="value">${leave.reason}</span>
            </div>
            ` : ''}
          </div>

          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">View in Dashboard</a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-top: 20px; text-align: center;">
            You can view the complete approval status and details in your employee dashboard.
          </p>
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
 * Send HR notification when employee requests leave or manager approves/rejects
 * @param {Object} params - Email parameters
 * @param {string} params.hrEmail - HR's email address
 * @param {string} params.hrName - HR's name
 * @param {Object} params.leave - Leave request object with populated user
 * @param {Object} params.employee - Employee object with department info
 * @param {Object} params.leaveStats - Leave statistics (thisMonth, lastMonth, thisYear, thisQuarter)
 * @param {string} params.eventType - 'request' | 'approved' | 'rejected'
 * @param {string} params.managerName - Manager who approved/rejected (for approve/reject events)
 * @returns {Promise<boolean>} - Success status
 */
export async function sendHRNotificationEmail({ 
  hrEmail, 
  hrName, 
  leave, 
  employee, 
  leaveStats,
  eventType,
  managerName 
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    let subject = '';
    if (eventType === 'request') {
      subject = `New Leave Request from ${employee.name}`;
    } else if (eventType === 'approved') {
      subject = `Leave Approved: ${employee.name}`;
    } else if (eventType === 'rejected') {
      subject = `Leave Rejected: ${employee.name}`;
    }

    await resend.emails.send({
      from: process.env.FROM_EMAIL ||'BaseCamp StaffSync <onboarding@resend.dev>',
      to: hrEmail,
      subject: subject,
      html: generateHRNotificationHTML({ 
        hrName, 
        leave, 
        employee, 
        leaveStats, 
        eventType, 
        managerName 
      })
    });

    console.log(`📧 HR notification email sent to: ${hrEmail} (${eventType})`);
    return true;
  } catch (error) {
    console.error('Error sending HR notification email:', error);
    return false;
  }
}

/**
 * Generate HTML template for HR notification email
 */
function generateHRNotificationHTML({ 
  hrName, 
  leave, 
  employee, 
  leaveStats, 
  eventType, 
  managerName 
}) {
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

  // Calculate leave duration (business days only, excluding weekends)
  const leaveDays = calculateBusinessDays(leave.startDate, leave.endDate);

  // Status badge color
  let statusColor = '#f59e0b'; // Pending
  let statusIcon = '⏳';
  let headerGradient = 'linear-gradient(135deg, #f58327 0%, #ff9d4d 100%)';
  
  if (eventType === 'approved') {
    statusColor = '#10b981';
    statusIcon = '✅';
  } else if (eventType === 'rejected') {
    statusColor = '#ef4444';
    statusIcon = '❌';
  }

  // Event message
  let eventMessage = '';
  if (eventType === 'request') {
    eventMessage = `<strong style="color: #f58327;">${employee.name}</strong> has submitted a new leave request.`;
  } else if (eventType === 'approved') {
    eventMessage = `<strong style="color: #f58327;">${employee.name}</strong>'s leave request has been <strong style="color: #10b981;">approved</strong> by ${managerName}.`;
  } else if (eventType === 'rejected') {
    eventMessage = `<strong style="color: #f58327;">${employee.name}</strong>'s leave request has been <strong style="color: #ef4444;">rejected</strong> by ${managerName}.`;
  }



  // Additional recipients section
  const formatAdditionalRecipients = () => {
    if (!leave.additionalRecipients || leave.additionalRecipients.length === 0) {
      return '';
    }

    return leave.additionalRecipients.map(recipient => {
      let recipientStatusColor = '#f59e0b';
      let recipientIcon = '⏳';
      
      if (recipient.status === 'Approved') {
        recipientStatusColor = '#10b981';
        recipientIcon = '✅';
      } else if (recipient.status === 'Rejected') {
        recipientStatusColor = '#ef4444';
        recipientIcon = '❌';
      }

      return `
        <div style="margin: 8px 0; padding: 12px; background: #f9fafb; border-left: 3px solid ${recipientStatusColor}; border-radius: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div>
              <strong style="color: #333;">${recipient.name}</strong>
              <span style="color: #6b7280; font-size: 13px; display: block; margin-top: 2px;">${recipient.email}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">${recipientIcon}</span>
              <span style="font-weight: 600; color: ${recipientStatusColor}; font-size: 14px;">${recipient.status}</span>
            </div>
          </div>
          ${recipient.approvedAt ? `
            <div style="color: #6b7280; font-size: 12px; margin-top: 6px;">
              Processed: ${new Date(recipient.approvedAt).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  };

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/hr`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 650px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: ${headerGradient}; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .content { background: #ffffff; padding: 30px; }
        .detail-box { margin: 20px 0; padding: 20px; background: #fff7f0; border-left: 4px solid #f58327; border-radius: 4px; }
        .detail-row { margin: 12px 0; display: flex; flex-wrap: wrap; }
        .label { font-weight: bold; color: #f58327; min-width: 140px; }
        .value { color: #333; flex: 1; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #bae6fd; }
        .stat-label { font-size: 12px; color: #0369a1; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #0c4a6e; }
        .stat-unit { font-size: 14px; color: #0369a1; }
        .section-title { font-size: 16px; font-weight: bold; color: #333; margin: 25px 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #f58327; }
        .button { display: inline-block; padding: 14px 32px; margin: 20px 0; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; background: #f58327; color: white; box-shadow: 0 2px 4px rgba(245,131,39,0.3); }
        .button:hover { background: #e66f1a; box-shadow: 0 4px 8px rgba(245,131,39,0.4); }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .logo { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 5px; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 16px; font-weight: 600; background: ${statusColor}; color: white; font-size: 14px; }
        
        @media only screen and (max-width: 600px) {
          .container { margin: 10px !important; border-radius: 4px !important; }
          .header { padding: 20px 15px !important; }
          .header h1 { font-size: 18px !important; flex-direction: column; gap: 5px !important; }
          .content { padding: 20px 15px !important; }
          .detail-box { padding: 15px !important; margin: 15px 0 !important; }
          .detail-row { flex-direction: column; margin: 10px 0 !important; }
          .label { min-width: auto !important; margin-bottom: 4px; }
          .stats-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
          .stat-card { padding: 12px !important; }
          .stat-value { font-size: 20px !important; }
          .section-title { font-size: 14px !important; margin: 20px 0 10px 0 !important; }
          .button { display: block !important; width: 100% !important; padding: 12px 16px !important; font-size: 14px !important; box-sizing: border-box; text-align: center; }
          .status-badge { font-size: 12px !important; padding: 5px 10px !important; }
          .footer { padding: 15px 10px !important; font-size: 11px !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">BaseCamp StaffSync</div>
          <h1><span>${statusIcon}</span> Leave ${eventType === 'request' ? 'Request' : eventType === 'approved' ? 'Approved' : 'Rejected'}</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #333;">Dear <strong>${hrName}</strong>,</p>
          <p style="font-size: 15px; color: #555; line-height: 1.8;">${eventMessage}</p>
          
          <div class="detail-box">
            <div class="detail-row">
              <span class="label">Employee:</span>
              <span class="value">${employee.name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Email:</span>
              <span class="value">${employee.email}</span>
            </div>
            <div class="detail-row">
              <span class="label">Department:</span>
              <span class="value">${employee.department?.name || 'Not Assigned'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Leave Type:</span>
              <span class="value">${leave.type}</span>
            </div>
            <div class="detail-row">
              <span class="label">Duration:</span>
              <span class="value">${leaveDays} business day${leaveDays !== 1 ? 's' : ''} <span style="font-size: 11px; color: #6b7280;">(weekends excluded)</span></span>
            </div>
            <div class="detail-row">
              <span class="label">From:</span>
              <span class="value">${startDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">To:</span>
              <span class="value">${endDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">Leave Limits:</span>
              <span class="value">
                <strong>Regular:</strong> ${employee.leave_limit || 10} days/year &nbsp;|&nbsp; 
                <strong>Sick:</strong> ${employee.sick_leave_limit || 3} days/year
              </span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value"><span class="status-badge">${leave.status}</span></span>
            </div>
            ${leave.reason ? `
            <div class="detail-row">
              <span class="label">Reason:</span>
              <span class="value">${leave.reason}</span>
            </div>
            ` : ''}
          </div>

          <div class="section-title">📊 Employee Leave Statistics</div>

          ${leave.type === 'Sick' ? `
          <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 6px; border-left: 4px solid #ef4444;">
            <h4 style="margin: 0 0 12px 0; color: #ef4444; font-size: 14px; font-weight: 600;">🤒 Sick Leaves (Requested)</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Limit/Year</div>
                <div class="stat-value" style="color: #3b82f6;">${leaveStats.sickLeaveLimit || 3}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Used</div>
                <div class="stat-value" style="color: #8b5cf6;">${leaveStats.sickThisYear || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Available</div>
                <div class="stat-value" style="color: ${(leaveStats.remainingSickLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingSickLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingSickLeaves || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">This Month</div>
                <div class="stat-value" style="color: #f59e0b;">${leaveStats.sickThisMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Last Month</div>
                <div class="stat-value" style="color: #ec4899;">${leaveStats.sickLastMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
            </div>
          </div>

          <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 6px; border-left: 4px solid #f58327;">
            <h4 style="margin: 0 0 12px 0; color: #f58327; font-size: 14px; font-weight: 600;">🌴 Annual Leaves</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Limit/Year</div>
                <div class="stat-value" style="color: #3b82f6;">${leaveStats.leaveLimit || 10}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Used</div>
                <div class="stat-value" style="color: #8b5cf6;">${leaveStats.thisYear || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Available</div>
                <div class="stat-value" style="color: ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingLeaves || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">This Month</div>
                <div class="stat-value" style="color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Last Month</div>
                <div class="stat-value" style="color: #ec4899;">${leaveStats.lastMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
            </div>
          </div>
          ` : leave.type === 'Maternity' ? `
          <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 6px; border-left: 4px solid #ec4899;">
            <h4 style="margin: 0 0 12px 0; color: #ec4899; font-size: 14px; font-weight: 600;">🤰 Maternity Leave (Requested)</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Limit/Year</div>
                <div class="stat-value" style="color: #3b82f6;">${leaveStats.maternityLeaveLimit || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Used</div>
                <div class="stat-value" style="color: #8b5cf6;">${leaveStats.maternityThisYear || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Available</div>
                <div class="stat-value" style="color: ${(leaveStats.remainingMaternityLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingMaternityLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingMaternityLeaves || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">This Month</div>
                <div class="stat-value" style="color: #f59e0b;">${leaveStats.maternityThisMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Last Month</div>
                <div class="stat-value" style="color: #ec4899;">${leaveStats.maternityLastMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
            </div>
          </div>

          <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 6px; border-left: 4px solid #f58327;">
            <h4 style="margin: 0 0 12px 0; color: #f58327; font-size: 14px; font-weight: 600;">🌴 Annual Leaves</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Limit/Year</div>
                <div class="stat-value" style="color: #3b82f6;">${leaveStats.leaveLimit || 10}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Used</div>
                <div class="stat-value" style="color: #8b5cf6;">${leaveStats.thisYear || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Available</div>
                <div class="stat-value" style="color: ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingLeaves || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">This Month</div>
                <div class="stat-value" style="color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Last Month</div>
                <div class="stat-value" style="color: #ec4899;">${leaveStats.lastMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
            </div>
          </div>
          ` : leave.type === 'Paternity' ? `
          <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 6px; border-left: 4px solid #3b82f6;">
            <h4 style="margin: 0 0 12px 0; color: #3b82f6; font-size: 14px; font-weight: 600;">👨‍👦 Paternity Leave (Requested)</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Limit/Year</div>
                <div class="stat-value" style="color: #3b82f6;">${leaveStats.paternityLeaveLimit || 2}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Used</div>
                <div class="stat-value" style="color: #8b5cf6;">${leaveStats.paternityThisYear || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Available</div>
                <div class="stat-value" style="color: ${(leaveStats.remainingPaternityLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingPaternityLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingPaternityLeaves || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">This Month</div>
                <div class="stat-value" style="color: #f59e0b;">${leaveStats.paternityThisMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Last Month</div>
                <div class="stat-value" style="color: #ec4899;">${leaveStats.paternityLastMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
            </div>
          </div>

          <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 6px; border-left: 4px solid #f58327;">
            <h4 style="margin: 0 0 12px 0; color: #f58327; font-size: 14px; font-weight: 600;">🌴 Annual Leaves</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Limit/Year</div>
                <div class="stat-value" style="color: #3b82f6;">${leaveStats.leaveLimit || 10}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Used</div>
                <div class="stat-value" style="color: #8b5cf6;">${leaveStats.thisYear || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Available</div>
                <div class="stat-value" style="color: ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingLeaves || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">This Month</div>
                <div class="stat-value" style="color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Last Month</div>
                <div class="stat-value" style="color: #ec4899;">${leaveStats.lastMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
            </div>
          </div>
          ` : `
          <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 6px; border-left: 4px solid #f58327;">
            <h4 style="margin: 0 0 12px 0; color: #f58327; font-size: 14px; font-weight: 600;">🌴 Annual Leaves</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Limit/Year</div>
                <div class="stat-value" style="color: #3b82f6;">${leaveStats.leaveLimit || 10}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Used</div>
                <div class="stat-value" style="color: #8b5cf6;">${leaveStats.thisYear || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Available</div>
                <div class="stat-value" style="color: ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingLeaves || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">This Month</div>
                <div class="stat-value" style="color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Last Month</div>
                <div class="stat-value" style="color: #ec4899;">${leaveStats.lastMonth || 0}</div>
                <div class="stat-unit">days</div>
              </div>
            </div>
          </div>
          `}

          ${leave.additionalRecipients && leave.additionalRecipients.length > 0 ? `
          <div class="section-title">📧 Additional Recipients (CC)</div>
          <p style="font-size: 13px; color: #6b7280; margin: 10px 0;">
            These recipients were copied on the leave request for informational purposes.
          </p>
          ${formatAdditionalRecipients()}
          ` : ''}

          <div style="text-align: center; margin: 25px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background: #f58327; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; box-shadow: 0 2px 4px rgba(245,131,39,0.3);">View in Dashboard</a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-top: 20px; text-align: center;">
            This is an informational notification for HR records. You can manage this leave request from your dashboard.
          </p>
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
 * Send admin notification email for leave request events
 * @param {Object} params - Email parameters
 * @param {string} params.adminEmail - Admin's email address
 * @param {string} params.adminName - Admin's name
 * @param {Object} params.leave - Leave request object
 * @param {Object} params.employee - Employee object
 * @param {Object} params.leaveStats - Leave statistics object
 * @param {string} params.eventType - Event type: 'new_request', 'approved', 'rejected'
 * @param {string} params.actionBy - Name of person who took action (for status changes)
 * @returns {Promise<boolean>} - Success status
 */
export async function sendAdminNotificationEmail({ 
  adminEmail, 
  adminName, 
  leave, 
  employee, 
  leaveStats,
  eventType,
  actionBy 
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    let subject = '';
    if (eventType === 'new_request') {
      subject = `🆕 New Leave Request: ${employee.name}`;
    } else if (eventType === 'approved') {
      subject = `✅ Leave Approved: ${employee.name}`;
    } else if (eventType === 'rejected') {
      subject = `❌ Leave Rejected: ${employee.name}`;
    }

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

    const leaveDays = calculateBusinessDays(leave.startDate, leave.endDate);

    let headerGradient = 'linear-gradient(135deg, #f58327 0%, #ff9d4d 100%)';
    let statusColor = '#3b82f6';
    let statusText = 'New Request';
    let statusIcon = '🆕';
    
    if (eventType === 'approved') {
      statusColor = '#10b981';
      statusText = 'Approved';
      statusIcon = '✅';
    } else if (eventType === 'rejected') {
      statusColor = '#ef4444';
      statusText = 'Rejected';
      statusIcon = '❌';
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Notification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: ${headerGradient}; padding: 30px 20px; text-align: center; color: #ffffff; }
        .content { padding: 30px; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        .info-box { background-color: #f9fafb; border-left: 4px solid ${statusColor}; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background-color: ${statusColor}; color: #ffffff; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; }
        .stat-card { background: white; padding: 12px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb; }
        .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
        .stat-value { font-size: 20px; font-weight: 700; color: #0c4a6e; }
        .stat-unit { font-size: 10px; color: #9ca3af; margin-top: 2px; }
        
        @media only screen and (max-width: 600px) {
          .container { margin: 0 !important; }
          .header { padding: 20px 15px !important; }
          .header h1 { font-size: 20px !important; }
          .content { padding: 20px 15px !important; }
          .info-box { padding: 12px !important; margin: 12px 0 !important; }
          .stats-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
          .stat-card { padding: 10px !important; }
          .stat-value { font-size: 18px !important; }
          .footer { padding: 15px 10px !important; font-size: 11px !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">${statusIcon} Leave Request ${statusText}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Admin Notification</p>
        </div>
        <div class="content">
          <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${adminName}</strong>,</p>
          
          ${eventType === 'new_request' ? 
            `<p>A new leave request has been submitted and requires attention.</p>` : 
            `<p>A leave request status has been updated by <strong>${actionBy}</strong>.</p>`
          }
          
          <div class="info-box">
            <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px;">Request Details</h3>
            <p style="margin: 8px 0;"><strong>Employee:</strong> ${employee.name}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${employee.email}</p>
            <p style="margin: 8px 0;"><strong>Department:</strong> ${employee.department?.name || 'N/A'}</p>
            <p style="margin: 8px 0;"><strong>Leave Type:</strong> <span class="badge">${leave.type}</span></p>
            <p style="margin: 8px 0;"><strong>Duration:</strong> ${leaveDays} business day${leaveDays !== 1 ? 's' : ''}</p>
            <p style="margin: 8px 0;"><strong>Start Date:</strong> ${startDate}</p>
            <p style="margin: 8px 0;"><strong>End Date:</strong> ${endDate}</p>
            ${leave.reason ? `<p style="margin: 8px 0;"><strong>Reason:</strong> ${leave.reason}</p>` : ''}
            <p style="margin: 8px 0;"><strong>Status:</strong> <span class="badge">${statusText}</span></p>
            ${eventType !== 'new_request' ? `<p style="margin: 8px 0;"><strong>Action By:</strong> ${actionBy}</p>` : ''}
          </div>
          
          ${leaveStats ? `
          <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 15px 0; color: #f58327; font-size: 16px; font-weight: 600;">📊 Employee Leave Balance</h3>

            ${leave.type === 'Sick' ? `
            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 6px; border-left: 4px solid #ef4444;">
              <h4 style="margin: 0 0 12px 0; color: #ef4444; font-size: 14px; font-weight: 600;">🤒 Sick Leaves (Requested)</h4>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Limit/Year</div>
                  <div class="stat-value" style="color: #3b82f6;">${leaveStats.sickLeaveLimit || 3}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Used</div>
                  <div class="stat-value" style="color: #8b5cf6;">${leaveStats.sickThisYear || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Available</div>
                  <div class="stat-value" style="color: ${(leaveStats.remainingSickLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingSickLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingSickLeaves || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">This Month</div>
                  <div class="stat-value" style="color: #f59e0b;">${leaveStats.sickThisMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Last Month</div>
                  <div class="stat-value" style="color: #ec4899;">${leaveStats.sickLastMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
              </div>
            </div>

            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 6px; border-left: 4px solid #f58327;">
              <h4 style="margin: 0 0 12px 0; color: #f58327; font-size: 14px; font-weight: 600;">🌴 Annual Leaves</h4>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Limit/Year</div>
                  <div class="stat-value" style="color: #3b82f6;">${leaveStats.leaveLimit || 10}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Used</div>
                  <div class="stat-value" style="color: #8b5cf6;">${leaveStats.thisYear || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Available</div>
                  <div class="stat-value" style="color: ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingLeaves || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">This Month</div>
                  <div class="stat-value" style="color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Last Month</div>
                  <div class="stat-value" style="color: #ec4899;">${leaveStats.lastMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
              </div>
            </div>
            ` : leave.type === 'Maternity' ? `
            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 6px; border-left: 4px solid #ec4899;">
              <h4 style="margin: 0 0 12px 0; color: #ec4899; font-size: 14px; font-weight: 600;">🤰 Maternity Leave (Requested)</h4>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Limit/Year</div>
                  <div class="stat-value" style="color: #3b82f6;">${leaveStats.maternityLeaveLimit || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Used</div>
                  <div class="stat-value" style="color: #8b5cf6;">${leaveStats.maternityThisYear || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Available</div>
                  <div class="stat-value" style="color: ${(leaveStats.remainingMaternityLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingMaternityLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingMaternityLeaves || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">This Month</div>
                  <div class="stat-value" style="color: #f59e0b;">${leaveStats.maternityThisMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Last Month</div>
                  <div class="stat-value" style="color: #ec4899;">${leaveStats.maternityLastMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
              </div>
            </div>

            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 6px; border-left: 4px solid #f58327;">
              <h4 style="margin: 0 0 12px 0; color: #f58327; font-size: 14px; font-weight: 600;">🌴 Annual Leaves</h4>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Limit/Year</div>
                  <div class="stat-value" style="color: #3b82f6;">${leaveStats.leaveLimit || 10}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Used</div>
                  <div class="stat-value" style="color: #8b5cf6;">${leaveStats.thisYear || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Available</div>
                  <div class="stat-value" style="color: ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingLeaves || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">This Month</div>
                  <div class="stat-value" style="color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Last Month</div>
                  <div class="stat-value" style="color: #ec4899;">${leaveStats.lastMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
              </div>
            </div>
            ` : leave.type === 'Paternity' ? `
            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 6px; border-left: 4px solid #3b82f6;">
              <h4 style="margin: 0 0 12px 0; color: #3b82f6; font-size: 14px; font-weight: 600;">👨‍👦 Paternity Leave (Requested)</h4>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Limit/Year</div>
                  <div class="stat-value" style="color: #3b82f6;">${leaveStats.paternityLeaveLimit || 2}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Used</div>
                  <div class="stat-value" style="color: #8b5cf6;">${leaveStats.paternityThisYear || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Available</div>
                  <div class="stat-value" style="color: ${(leaveStats.remainingPaternityLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingPaternityLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingPaternityLeaves || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">This Month</div>
                  <div class="stat-value" style="color: #f59e0b;">${leaveStats.paternityThisMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Last Month</div>
                  <div class="stat-value" style="color: #ec4899;">${leaveStats.paternityLastMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
              </div>
            </div>

            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 6px; border-left: 4px solid #f58327;">
              <h4 style="margin: 0 0 12px 0; color: #f58327; font-size: 14px; font-weight: 600;">🌴 Annual Leaves</h4>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Limit/Year</div>
                  <div class="stat-value" style="color: #3b82f6;">${leaveStats.leaveLimit || 10}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Used</div>
                  <div class="stat-value" style="color: #8b5cf6;">${leaveStats.thisYear || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Available</div>
                  <div class="stat-value" style="color: ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingLeaves || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">This Month</div>
                  <div class="stat-value" style="color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Last Month</div>
                  <div class="stat-value" style="color: #ec4899;">${leaveStats.lastMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
              </div>
            </div>
            ` : `
            <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 6px; border-left: 4px solid #f58327;">
              <h4 style="margin: 0 0 12px 0; color: #f58327; font-size: 14px; font-weight: 600;">🌴 Annual Leaves</h4>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Limit/Year</div>
                  <div class="stat-value" style="color: #3b82f6;">${leaveStats.leaveLimit || 10}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Used</div>
                  <div class="stat-value" style="color: #8b5cf6;">${leaveStats.thisYear || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Available</div>
                  <div class="stat-value" style="color: ${(leaveStats.remainingLeaves || 0) < 0 ? '#ef4444' : (leaveStats.remainingLeaves || 0) === 0 ? '#f59e0b' : '#10b981'};">${leaveStats.remainingLeaves || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">This Month</div>
                  <div class="stat-value" style="color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Last Month</div>
                  <div class="stat-value" style="color: #ec4899;">${leaveStats.lastMonth || 0}</div>
                  <div class="stat-unit">days</div>
                </div>
              </div>
            </div>
            `}
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin" style="display: inline-block; padding: 14px 32px; background: #f58327; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; box-shadow: 0 2px 4px rgba(245,131,39,0.3);">View in Dashboard</a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px; text-align: center;">
            This is an informational notification for admin records. You can view all requests from your admin dashboard.
          </p>
        </div>
        <div class="footer">
          <p style="margin: 5px 0;"><strong style="color: #f58327;">BaseCamp StaffSync</strong></p>
          <p style="margin: 5px 0;">This is an automated email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'BaseCamp StaffSync <onboarding@resend.dev>',
      to: adminEmail,
      subject: subject,
      html: html
    });

    console.log(`📧 Admin notification email sent to: ${adminEmail} (${eventType})`);
    return true;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return false;
  }
}
