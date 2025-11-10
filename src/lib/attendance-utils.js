import { Attendance } from '@/models/Attendance';
import { User } from '@/models/User';

/**
 * Automatically marks attendance as "Absent" for past dates where user forgot to check in
 * Only marks working days (Monday-Friday) that have passed
 * Saturday and Sunday are excluded as weekend/non-working days
 * @param {string} userId - The user ID to check
 * @param {Date} userCreatedAt - When the user account was created
 * @param {number} daysToCheck - How many days back to check (default: 30)
 * @returns {Promise<number>} Number of absent records created
 */
export async function autoMarkAbsentForPastDates(userId, userCreatedAt, daysToCheck = 30) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from user creation date or X days ago, whichever is more recent
    const daysAgo = new Date(today);
    daysAgo.setDate(daysAgo.getDate() - daysToCheck);
    
    const startDate = new Date(Math.max(new Date(userCreatedAt).getTime(), daysAgo.getTime()));
    startDate.setHours(0, 0, 0, 0);

    // Get all existing attendance records for this user in date range
    const existingRecords = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lt: today }
    });

    // console.log(`Found ${existingRecords.length} existing records for user ${userId}`);

    // Create a Set of dates that already have records
    // Normalize dates to local date strings for comparison
    const existingDates = new Set(
      existingRecords.map(record => {
        const date = new Date(record.date);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        // console.log(  Existing record: ${dateStr} (${record.status}));
        return dateStr;
      })
    );

    // Check each day from start date to yesterday
    const absentRecords = [];
    let currentDate = new Date(startDate);
    
    while (currentDate < today) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Create a normalized date for comparison
      const checkDate = new Date(currentDate);
      checkDate.setHours(0, 0, 0, 0);
      const dateString = checkDate.toISOString().split('T')[0];
      
      // Only check working days (Monday-Friday) and dates without existing records
      // Saturday (6) and Sunday (0) are excluded
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && !existingDates.has(dateString)) {
        // Create date at start of day for storage
        const recordDate = new Date(currentDate);
        recordDate.setHours(0, 0, 0, 0);
        
        absentRecords.push({
          user: userId,
          date: recordDate,
          status: 'Absent',
          remarks: 'Auto-marked: No check-in recorded'
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
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
