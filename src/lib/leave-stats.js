import { Leave } from '@/models/Leave';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { getUserLeaveLimits } from '@/lib/leave-utils';

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

  // Fetch user object if not provided (needed for leave limits calculation)
  if (!user) {
    user = await User.findById(userId).lean();
    if (!user) {
      console.error('User not found for leave stats calculation:', userId);
      return {
        thisYear: 0, thisMonth: 0, lastMonth: 0, thisQuarter: 0,
        approvedLeavesCount: 0, leaveLimit: 0, earnedLeaves: 0, remainingLeaves: 0,
        sickThisYear: 0, sickThisMonth: 0, sickLastMonth: 0, sickThisQuarter: 0,
        approvedSickLeavesCount: 0, sickLeaveLimit: 0, earnedSickLeaves: 0, remainingSickLeaves: 0,
        maternityLeaveLimit: 0, maternityThisYear: 0, maternityThisMonth: 0, maternityLastMonth: 0, remainingMaternityLeaves: 0,
        paternityLeaveLimit: 0, paternityThisYear: 0, paternityThisMonth: 0, paternityLastMonth: 0, remainingPaternityLeaves: 0
      };
    }
  }

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

  // Separate regular and sick leaves (handle both 'Sick' and 'Sick Leave')
  const sickLeaves = approvedLeaves.filter(leave => leave.type === 'Sick' || leave.type === 'Sick Leave');
  const regularLeaves = approvedLeaves.filter(leave => 
    leave.type !== 'Sick' && 
    leave.type !== 'Sick Leave' && 
    leave.type !== 'Maternity' && 
    leave.type !== 'Paternity'
  );

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

  // Calculate pro-rata leave limits based on entitlement date
  const calculatedLimits = getUserLeaveLimits(user);
  
  // Annual leave calculations
  const leaveLimit = calculatedLimits.annual_leave;
  const earnedLeaves = leaveLimit;
  const totalUsedThisYear = thisYearDays;
  const remainingLeaves = earnedLeaves - totalUsedThisYear;

  // Sick leave calculations
  const sickLeaveLimit = calculatedLimits.sick_leave;
  const earnedSickLeaves = sickLeaveLimit;
  const totalUsedSickThisYear = thisYearSickDays;
  const remainingSickLeaves = earnedSickLeaves - totalUsedSickThisYear;

  // Maternity leave calculations
  const maternityLeaveLimit = calculatedLimits.maternity_leave;
  const maternityLeaves = approvedLeaves.filter(leave => leave.type === 'Maternity');
  const thisYearMaternityDays = maternityLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);
  const remainingMaternityLeaves = maternityLeaveLimit - thisYearMaternityDays;

  // Paternity leave calculations
  const paternityLeaveLimit = calculatedLimits.paternity_leave;
  const paternityLeaves = approvedLeaves.filter(leave => leave.type === 'Paternity');
  const thisYearPaternityDays = paternityLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);
  const remainingPaternityLeaves = paternityLeaveLimit - thisYearPaternityDays;

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
    remainingSickLeaves: remainingSickLeaves,
    
    // Maternity leave stats
    maternityLeaveLimit: maternityLeaveLimit,
    thisYearMaternityDays: thisYearMaternityDays,
    remainingMaternityLeaves: remainingMaternityLeaves,
    
    // Paternity leave stats
    paternityLeaveLimit: paternityLeaveLimit,
    thisYearPaternityDays: thisYearPaternityDays,
    remainingPaternityLeaves: remainingPaternityLeaves
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

