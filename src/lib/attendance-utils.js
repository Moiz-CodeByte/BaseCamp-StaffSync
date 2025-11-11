import { Attendance } from '@/models/Attendance';
import { User } from '@/models/User';

/**
 * Convert to Pakistan Time (PKT) - UTC+5
 * @param {Date} date - Date to convert
 * @returns {Date} Date in PKT
 */
function toPKT(date) {
  // Get UTC time
  const utcTime = date.getTime();
  // PKT is UTC+5 (5 hours * 60 minutes * 60 seconds * 1000 milliseconds)
  const pktOffset = 5 * 60 * 60 * 1000;
  // Create new date in PKT
  const pktDate = new Date(utcTime + pktOffset);
  return pktDate;
}

/**
 * Create a date at midnight in PKT
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @param {number} day - Day
 * @returns {Date} Date at midnight PKT
 */
function createPKTDate(year, month, day) {
  // Create date string in PKT format
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000+05:00`;
  return new Date(dateStr);
}

/**
 * Automatically marks attendance as "Absent" for past dates where user forgot to check in
 * Only marks working days (Monday-Friday) that have passed
 * Saturday and Sunday are excluded as weekend/non-working days
 * Uses Pakistan Time (PKT/UTC+5) for date calculations
 * @param {string} userId - The user ID to check
 * @param {Date} userCreatedAt - When the user account was created
 * @param {number} daysToCheck - How many days back to check (default: 30)
 * @returns {Promise<number>} Number of absent records created
 */
export async function autoMarkAbsentForPastDates(userId, userCreatedAt, daysToCheck = 30) {
  try {
    // Get current date in PKT
    const nowPKT = toPKT(new Date());
    const today = createPKTDate(nowPKT.getFullYear(), nowPKT.getMonth(), nowPKT.getDate());

    // Convert user creation date to PKT and normalize to start of that day
    const userCreatedPKT = toPKT(new Date(userCreatedAt));
    const userStartDate = createPKTDate(userCreatedPKT.getFullYear(), userCreatedPKT.getMonth(), userCreatedPKT.getDate());
    
    // Calculate X days ago from today
    const daysAgo = new Date(today.getTime() - (daysToCheck * 24 * 60 * 60 * 1000));
    
    // Start from the LATER of: user creation date OR X days ago
    // This ensures we never create records before user joined
    const normalizedStart = new Date(Math.max(userStartDate.getTime(), daysAgo.getTime()));

    // Get all existing attendance records for this user in date range
    const existingRecords = await Attendance.find({
      user: userId,
      date: { $gte: normalizedStart, $lt: today }
    });

    // Create a Set of dates that already have records (using PKT date strings)
    const existingDates = new Set(
      existingRecords.map(record => {
        const pktDate = toPKT(new Date(record.date));
        // Format as YYYY-MM-DD in PKT
        const dateStr = `${pktDate.getFullYear()}-${String(pktDate.getMonth() + 1).padStart(2, '0')}-${String(pktDate.getDate()).padStart(2, '0')}`;
        return dateStr;
      })
    );

    // Check each day from start date to yesterday
    const absentRecords = [];
    let currentDate = new Date(normalizedStart.getTime());
    
    while (currentDate < today) {
      const pktCurrentDate = toPKT(currentDate);
      const year = pktCurrentDate.getFullYear();
      const month = pktCurrentDate.getMonth();
      const day = pktCurrentDate.getDate();
      
      // Get day of week in PKT
      const dayOfWeek = pktCurrentDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Create normalized date string for comparison (YYYY-MM-DD in PKT)
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Only check working days (Monday-Friday) and dates without existing records
      // Saturday (6) and Sunday (0) are excluded
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && !existingDates.has(dateString)) {
        // Create date at midnight PKT for storage
        const recordDate = createPKTDate(year, month, day);
        
        absentRecords.push({
          user: userId,
          date: recordDate,
          status: 'Absent',
          remarks: 'Auto-marked: No check-in recorded'
        });
      }
      
      // Move to next day
      currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
    }

    // Insert all absent records in bulk
    if (absentRecords.length > 0) {
      await Attendance.insertMany(absentRecords, { ordered: false })
        .catch(err => {
          // Ignore duplicate key errors (in case of race conditions)
          if (err.code !== 11000) {
            console.error('Error auto-marking absent:', err);
          }
        });
    }

    return absentRecords.length;
  } catch (error) {
    console.error('Error in autoMarkAbsentForPastDates:', error);
    return 0;
  }
}

/**
 * Auto-mark all employees in the system for past dates
 * This can be used as a cron job or scheduled task
 * @returns {Promise<Object>} Summary of records created
 */
export async function autoMarkAbsentForAllEmployees() {
  try {
    const users = await User.find({ role: 'Employee' });
    let totalMarked = 0;
    const results = [];

    for (const user of users) {
      const marked = await autoMarkAbsentForPastDates(user._id, user.createdAt);
      if (marked > 0) {
        results.push({ userId: user._id, name: user.name, marked });
        totalMarked += marked;
      }
    }

    return {
      success: true,
      totalEmployees: users.length,
      totalRecordsCreated: totalMarked,
      details: results
    };
  } catch (error) {
    console.error('Error in autoMarkAbsentForAllEmployees:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
