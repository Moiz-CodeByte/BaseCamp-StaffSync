/**
 * Date Utility Functions
 * Provides helper functions for date calculations in the leave management system
 */

/**
 * Calculate business days between two dates (excluding Saturdays and Sundays)
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of business days (weekdays only)
 */
export function calculateBusinessDays(startDate, endDate) {
  // Parse dates - handle both Date objects and ISO strings
  let start, end;
  
  if (typeof startDate === 'string') {
    // For ISO date strings (YYYY-MM-DD or full ISO), parse directly
    start = new Date(startDate.includes('T') ? startDate : startDate + 'T00:00:00');
  } else {
    start = new Date(startDate);
  }
  
  if (typeof endDate === 'string') {
    end = new Date(endDate.includes('T') ? endDate : endDate + 'T00:00:00');
  } else {
    end = new Date(endDate);
  }
  
  // Reset time to start of day for accurate comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  if (end < start) {
    return 0;
  }
  
  let businessDays = 0;
  const current = new Date(start);
  
  // Iterate through each day and count weekdays only
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday, 6 = Saturday - skip these
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if weekend, false otherwise
 */
export function isWeekend(date) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
}

/**
 * Get the next business day after a given date
 * @param {Date|string} date - Starting date
 * @returns {Date} Next business day
 */
export function getNextBusinessDay(date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  
  while (isWeekend(next)) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}
