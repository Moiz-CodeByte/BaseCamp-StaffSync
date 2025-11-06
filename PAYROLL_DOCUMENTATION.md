# Payroll Management System - Documentation

## Overview
The updated payroll management system includes comprehensive salary fields, automatic leave deduction calculation, payment status tracking, and payslip document management.

## Database Schema

### Payroll Model (`src/models/Payroll.js`)

#### New Fields Added:

| Field | Type | Description |
|-------|------|-------------|
| `basic_salary` | Number | Fixed base pay for the employee |
| `allowance` | Number | Additional allowances (transport, housing, etc.) |
| `bonus` | Number | Optional performance bonuses |
| `deductions` | Number | Taxes, late penalties, etc. |
| `leave_deduction` | Number | Auto-calculated from attendance if leave exceeds limit |
| `total_salary` | Number | Net salary after all calculations (auto-calculated) |
| `month` | String | Pay period (e.g., "October 2025" or "2025-10") |
| `status` | String | Payment status: "Pending", "Processing", or "Paid" |
| `payment_date` | Date | When salary was processed |
| `payslip_url` | String | Link to generated payslip PDF |

#### Legacy Fields (Maintained for Backward Compatibility):
- `basic` → Synced with `basic_salary`
- `allowances` → Synced with `allowance`
- `net` → Synced with `total_salary`
- `year` → Extracted from `month` field

#### Auto-Calculation:
The `total_salary` is automatically calculated on save:
```javascript
total_salary = basic_salary + allowance + bonus - deductions - leave_deduction
```

### User Model (`src/models/User.js`)

#### New Salary-Related Fields:

| Field | Type | Description |
|-------|------|-------------|
| `basic_salary` | Number | Default monthly basic salary (set by HR) |
| `allowance` | Number | Default monthly allowance |
| `leave_limit` | Number | Annual leave limit in days (default: 12) |

## API Endpoints

### 1. Generate Payroll for All Employees
**POST** `/api/payroll/generate`

**Access:** Admin, HR

**Request Body:**
```json
{
  "month": "October 2025",  // or "2025-10"
  "bonus": 500,             // Optional, default: 0
  "deductions": 100         // Optional, default: 0
}
```

**Response:**
```json
{
  "results": [
    {
      "user": "userId",
      "name": "John Doe",
      "ok": true,
      "total_salary": 3400
    }
  ]
}
```

**Features:**
- Uses employee's `basic_salary` and `allowance` from User model
- Auto-calculates `leave_deduction` based on attendance records
- Creates or updates payroll records for all employees

### 2. Get My Payslips
**GET** `/api/payroll/mine`

**Access:** All authenticated users

**Response:**
```json
{
  "payslips": [
    {
      "_id": "payrollId",
      "month": "October 2025",
      "basic_salary": 3000,
      "allowance": 500,
      "bonus": 500,
      "deductions": 100,
      "leave_deduction": 50,
      "total_salary": 3850,
      "status": "Paid",
      "payment_date": "2025-10-31T00:00:00.000Z",
      "payslip_url": "https://example.com/payslips/payslip-123.pdf",
      "createdAt": "2025-10-01T00:00:00.000Z"
    }
  ]
}
```

### 3. Get All Payroll Records
**GET** `/api/payroll/list`

**Access:** Admin, HR

**Query Parameters:**
- `month` - Filter by month (e.g., "October 2025")
- `status` - Filter by status ("Pending", "Processing", "Paid")
- `userId` - Filter by specific user

**Response:**
```json
{
  "payrolls": [
    {
      "_id": "payrollId",
      "user": {
        "_id": "userId",
        "name": "John Doe",
        "email": "john@example.com",
        "department": "Engineering",
        "role": "Employee"
      },
      "month": "October 2025",
      "basic_salary": 3000,
      "total_salary": 3850,
      "status": "Paid"
    }
  ]
}
```

### 4. Get Specific Payroll Record
**GET** `/api/payroll/[id]`

**Access:** 
- Employees: Own records only
- HR/Admin: All records

**Response:**
```json
{
  "payroll": {
    "_id": "payrollId",
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "department": "Engineering"
    },
    "month": "October 2025",
    "basic_salary": 3000,
    "allowance": 500,
    "bonus": 500,
    "deductions": 100,
    "leave_deduction": 50,
    "total_salary": 3850,
    "status": "Paid",
    "payment_date": "2025-10-31T00:00:00.000Z",
    "payslip_url": "https://example.com/payslips/payslip-123.pdf"
  }
}
```

### 5. Update Payroll Record
**PATCH** `/api/payroll/[id]`

**Access:** Admin, HR

**Request Body:**
```json
{
  "basic_salary": 3500,
  "allowance": 600,
  "bonus": 1000,
  "deductions": 150,
  "leave_deduction": 0,
  "status": "Paid",
  "payslip_url": "https://example.com/payslips/new-payslip.pdf"
}
```

**Features:**
- `payment_date` is automatically set when status changes to "Paid"
- `total_salary` is auto-calculated on save

### 6. Delete Payroll Record
**DELETE** `/api/payroll/[id]`

**Access:** Admin only

**Response:**
```json
{
  "message": "Payroll record deleted successfully"
}
```

## Leave Deduction Calculation

The system automatically calculates leave deductions when generating payroll:

1. **Fetch Attendance Records:** Gets all Absent/Leave records for the year up to the payroll month
2. **Calculate Excess Days:** Compares total leave days against the employee's `leave_limit`
3. **Calculate Deduction:** 
   ```
   dailySalary = basic_salary / 30
   leave_deduction = dailySalary × excessDays
   ```

**Example:**
- Employee basic salary: $3000
- Leave limit: 12 days per year
- Total leaves taken (Jan-Oct): 15 days
- Excess days: 15 - 12 = 3 days
- Daily salary: $3000 / 30 = $100
- Leave deduction: $100 × 3 = $300

## UI Components

### PayrollTab Component
Updated to display:
- ✅ Salary breakdown (Basic, Allowance, Bonus)
- ✅ Deductions (Tax, Leave deductions)
- ✅ Payment status badge
- ✅ Payment date
- ✅ Net salary (total_salary)
- ✅ Download payslip link

## Migration Notes

### Backward Compatibility
The system maintains backward compatibility with existing payroll records:
- Old `basic`, `allowances`, `net` fields still work
- New fields take precedence if both exist
- Pre-save hooks sync legacy fields automatically

### Updating Existing Records
To migrate old records to the new schema:
```javascript
// Update User records with salary info
db.users.updateMany(
  {},
  {
    $set: {
      basic_salary: 3000,
      allowance: 500,
      leave_limit: 12
    }
  }
);

// Update Payroll records
db.payrolls.updateMany(
  {},
  {
    $rename: {
      "basic": "basic_salary",
      "allowances": "allowance",
      "net": "total_salary"
    },
    $set: {
      status: "Paid",
      bonus: 0,
      leave_deduction: 0
    }
  }
);
```

## HR Workflow

1. **Setup Employee Salaries:**
   - Set `basic_salary`, `allowance`, and `leave_limit` in User profile

2. **Generate Monthly Payroll:**
   - POST to `/api/payroll/generate` with month and optional bonus/deductions
   - System auto-calculates leave deductions

3. **Review & Adjust:**
   - Use `/api/payroll/list` to view all records
   - PATCH individual records to adjust amounts

4. **Mark as Paid:**
   - Update status to "Paid"
   - Upload payslip PDF and set `payslip_url`

5. **Employees View:**
   - Employees see detailed breakdown in PayrollTab
   - Can download payslip if URL is provided

## Future Enhancements

- [ ] Automatic payslip PDF generation
- [ ] Email payslips to employees
- [ ] Tax calculation integration
- [ ] Multi-currency support
- [ ] Overtime calculation
- [ ] Commission tracking
- [ ] Payroll reports and analytics
