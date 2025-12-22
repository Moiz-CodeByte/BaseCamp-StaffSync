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

  // Filter and sum by date range
  const thisMonthLeaves = approvedLeaves.filter(leave => {
    const startDate = new Date(leave.startDate);
    return startDate >= startOfCurrentMonth && startDate <= endOfCurrentMonth;
  });

  const lastMonthLeaves = approvedLeaves.filter(leave => {
    const startDate = new Date(leave.startDate);
    return startDate >= startOfLastMonth && startDate <= endOfLastMonth;
  });

  const thisQuarterLeaves = approvedLeaves.filter(leave => {
    const startDate = new Date(leave.startDate);
    return startDate >= startOfQuarter && startDate <= endOfQuarter;
  });

  const thisYearDays = approvedLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);
  const thisMonthDays = thisMonthLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);
  const lastMonthDays = lastMonthLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);
  const thisQuarterDays = thisQuarterLeaves.reduce((sum, leave) => sum + calculateDays(leave), 0);

  // Calculate earned leaves based on days elapsed in current year (annual basis)
  const daysSinceYearStart = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
  const leaveLimit = user?.leave_limit || 10;
  const earnedLeaves = Math.floor((daysSinceYearStart * leaveLimit) / 365);
  
  // Add historical leaves if from current year
  const historicalLeaves = (user?.previousLeavesAvailedYear === currentYear) 
    ? (user?.previousLeavesAvailed || 0) 
    : 0;
  const totalUsedThisYear = thisYearDays + historicalLeaves;
  
  // Calculate remaining leaves
  const remainingLeaves = earnedLeaves - totalUsedThisYear;

  return {
    thisYear: totalUsedThisYear,
    thisMonth: thisMonthDays,
    lastMonth: lastMonthDays,
    thisQuarter: thisQuarterDays,
    approvedLeavesCount: approvedLeaves.length,
    leaveLimit: leaveLimit,
    earnedLeaves: earnedLeaves,
    remainingLeaves: remainingLeaves
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
 * Get formatted reporting manager approvals for email
 * @param {Array} managerApprovals - Manager approvals array from leave
 * @returns {string} Formatted HTML string
 */
export function formatManagerApprovals(managerApprovals) {
  if (!managerApprovals || managerApprovals.length === 0) {
    return '<p style="color: #6b7280; font-style: italic;">No reporting managers assigned</p>';
  }

  return managerApprovals.map(approval => {
    let statusColor = '#f59e0b'; // Pending - amber
    let statusIcon = '⏳';
    
    if (approval.status === 'Approved') {
      statusColor = '#10b981'; // green
      statusIcon = '✅';
    } else if (approval.status === 'Rejected') {
      statusColor = '#ef4444'; // red
      statusIcon = '❌';
    }

    return `
      <div style="margin: 8px 0; padding: 12px; background: #f9fafb; border-left: 3px solid ${statusColor}; border-radius: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <strong style="color: #333;">${approval.managerName}</strong>
            <span style="color: #6b7280; font-size: 13px; margin-left: 8px;">${approval.managerEmail}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span>${statusIcon}</span>
            <span style="font-weight: 600; color: ${statusColor};">${approval.status}</span>
          </div>
        </div>
        ${approval.approvedAt ? `
          <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">
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
}
