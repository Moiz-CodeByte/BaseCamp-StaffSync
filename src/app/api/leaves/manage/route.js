import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';

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
  if (!['HR', 'Admin'].includes(user.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();

  // Get status filter from query params
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') || 'Pending';

  // Build query based on user role
  // HR can only see Employee leave requests, not their own or other HR/Admin requests
  // Admin can see both Employee and HR leave requests
  let query = {};
  
  // Handle status filter
  if (statusFilter === 'past') {
    query.status = { $in: ['Approved', 'Rejected'] };
  } else {
    query.status = statusFilter;
  }
  
  if (user.role === 'HR') {
    // HR only sees Employee requests
    query.user = { $exists: true };
  }

  const leaves = await Leave.find(query)
    .populate('user', 'name email role leave_limit')
    .sort({ createdAt: -1 });
  
  // Filter out leaves based on user role after population
  const filteredLeaves = leaves.filter(leave => {
    if (user.role === 'HR') {
      // HR should only see Employee leaves, not their own or other HR/Admin leaves
      return leave.user && leave.user.role === 'Employee';
    }
    // Admin sees Employee and HR leaves (but not other Admin leaves)
    return leave.user && (leave.user.role === 'Employee' || leave.user.role === 'HR');
  });
  
  // Calculate leave statistics for each employee
  const leavesWithStats = await Promise.all(filteredLeaves.map(async (leave) => {
    const userId = leave.user._id;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    // Helper function to calculate days between dates
    const calculateDays = (startDate, endDate) => {
      return calculateBusinessDays(startDate, endDate);
    };
    
    // Get approved leaves for this year and calculate total days
    const yearlyLeaves = await Leave.find({
      user: userId,
      status: 'Approved',
      startDate: {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31)
      }
    });
    const yearlyApprovedLeaves = yearlyLeaves.reduce((total, leave) => {
      return total + calculateDays(leave.startDate, leave.endDate);
    }, 0);
    
    // Get approved leaves for current month and calculate total days
    const monthlyLeaves = await Leave.find({
      user: userId,
      status: 'Approved',
      startDate: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1)
      }
    });
    const monthlyApprovedLeaves = monthlyLeaves.reduce((total, leave) => {
      return total + calculateDays(leave.startDate, leave.endDate);
    }, 0);
    
    // Get approved leaves for previous month and calculate total days
    const prevMonthLeaves = await Leave.find({
      user: userId,
      status: 'Approved',
      startDate: {
        $gte: new Date(previousMonthYear, previousMonth - 1, 1),
        $lt: new Date(previousMonthYear, previousMonth, 1)
      }
    });
    const previousMonthLeaves = prevMonthLeaves.reduce((total, leave) => {
      return total + calculateDays(leave.startDate, leave.endDate);
    }, 0);
    
    const leaveLimit = leave.user.leave_limit || 12;
    const remaining = leaveLimit - yearlyApprovedLeaves;
    
    return {
      ...leave.toObject(),
      leaveStats: {
        leaveLimit,
        yearlyTaken: yearlyApprovedLeaves,
        remaining: remaining > 0 ? remaining : 0,
        currentMonth: monthlyApprovedLeaves,
        previousMonth: previousMonthLeaves
      }
    };
  }));
  
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
  
  return NextResponse.json({ 
    leave,
    message: `Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully` 
  });
}
