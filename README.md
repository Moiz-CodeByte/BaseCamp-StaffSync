# QMCC StaffSync

A comprehensive Human Resource Management System (HRMS) built for QMCC, featuring role-based dashboards, attendance tracking, leave management, payroll automation, and corporate calendar.

## 🚀 Features

### Role-Based Access Control
- **Admin**: Full system control with user management and payroll generation
- **HR**: Leave approval, employee management, and corporate calendar
- **Employee**: Personal dashboard with attendance, leaves, and payslips

### Core Modules

#### 👥 User Management (Admin)
- View all users with role-based filtering
- Add new users with email and role assignment
- Real-time statistics (Total users, Admins, HR, Employees)
- User activity tracking

#### ⏰ Attendance System (All Roles)
- Real-time check-in/check-out functionality
- Attendance history with date and time logs
- Daily status tracking (Present, Absent, Half-Day)
- Employee: View personal attendance records
- HR/Admin: Access to all attendance data

#### 📅 Leave Management
- **Employees**: Submit leave requests (Annual, Sick, Casual, Unpaid)
- **HR/Admin**: Approve or reject pending requests
- Leave status tracking (Pending, Approved, Rejected)
- Leave balance calculation
- Multi-level approval workflow

#### 💰 Payroll System (Admin)
- Automated payroll generation for current month
- Detailed payslip breakdown (Basic, Allowances, Deductions, Net)
- Employee access to personal payslips
- Monthly salary reports

#### 🗓️ Corporate Calendar (HR/Admin)
- Create and manage events (Holidays, Meetings, Events)
- Public calendar view for all employees
- Event categorization and color coding
- Upcoming events tracking

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **UI Components**: Radix UI + Tailwind CSS
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS v4 with custom theme

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Moiz-CodeByte/QMCC-StaffSync.git
   cd QMCC-StaffSync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/qmcc_staffsync
   JWT_SECRET=your-super-secret-jwt-key-change-this
   NEXT_PUBLIC_API_BASE_URL=
   ```

4. **Start MongoDB**
   
   Ensure your MongoDB instance is running:
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 👤 User Seeding

To quickly add test users, run the PowerShell seeding script:

```powershell
.\scripts\seed-users.ps1
```

This creates three Employee users:
- John Doe (john.doe@qmcc.com)
- Jane Smith (jane.smith@qmcc.com)
- Bob Lee (bob.lee@qmcc.com)

Default password for all: `passw0rd`

### Manual User Registration

Register users via API:

```powershell
# Admin user
$body = @{ name='Admin User'; email='admin@qmcc.com'; password='passw0rd'; role='Admin' } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri 'http://localhost:3000/api/auth/register' -ContentType 'application/json' -Body $body

# HR user
$body = @{ name='HR Manager'; email='hr@qmcc.com'; password='passw0rd'; role='HR' } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri 'http://localhost:3000/api/auth/register' -ContentType 'application/json' -Body $body
```

## 📂 Project Structure

```
QMCC StaffSync/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   ├── attendance/        # Check-in/out, records
│   │   │   ├── leaves/            # Leave requests and management
│   │   │   ├── payroll/           # Payslip generation
│   │   │   ├── calendar/          # Corporate events
│   │   │   └── users/             # User management
│   │   ├── dashboard/
│   │   │   ├── admin/             # Admin dashboard
│   │   │   ├── hr/                # HR dashboard
│   │   │   └── employee/          # Employee dashboard
│   │   ├── login/                 # Login page
│   │   ├── page.js                # Landing page
│   │   └── layout.js              # Root layout
│   ├── components/
│   │   ├── ui/                    # Reusable UI components
│   │   ├── navbar.jsx             # Smart navigation
│   │   └── theme-toggle.jsx       # Dark mode toggle
│   ├── lib/
│   │   ├── api.js                 # Axios instance with JWT interceptor
│   │   ├── auth.js                # JWT signing and verification
│   │   ├── db.js                  # MongoDB connection
│   │   └── utils.js               # Utility functions
│   └── models/
│       ├── User.js                # User schema
│       ├── Attendance.js          # Attendance schema
│       ├── Leave.js               # Leave schema
│       ├── Payroll.js             # Payroll schema
│       └── CalendarEvent.js       # Event schema
├── scripts/
│   └── seed-users.ps1             # User seeding script
├── package.json
└── README.md
```

## 🎨 Features by Role

### Admin Dashboard
- **User Statistics**: Total users, role breakdown
- **User Management Table**: Add, view all users
- **Payroll Generation**: One-click payroll for current month
- **System Overview**: Comprehensive admin controls

### HR Dashboard
- **Leave Management**: Approve/reject pending requests with detailed table
- **Corporate Calendar**: Create holidays, meetings, events
- **Employee Directory**: Quick access to all employees
- **Statistics**: Pending leaves, employee count, upcoming events

### Employee Dashboard
- **Profile Card**: Personal information display
- **Attendance**: Check-in/out with today's status and history
- **Leave Requests**: Submit and track leave applications
- **Payslips**: Detailed monthly salary breakdown
- **Statistics**: Total attendance days, leave balance

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Users
- `GET /api/users/me` - Get current user (authenticated)
- `GET /api/users/list` - Get all users (HR/Admin only)

### Attendance
- `POST /api/attendance/checkin` - Check in for today
- `POST /api/attendance/checkout` - Check out for today
- `GET /api/attendance/my` - Get personal attendance records

### Leaves
- `POST /api/leaves/request` - Submit leave request
- `GET /api/leaves/my` - Get personal leaves
- `GET /api/leaves/manage` - Get pending leaves (HR/Admin)
- `POST /api/leaves/manage` - Approve/reject leave (HR/Admin)

### Payroll
- `GET /api/payroll/mine` - Get personal payslips
- `POST /api/payroll/generate` - Generate payroll (Admin only)

### Calendar
- `GET /api/calendar/events` - Get all events (public)
- `POST /api/calendar/events` - Create event (HR/Admin)

## 🎯 Usage Examples

### Login Flow
1. Navigate to `/login`
2. Enter credentials (email + password)
3. On success, JWT is stored in localStorage
4. Redirected to `/` (home page)
5. Click "Dashboard" to access role-specific dashboard

### Employee Daily Workflow
1. Login → Dashboard
2. Check-in for the day
3. View today's attendance status
4. Submit leave request if needed
5. Check payslips at month-end
6. Check-out when leaving

### HR Workflow
1. Login → Dashboard
2. Review pending leave requests
3. Approve/reject with one click
4. Add corporate events (holidays, meetings)
5. View employee directory
6. Monitor statistics

### Admin Workflow
1. Login → Dashboard
2. Add new users to the system
3. View user statistics and management table
4. Generate monthly payroll for all employees
5. Full system oversight

## 🌙 Dark Mode

The application includes a built-in dark mode toggle available in the navbar. Theme preference is saved automatically.

## 🔒 Security Features

- JWT-based authentication with 7-day expiry
- Password hashing with bcrypt (10 salt rounds)
- Protected API routes with role-based access control
- Automatic token refresh on browser requests
- MongoDB connection caching for performance

## 📊 Database Schema

### User
- name, email, password (hashed), role (Admin/HR/Employee)
- Timestamps: createdAt, updatedAt

### Attendance
- user (ref), date, checkInAt, checkOutAt, status
- Unique index on (user, date)

### Leave
- user (ref), type, startDate, endDate, reason, status, approver (ref)

### Payroll
- user (ref), month, year, basic, allowances, deductions, net
- Unique index on (user, month, year)

### CalendarEvent
- title, description, date, type (Holiday/Meeting/Event), createdBy (ref)

## 🚧 Future Enhancements

- [ ] Email notifications for leave approvals
- [ ] Attendance reports and analytics
- [ ] Role-based dashboard customization
- [ ] Advanced payroll calculations (tax, benefits)
- [ ] Performance review module
- [ ] Document management system
- [ ] Mobile app (React Native)
- [ ] Export reports (PDF, Excel)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Moiz-CodeByte**  
GitHub: [@Moiz-CodeByte](https://github.com/Moiz-CodeByte)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Radix UI for accessible components
- MongoDB for the flexible database
- Tailwind CSS for rapid styling

---

**Built with ❤️ for QMCC**
