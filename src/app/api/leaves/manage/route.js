import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';
import { User } from '@/models/User';
import { autoRejectExpiredLeaves } from '@/lib/leave-utils';
import { sendLeaveStatusEmail, sendAdminNotificationEmail } from '@/lib/email';
import { calculateLeaveStats } from '@/lib/leave-stats';

// Business days calculation function (excludes weekends)
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

export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['HR', 'Admin', 'Reporting Manager'].includes(user.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();

  // Auto-reject expired pending leaves
  await autoRejectExpiredLeaves();

  // Get status filter from query params
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') || 'Pending';

  // Get manager's department if Reporting Manager
  let managerDepartmentId = null;
  if (user.role === 'Reporting Manager') {
    const managerData = await User.findById(user.id).select('department').lean();
    if (!managerData || !managerData.department) {
      return NextResponse.json({ message: 'Manager not assigned to any department' }, { status: 403 });
    }
    managerDepartmentId = managerData.department;
  }

  // Build query based on user role
  // HR can only see Employee leave requests, not their own or other HR/Admin requests
  // Admin can see both Employee and HR leave requests
  // Reporting Manager can only see Employee requests from their department
  let query = {};
  
  // Handle status filter
  if (statusFilter === 'past') {
    query.status = { $in: ['Approved', 'Rejected'] };
  } else {
    query.status = statusFilter;
  }
  
  if (user.role === 'HR' || user.role === 'Reporting Manager') {
    // HR and Reporting Manager only see Employee requests
    query.user = { $exists: true };
  }

  const leaves = await Leave.find(query)
    .populate({
      path: 'user',
      select: 'name email role leave_limit department',
      populate: {
        path: 'department',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .lean();
  
  // Filter out leaves based on user role after population
  const filteredLeaves = leaves.filter(leave => {
    if (!leave.user) return false;
    
    // Reporting Manager: only Employee requests from their department
    if (user.role === 'Reporting Manager') {
      return leave.user.role === 'Employee' && 
             leave.user.department && 
             leave.user.department._id.toString() === managerDepartmentId.toString();
    }
    
    // HR: only Employee requests
    if (user.role === 'HR') {
      return leave.user.role === 'Employee';
    }
    
    // Admin: Employee and HR requests
    return leave.user.role === 'Employee' || leave.user.role === 'HR';
  });
  
  // Get unique user IDs for batch query
  const uniqueUserIds = [...new Set(filteredLeaves.map(l => l.user._id.toString()))];
  
  // Date calculations
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const currentHalf = currentMonth <= 6 ? 'first' : 'second';
  const halfStartMonth = currentHalf === 'first' ? 0 : 6;
  const halfEndMonth = currentHalf === 'first' ? 6 : 12;
  
  // Batch fetch all approved leaves for all users at once
  const allApprovedLeaves = await Leave.find({
    user: { $in: uniqueUserIds },
    status: 'Approved',
    startDate: {
      $gte: new Date(previousMonthYear, previousMonth - 1, 1)
    }
  }).select('user startDate endDate').lean();
  
  // Pre-calculate stats for all users
  const userStatsMap = {};
  uniqueUserIds.forEach(userId => {
    const userLeaves = allApprovedLeaves.filter(l => l.user.toString() === userId);
    
    let yearlyTaken = 0;
    let halfYearTaken = 0;
    let currentMonthTaken = 0;
    let previousMonthTaken = 0;
    
    userLeaves.forEach(leave => {
      const days = calculateBusinessDays(leave.startDate, leave.endDate);
      const leaveDate = new Date(leave.startDate);
      const leaveYear = leaveDate.getFullYear();
      const leaveMonth = leaveDate.getMonth() + 1;
      
      // Yearly
      if (leaveYear === currentYear) {
        yearlyTaken += days;
        
        // Half year
        if ((currentHalf === 'first' && leaveMonth <= 6) || (currentHalf === 'second' && leaveMonth > 6)) {
          halfYearTaken += days;
        }
        
        // Current month
        if (leaveMonth === currentMonth) {
          currentMonthTaken += days;
        }
      }
      
      // Previous month
      if (leaveYear === previousMonthYear && leaveMonth === previousMonth) {
        previousMonthTaken += days;
      }
    });
    
    userStatsMap[userId] = {
      yearlyTaken,
      halfYearTaken,
      currentMonthTaken,
      previousMonthTaken
    };
  });
  
  // Attach stats to leaves
  const leavesWithStats = filteredLeaves.map(leave => {
    const userId = leave.user._id.toString();
    const stats = userStatsMap[userId] || { yearlyTaken: 0, halfYearTaken: 0, currentMonthTaken: 0, previousMonthTaken: 0 };
    const leaveLimit = leave.user.leave_limit || 10;
    const remaining = Math.max(0, leaveLimit - stats.yearlyTaken);
    
    return {
      ...leave,
      leaveStats: {
        leaveLimit,
        yearlyTaken: stats.yearlyTaken,
        halfYearTaken: stats.halfYearTaken,
        currentHalf,
        remaining,
        currentMonth: stats.currentMonthTaken,
        previousMonth: stats.previousMonthTaken
      }
    };
  });
  
  return NextResponse.json({ leaves: leavesWithStats });
}

export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['HR', 'Admin'].includes(user.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();

  const { leaveId, action } = await req.json();
  const leave = await Leave.findById(leaveId);
  if (!leave) return NextResponse.json({ message: 'Leave not found' }, { status: 404 });
  if (leave.status !== 'Pending') return NextResponse.json({ message: 'Already processed' }, { status: 400 });
  if (!['approve', 'reject'].includes(action)) return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  
  leave.status = action === 'approve' ? 'Approved' : 'Rejected';
  leave.approver = user.id;
  await leave.save();
  
  // Get populated leave with user data for notification
  const populatedLeave = await Leave.findById(leaveId).populate('user').populate({
    path: 'user',
    populate: { path: 'department' }
  });
  const hrUser = await User.findById(user.id);
  
  // Send employee notification
  try {
    await sendLeaveStatusEmail({
      employeeEmail: populatedLeave.user.email,
      employeeName: populatedLeave.user.name,
      leave: populatedLeave,
      status: action === 'approve' ? 'Approved' : 'Rejected',
      managerName: hrUser.name,
      approverType: 'HR'
    });
  } catch (emailError) {
    console.error('Failed to send employee notification:', emailError);
  }
  
  // Send notification to all admin users about the status change
  try {
    const adminUsers = await User.find({ role: 'Admin' }).lean();
    
    if (adminUsers && adminUsers.length > 0) {
      // Calculate leave statistics
      const leaveStats = await calculateLeaveStats(populatedLeave.user._id, populatedLeave.user);
      
      for (const admin of adminUsers) {
        try {
          await sendAdminNotificationEmail({
            adminEmail: admin.email,
            adminName: admin.name,
            leave: populatedLeave,
            employee: populatedLeave.user,
            leaveStats: leaveStats,
            eventType: action === 'approve' ? 'approved' : 'rejected',
            actionBy: hrUser.name
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
    message: `Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully` 
  });
}
