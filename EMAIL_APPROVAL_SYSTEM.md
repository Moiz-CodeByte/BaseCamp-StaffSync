# Email Approval System for Leave Requests

## Overview
The system supports email notifications to reporting managers when employees submit leave requests. Managers can approve or reject leave requests directly from their email or through the dashboard. The system also features dynamic leave balance calculations based on customizable entitlement dates.

## Leave Entitlement System

### How Leave Balance is Calculated
Each employee has a customizable **Leave Entitlement Date** that determines when they start earning leaves:

**Formula:** Earned Leaves = (Days from Entitlement Date to Today × 10) ÷ 365

- **Base Multiplier**: Always 10 (standard annual leave quota)
- **Rounding**: Math.round (0.5 rounds up to 1)
- **Default**: If no entitlement date is set, defaults to January 1 of current year

**Examples:**
- Employee joined July 1, 2025 → 179 days to Dec 27 → (179 × 10) ÷ 365 = 4.9 ≈ **5 days**
- Employee joined Jan 1, 2025 → 360 days to Dec 27 → (360 × 10) ÷ 365 = 9.9 ≈ **10 days**
- Employee joined Nov 1, 2025 → 56 days to Dec 27 → (56 × 10) ÷ 365 = 1.5 ≈ **2 days**

### Setting Entitlement Dates
Admins and HR can set entitlement dates when:
1. Creating new users
2. Editing existing user profiles
3. Managing employees in their departments

The system provides **real-time calculation preview** showing earned leaves as dates are entered.

## Email Approval Workflow

### How It Works

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

### User Schema Updates
```javascript
{
  // ... existing fields
  leave_limit: { type: Number, default: 10 },
  leaveEntitlementDate: { type: Date }, // Custom entitlement start date
  previousLeavesAvailed: { type: Number, default: 0 }, // Historical leaves (pre-system)
  previousLeavesAvailedYear: { type: Number }, // Year of historical leaves
  reportingManagers: [{
    name: String,
    email: String
  }]
}
```

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
Displays manager approvals and leave balance calculations:
1. **My Leave Requests**: Shows approval status for HR's own requests with earned leave calculation
2. **Employee Leave Requests**: Shows pending requests with manager approval tracking
3. **Recently Submitted**: Shows all recent requests with approval statuses
4. **Real-time Balance**: Calculates earned leaves based on entitlement date to today

### Admin Dashboard - LeavesTab.jsx
Shows all leave requests with manager approval tracking and entitlement management:
1. **All Leave Requests**: Pending requests with approval details and earned leave display
2. **Past Leave Requests**: Historical requests with final approval statuses
3. **User Management**: Edit employee entitlement dates with calculation preview

### Employee Dashboard - LeavesTab.jsx
Employee leave request form with real-time balance:
1. **Leave Balance Card**: Shows earned leaves from entitlement date to today
2. **Leave Request Form**: Submit new requests
3. **Leave History**: View past requests and their statuses

### Display Format
```
Manager Approvals column:
┌─────────────────────────┐
│ John Manager  ✓ Approved │
│ Jane Lead     ⏳ Pending  │
│ Bob Director  ✉          │
└─────────────────────────┘

Leave Balance Display:
┌──────────────────────────────────────┐
│ Earned: 5 days (179 days × 10 ÷ 365) │
│ Used: 2 days                         │
│ Available: 3 days                    │
└──────────────────────────────────────┘
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

### Implemented Features:
✅ **Dynamic Leave Calculation**: Earned leaves based on entitlement date  
✅ **Real-time Previews**: Instant calculation display when setting dates  
✅ **Email Notifications**: Manager approval emails with one-click actions  
✅ **Historical Leave Tracking**: Support for pre-system leave data

### Possible Improvements:
1. **Email Templates**: Custom branded email templates with company logo
2. **Reminder Emails**: Send reminders for pending approvals after X days
3. **Bulk Actions**: Allow managers to approve/reject multiple requests at once
4. **Mobile Optimization**: Responsive email templates for mobile devices
5. **Approval Hierarchy**: Require multiple levels of approval
6. **Conditional Approval**: Auto-approve leaves under certain conditions
7. **Calendar Integration**: Sync approved leaves to Google Calendar/Outlook
8. **Analytics**: Track average approval times and manager response rates
9. **Carry Forward**: Auto-calculate and carry forward unused leaves to next year
10. **Leave Forecasting**: Predict leave usage patterns and balance projections

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
