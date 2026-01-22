import { Leave } from '@/models/Leave';
import { connectDB } from '@/lib/db';

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

/**
 * Calculate comprehensive leave statistics for an employee
 * @param {string} userId - User ID
 * @param {Object} user - User object with leave_limit
 * @returns {Object} Leave statistics
 */
export async function calculateLeaveStats(userId, user = null) {
  await connectDB();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3);

  // Date ranges
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

  const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
  const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const startOfQuarter = new Date(currentYear, currentQuarter * 3, 1);
  const endOfQuarter = new Date(currentYear, (currentQuarter + 1) * 3, 0, 23, 59, 59);

  // Fetch all approved leaves for the user this year
  const approvedLeaves = await Leave.find({
    user: userId,
    status: 'Approved',
    startDate: { $gte: startOfYear, $lte: endOfYear }
  }).lean();

  // Calculate leave days
  const calculateDays = (leave) => {
    return calculateBusinessDays(leave.startDate, leave.endDate);
  };

  // Separate regular and sick leaves
  const regularLeaves = approvedLeaves.filter(leave => leave.type !== 'Sick Leave');
  const sickLeaves = approvedLeaves.filter(leave => leave.type === 'Sick Leave');

  // Filter and sum regular leaves by date range
  const thisMonthLeaves = regularLeaves.filter(leave => {
    const startDate = new Date(leave.startDate);
    return startDate >= startOfCurrentMonth && startDate <= endOfCurrentMonth;
  });

  const lastMonthLeaves = regularLeaves.filter(leave => {
    const startDate = new Date(leave.startDate);
    return startDate >= startOfLastMonth && startDate <= endOfLastMonth;
  });

  const thisQuarterLeaves = regularLeaves.filter(leave => {
    const startDate = new Date(leave.startDate);
    return startDate >= startOfQuarter && startDate <= endOfQuarter;
  });

  // Filter sick leaves by date range
  const thisMonthSickLeaves = sickLeaves.filter(leave => {
    const startDate = new Date(leave.startDate);
    return startDate >= startOfCurrentMonth && startDate <= endOfCurrentMonth;
  });

  const lastMonthSickLeaves = sickLeaves.filter(leave => {
    const startDate = new Date(leave.startDate);
    return startDate >= startOfLastMonth && startDate <= endOfLastMonth;
  });

  const thisQuarterSickLeaves = sickLeaves.filter(leave => {
    const startDate = new Date(leave.startDate);
    return startDate >= startOfQuarter && startDate <= endOfQuarter;
  });

  // Calculate regular leave days
  const thisYearDays = regularLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);
  const thisMonthDays = thisMonthLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);
  const lastMonthDays = lastMonthLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);
  const thisQuarterDays = thisQuarterLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);

  // Calculate sick leave days
  const thisYearSickDays = sickLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);
  const thisMonthSickDays = thisMonthSickLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);
  const lastMonthSickDays = lastMonthSickLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);
  const thisQuarterSickDays = thisQuarterSickLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);

  // Fixed annual leave allocation (no formula)
  const leaveLimit = user?.leave_limit || 10;
  const earnedLeaves = leaveLimit; // Fixed allocation per year
  const totalUsedThisYear = thisYearDays;
  const remainingLeaves = earnedLeaves - totalUsedThisYear;

  // Fixed sick leave allocation (no formula)
  const sickLeaveLimit = user?.sick_leave_limit || 3;
  const earnedSickLeaves = sickLeaveLimit; // Fixed allocation per year
  const totalUsedSickThisYear = thisYearSickDays;
  const remainingSickLeaves = earnedSickLeaves - totalUsedSickThisYear;

  // Fixed maternity leave allocation (no formula, not shown in balance)
  const maternityLeaveLimit = user?.maternity_leave_limit || 2;
  const maternityLeaves = approvedLeaves.filter(leave => leave.type === 'Maternity');
  const thisYearMaternityDays = maternityLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);
  const remainingMaternityLeaves = maternityLeaveLimit - thisYearMaternityDays;

  return {
    // Regular leave stats
    thisYear: totalUsedThisYear,
    thisMonth: thisMonthDays,
    lastMonth: lastMonthDays,
    thisQuarter: thisQuarterDays,
    approvedLeavesCount: regularLeaves.length,
    leaveLimit: leaveLimit,
    earnedLeaves: earnedLeaves,
    remainingLeaves: remainingLeaves,
    
    // Sick leave stats
    sickThisYear: totalUsedSickThisYear,
    sickThisMonth: thisMonthSickDays,
    sickLastMonth: lastMonthSickDays,
    sickThisQuarter: thisQuarterSickDays,
    approvedSickLeavesCount: sickLeaves.length,
    sickLeaveLimit: sickLeaveLimit,
    earnedSickLeaves: earnedSickLeaves,
    remainingSickLeaves: remainingSickLeaves
  };
}

/**
 * Get pending leaves count for a user
 * @param {string} userId - User ID
 * @returns {number} Count of pending leaves
 */
export async function getPendingLeavesCount(userId) {
  await connectDB();
  return await Leave.countDocuments({
    user: userId,
    status: 'Pending'
  });
}

/**
 * Get formatted approval status for email (deprecated - reporting managers removed)
 * @param {Array} managerApprovals - Manager approvals array from leave (not used)
 * @returns {string} Empty string
 */
export function formatManagerApprovals(managerApprovals) {
  return '';
}

