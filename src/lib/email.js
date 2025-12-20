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

          ${leaveStats ? `
          <div style="margin: 25px 0; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 15px 0; color: #f58327; font-size: 16px; font-weight: 600;">Employee Leave Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
              <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #3b82f6;">
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Leave Limit</div>
                <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${leaveStats.leaveLimit || 12}</div>
              </div>
              <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">This Year</div>
                <div style="font-size: 20px; font-weight: 700; color: #10b981;">${leaveStats.thisYear || 0}</div>
              </div>
              <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">This Quarter</div>
                <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">${leaveStats.thisQuarter || 0}</div>
              </div>
              <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #f59e0b;">
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">This Month</div>
                <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${leaveStats.thisMonth || 0}</div>
              </div>
              <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #ec4899;">
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Last Month</div>
                <div style="font-size: 20px; font-weight: 700; color: #ec4899;">${leaveStats.lastMonth || 0}</div>
              </div>
              <div style="padding: 12px; background: white; border-radius: 6px; border-left: 3px solid ${(leaveStats.approvedLeavesCount || 0) <= 2 ? '#ef4444' : '#10b981'};">
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Approved (Half)</div>
                <div style="font-size: 20px; font-weight: 700; color: ${(leaveStats.approvedLeavesCount || 0) <= 2 ? '#ef4444' : '#10b981'};">${leaveStats.approvedLeavesCount || 0}</div>
              </div>
            </div>
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
  let headerGradient = 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)';
  
  if (eventType === 'approved') {
    statusColor = '#10b981';
    statusIcon = '✅';
    headerGradient = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
  } else if (eventType === 'rejected') {
    statusColor = '#ef4444';
    statusIcon = '❌';
    headerGradient = 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';
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

  // Manager approvals section
  const formatManagerApprovals = () => {
    if (!leave.managerApprovals || leave.managerApprovals.length === 0) {
      return '<p style="color: #6b7280; font-style: italic; margin: 0;">No reporting managers assigned</p>';
    }

    return leave.managerApprovals.map(approval => {
      let approvalStatusColor = '#f59e0b';
      let approvalIcon = '⏳';
      
      if (approval.status === 'Approved') {
        approvalStatusColor = '#10b981';
        approvalIcon = '✅';
      } else if (approval.status === 'Rejected') {
        approvalStatusColor = '#ef4444';
        approvalIcon = '❌';
      }

      return `
        <div style="margin: 8px 0; padding: 12px; background: #f9fafb; border-left: 3px solid ${approvalStatusColor}; border-radius: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div>
              <strong style="color: #333;">${approval.managerName}</strong>
              <span style="color: #6b7280; font-size: 13px; display: block; margin-top: 2px;">${approval.managerEmail}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">${approvalIcon}</span>
              <span style="font-weight: 600; color: ${approvalStatusColor}; font-size: 14px;">${approval.status}</span>
            </div>
          </div>
          ${approval.approvedAt ? `
            <div style="color: #6b7280; font-size: 12px; margin-top: 6px;">
              Processed: ${new Date(approval.approvedAt).toLocaleString('en-US', { 
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
              <span class="label">Leave Limit:</span>
              <span class="value">${employee.leave_limit || 12} days/year</span>
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
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">This Month</div>
              <div class="stat-value">${leaveStats.thisMonth}</div>
              <div class="stat-unit">days</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Last Month</div>
              <div class="stat-value">${leaveStats.lastMonth}</div>
              <div class="stat-unit">days</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">This Quarter</div>
              <div class="stat-value">${leaveStats.thisQuarter}</div>
              <div class="stat-unit">days</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">This Year</div>
              <div class="stat-value">${leaveStats.thisYear}</div>
              <div class="stat-unit">days</div>
            </div>
          </div>

          <div class="section-title">👥 Reporting Manager Approvals</div>
          ${formatManagerApprovals()}

          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">View in Dashboard</a>
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
