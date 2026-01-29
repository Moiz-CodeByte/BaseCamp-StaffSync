/**
 * Client-side leave calculation utilities
 * No server-side dependencies (no mongoose, no models)
 */

/**
 * Check if a year is a leap year
 * @param {number} year - Year to check
 * @returns {boolean} True if leap year
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Calculate pro-rata leave limit based on entitlement date
 * @param {Date} entitlementDate - Date when employee becomes eligible for leaves
 * @param {number} annualLimit - Full annual leave limit
 * @param {Date} currentDate - Current date (defaults to today)
 * @returns {number} Pro-rata leave limit
 */
export function calculateProRataLeave(entitlementDate, annualLimit, currentDate = new Date()) {
  if (!entitlementDate || !annualLimit) {
    return annualLimit || 0;
  }

  const yearStart = new Date(currentDate.getFullYear(), 0, 1);
  yearStart.setHours(0, 0, 0, 0);
  
  let entitlement = new Date(entitlementDate);
  entitlement.setHours(0, 0, 0, 0);
  
  // If entitlement date is in a previous year, use Jan 1st of current year
  if (entitlement.getFullYear() < currentDate.getFullYear()) {
    entitlement = new Date(yearStart);
  }
  
  // If entitlement date is January 1st of current year, return full quota
  if (entitlement.getTime() === yearStart.getTime()) {
    return annualLimit;
  }
  
  // Calculate pro-rata based on remaining days in the year from entitlement date
  const yearEnd = new Date(entitlement.getFullYear(), 11, 31);
  yearEnd.setHours(23, 59, 59, 999);
  
  // Calculate total days in year (365 or 366 for leap year)
  const totalDaysInYear = 365 + (isLeapYear(entitlement.getFullYear()) ? 1 : 0);
  
  // Calculate remaining days from entitlement date to end of year (inclusive)
  const oneDayMs = 1000 * 60 * 60 * 24;
  const remainingDays = Math.floor((yearEnd.getTime() - entitlement.getTime()) / oneDayMs) + 1;
  
  // Calculate pro-rata leave: (remaining days * leave limit) / total days in year
  const proRataLeave = Math.floor((remainingDays * annualLimit) / totalDaysInYear);
  
  return Math.max(0, proRataLeave);
}

/**
 * Get calculated leave limits for a user based on their entitlement date
 * @param {Object} user - User object with leave limits and entitlement date
 * @returns {Object} Calculated leave limits
 */
export function getUserLeaveLimits(user) {
  if (!user) {
    return {
      annual_leave: 0,
      sick_leave: 0,
      maternity_leave: 0,
      paternity_leave: 0
    };
  }

  const entitlementDate = user.leave_entitlement_date || new Date(new Date().getFullYear(), 0, 1);
  
  return {
    annual_leave: calculateProRataLeave(entitlementDate, user.leave_limit || 10),
    sick_leave: calculateProRataLeave(entitlementDate, user.sick_leave_limit || 3),
    maternity_leave: calculateProRataLeave(entitlementDate, user.maternity_leave_limit || 0),
    paternity_leave: calculateProRataLeave(entitlementDate, user.paternity_leave_limit || 2)
  };
}
