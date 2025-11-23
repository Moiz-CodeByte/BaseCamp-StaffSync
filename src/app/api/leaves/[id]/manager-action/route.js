import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Leave } from '@/models/Leave';
import { sendLeaveStatusEmail } from '@/lib/email';

// Handle GET requests (for email links)
export async function GET(req, { params }) {
  await connectDB();

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const managerEmail = searchParams.get('email');
    const action = searchParams.get('action'); // 'approve' or 'reject'

    const errorPage = (title, message) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title} - BaseCamp StaffSync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
            background: linear-gradient(135deg, #f58327 0%, #ff9d4d 100%);
            margin: 0; padding: 20px; min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
          }
          .container {
            background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            padding: 40px; max-width: 500px; width: 100%; text-align: center;
          }
          .icon { font-size: 64px; margin-bottom: 20px; }
          h1 { color: #333; margin: 20px 0; font-size: 28px; }
          p { color: #555; font-size: 16px; line-height: 1.6; }
          .logo { color: #f58327; font-weight: 700; font-size: 18px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1>${title}</h1>
          <p>${message}</p>
          <div class="logo">BaseCamp StaffSync</div>
        </div>
      </body>
      </html>
    `;

    if (!managerEmail || !action) {
      return new Response(errorPage('Error', 'Missing required parameters'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 400
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return new Response(errorPage('Invalid Action', 'The requested action is not valid'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 400
      });
    }

    const leave = await Leave.findById(id).populate('user');
    if (!leave) {
      return new Response(errorPage('Not Found', 'The leave request you are looking for could not be found'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 404
      });
    }

    // Find the manager's approval entry
    const approvalIndex = leave.managerApprovals.findIndex(
      approval => approval.managerEmail === managerEmail
    );

    if (approvalIndex === -1) {
      return new Response(errorPage('Not Authorized', 'You are not authorized to approve this leave request'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 404
      });
    }

    // Check if already processed
    if (leave.managerApprovals[approvalIndex].status !== 'Pending') {
      const currentStatus = leave.managerApprovals[approvalIndex].status;
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Already Processed - BaseCamp StaffSync</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
              background: linear-gradient(135deg, #f58327 0%, #ff9d4d 100%);
              margin: 0; padding: 20px; min-height: 100vh;
              display: flex; align-items: center; justify-content: center;
            }
            .container {
              background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
              padding: 40px; max-width: 500px; width: 100%; text-align: center;
            }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #333; margin: 20px 0; font-size: 28px; }
            p { color: #555; font-size: 16px; line-height: 1.6; }
            .status { display: inline-block; padding: 6px 12px; border-radius: 16px; font-weight: 600; 
                     background: ${currentStatus === 'Approved' ? '#10b981' : '#ef4444'}; color: white; margin: 10px 0; }
            .logo { color: #f58327; font-weight: 700; font-size: 18px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">ℹ️</div>
            <h1>Already Processed</h1>
            <p>This leave request has already been</p>
            <div class="status">${currentStatus}</div>
            <div class="logo">BaseCamp StaffSync</div>
        </div>
      </body>
      </html>
      `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 200
      });
    }    // Update the approval status
    leave.managerApprovals[approvalIndex].status = action === 'approve' ? 'Approved' : 'Rejected';
    leave.managerApprovals[approvalIndex].approvedAt = new Date();

    await leave.save();

    // Send notification to employee
    try {
      await sendLeaveStatusEmail({
        employeeEmail: leave.user.email,
        employeeName: leave.user.name,
        leave: leave,
        status: action === 'approve' ? 'Approved' : 'Rejected',
        managerName: leave.managerApprovals[approvalIndex].managerName
      });
    } catch (emailError) {
      console.error('Failed to send status email:', emailError);
    }

    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Success - BaseCamp StaffSync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
            background: linear-gradient(135deg, #f58327 0%, #ff9d4d 100%);
            margin: 0; 
            padding: 20px; 
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
          }
          .success-icon {
            width: 80px;
            height: 80px;
            background: ${action === 'approve' ? '#10b981' : '#ef4444'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 48px;
            color: white;
          }
          h1 { 
            color: #333; 
            margin: 20px 0;
            font-size: 28px;
          }
          .message {
            color: #555;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .details {
            background: #fff7f0;
            border-left: 4px solid #f58327;
            border-radius: 8px;
            padding: 20px;
            text-align: left;
            margin: 20px 0;
          }
          .detail-row {
            margin: 12px 0;
            display: flex;
            align-items: center;
          }
          .detail-label {
            color: #f58327;
            font-weight: 600;
            min-width: 120px;
          }
          .detail-value {
            color: #333;
            flex: 1;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            background: ${action === 'approve' ? '#10b981' : '#ef4444'};
            color: white;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .logo {
            color: #f58327;
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>Action Completed Successfully!</h1>
          <p class="message">The leave request has been <span class="status-badge">${action === 'approve' ? 'Approved' : 'Rejected'}</span></p>
          
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Employee:</span>
              <span class="detail-value">${leave.user.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Leave Type:</span>
              <span class="detail-value">${leave.type}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Manager:</span>
              <span class="detail-value">${leave.managerApprovals[approvalIndex].managerName}</span>
            </div>
          </div>
          
          <div class="footer">
            <div class="logo">BaseCamp StaffSync</div>
            <p>The employee will be notified of your decision via email.</p>
          </div>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 200
    });

  } catch (error) {
    console.error('Error processing manager action:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>❌ Error</h1>
        <p>${error.message}</p>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 500
    });
  }
}

// Handle POST requests (for API calls)
export async function POST(req, { params }) {
  await connectDB();

  try {
    const { id } = await params;
    const { managerEmail, action } = await req.json(); // action: 'approve' or 'reject'

    if (!managerEmail || !action) {
      return NextResponse.json({ message: 'Manager email and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
    }

    const leave = await Leave.findById(id).populate('user');
    if (!leave) {
      return NextResponse.json({ message: 'Leave request not found' }, { status: 404 });
    }

    // Find the manager's approval entry
    const approvalIndex = leave.managerApprovals.findIndex(
      approval => approval.managerEmail === managerEmail
    );

    if (approvalIndex === -1) {
      return NextResponse.json({ message: 'Manager not found in approval list' }, { status: 404 });
    }

    // Update the approval status
    leave.managerApprovals[approvalIndex].status = action === 'approve' ? 'Approved' : 'Rejected';
    leave.managerApprovals[approvalIndex].approvedAt = new Date();

    await leave.save();

    // Send notification to employee
    try {
      await sendLeaveStatusEmail({
        employeeEmail: leave.user.email,
        employeeName: leave.user.name,
        leave: leave,
        status: action === 'approve' ? 'Approved' : 'Rejected',
        managerName: leave.managerApprovals[approvalIndex].managerName
      });
    } catch (emailError) {
      console.error('Failed to send status email:', emailError);
    }

    return NextResponse.json({ 
      message: `Leave request ${action}d successfully`,
      managerApprovals: leave.managerApprovals
    });

  } catch (error) {
    console.error('Error processing manager action:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
