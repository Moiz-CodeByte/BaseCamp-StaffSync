# Email Approval System for Leave Requests

## Overview
The system now supports email notifications to reporting managers when employees submit leave requests. Managers can approve or reject leave requests directly from their email or through the dashboard.

## How It Works

### 1. Leave Request Submission
When an employee submits a leave request:
- The system identifies the employee's reporting managers (user-specific or department-level)
- Creates approval entries in the `managerApprovals` array for each manager
- Sends email notifications to all reporting managers with approve/reject links

### 2. Manager Approvals
Each manager approval is tracked with:
- `managerEmail`: Manager's email address
- `managerName`: Manager's name
- `status`: Current status (Pending, Approved, Rejected)
- `emailSent`: Whether email notification was sent successfully
- `emailSentAt`: Timestamp of email sending
- `approvedAt`: Timestamp when manager took action

### 3. Approval Methods

#### Via Email (One-Click)
Managers receive emails with direct action buttons:
- **Approve Button**: `GET /api/leaves/[id]/manager-action?action=approve&email=[managerEmail]`
- **Reject Button**: `GET /api/leaves/[id]/manager-action?action=reject&email=[managerEmail]`

Clicking these links:
- Updates the manager's approval status
- Shows a confirmation page
- Sends notification email to the employee

#### Via Dashboard
HR and Admin users can view approval statuses in:
- **HR Dashboard** → Leaves Tab
- **Admin Dashboard** → Leaves Tab

The tables display:
- Manager names for each leave request
- Current approval status (Pending/Approved/Rejected)
- Email sent indicator (✉)

## API Endpoints

### POST /api/leaves/request
Creates a new leave request and sends approval emails.

**Request Body:**
```json
{
  "type": "Sick Leave",
  "startDate": "2024-02-01",
  "endDate": "2024-02-03",
  "reason": "Medical appointment"
}
```

**Response:**
```json
{
  "leave": { ... },
  "notificationsSent": 2
}
```

### GET /api/leaves/[id]/manager-action
Handle manager approval via email link (HTML response).

**Query Parameters:**
- `action`: "approve" or "reject"
- `email`: Manager's email address

### POST /api/leaves/[id]/manager-action
Handle manager approval via API (JSON response).

**Request Body:**
```json
{
  "managerEmail": "manager@company.com",
  "action": "approve"
}
```

**Response:**
```json
{
  "message": "Leave request approved successfully",
  "managerApprovals": [...]
}
```

### POST /api/leaves/[id]/send-approval
Manually send approval emails (for existing leave requests).

**Response:**
```json
{
  "message": "Approval emails sent to 2 manager(s)",
  "managerApprovals": [...]
}
```

## Data Model

### Leave Schema Updates
```javascript
{
  // ... existing fields
  managerApprovals: [{
    managerEmail: String,
    managerName: String,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    emailSent: { type: Boolean, default: false },
    emailSentAt: Date,
    approvedAt: Date
  }]
}
```

## Email Service Integration

### Current Implementation
The email service (`src/lib/email.js`) currently logs emails to the console as a placeholder.

### Production Setup
To enable actual email sending, choose one of these services:

#### Option 1: SendGrid
```bash
npm install @sendgrid/mail
```

Add to `.env.local`:
```
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourcompany.com
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

Uncomment SendGrid implementation in `src/lib/email.js`

#### Option 2: Resend (Recommended for Next.js)
```bash
npm install resend
```

Add to `.env.local`:
```
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourcompany.com
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

Uncomment Resend implementation in `src/lib/email.js`

#### Option 3: AWS SES
```bash
npm install @aws-sdk/client-ses
```

Add to `.env.local`:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
FROM_EMAIL=noreply@yourcompany.com
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

#### Option 4: Nodemailer (SMTP)
```bash
npm install nodemailer
```

Add to `.env.local`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

## UI Components

### HR Dashboard - LeavesTab.jsx
Displays manager approvals in three sections:
1. **My Leave Requests**: Shows approval status for HR's own requests
2. **Employee Leave Requests**: Shows pending requests with manager approval tracking
3. **Recently Submitted**: Shows all recent requests with approval statuses

### Admin Dashboard - LeavesTab.jsx
Shows all leave requests with manager approval tracking:
1. **All Leave Requests**: Pending requests with approval details
2. **Past Leave Requests**: Historical requests with final approval statuses

### Display Format
```
Manager Approvals column:
┌─────────────────────────┐
│ John Manager  ✓ Approved │
│ Jane Lead     ⏳ Pending  │
│ Bob Director  ✉          │
└─────────────────────────┘
```

## Testing the System

### 1. Create a Leave Request
```javascript
// As an employee
POST /api/leaves/request
{
  "type": "Sick Leave",
  "startDate": "2024-02-01",
  "endDate": "2024-02-02",
  "reason": "Doctor appointment"
}
```

### 2. Check Email Logs
Look in console/terminal for:
```
📧 Email would be sent to: manager@company.com
Subject: Leave Approval Request from John Doe
Leave Details: { type: 'Sick Leave', ... }
```

### 3. Test Email Link (in browser)
```
http://localhost:3000/api/leaves/[leaveId]/manager-action?action=approve&email=manager@company.com
```

### 4. View in Dashboard
- Login as HR or Admin
- Navigate to Leaves tab
- See manager approval statuses in the table

## Future Enhancements

### Possible Improvements:
1. **Email Templates**: Custom branded email templates with company logo
2. **Reminder Emails**: Send reminders for pending approvals after X days
3. **Bulk Actions**: Allow managers to approve/reject multiple requests at once
4. **Mobile Optimization**: Responsive email templates for mobile devices
5. **Approval Hierarchy**: Require multiple levels of approval
6. **Conditional Approval**: Auto-approve leaves under certain conditions
7. **Calendar Integration**: Sync approved leaves to Google Calendar/Outlook
8. **Analytics**: Track average approval times and manager response rates

## Troubleshooting

### Emails Not Sending
1. Check console logs for error messages
2. Verify email service API keys in `.env.local`
3. Check `emailSent` flag in database - should be `true`
4. Verify FROM_EMAIL is configured and verified with your email provider

### Approval Links Not Working
1. Verify `NEXT_PUBLIC_APP_URL` is set correctly
2. Check that manager email matches exactly in URL parameter
3. Ensure leave request ID is valid
4. Check if approval was already processed

### Manager Not Receiving Emails
1. Verify manager is assigned to user's department or user directly
2. Check that `reportingManagers` array is not empty (`[]`)
3. Verify manager email is valid
4. Check spam/junk folders

## Security Considerations

### Email Link Security
The current implementation uses email addresses in URL parameters. For production:

1. **Use Tokens**: Generate secure tokens instead of email addresses
```javascript
// Generate token
const token = crypto.randomBytes(32).toString('hex');
// Store mapping: token -> { leaveId, managerEmail, expires }
```

2. **Add Expiration**: Email links should expire after 7-14 days
3. **Rate Limiting**: Prevent abuse by limiting approval attempts
4. **Audit Trail**: Log all approval actions with timestamps and IP addresses

### Recommended Enhancements:
- Add JWT tokens for email approval links
- Implement link expiration (7-14 days)
- Add CSRF protection for POST requests
- Log all approval actions to audit table
- Implement rate limiting on approval endpoints
