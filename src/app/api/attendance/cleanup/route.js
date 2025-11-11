import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Attendance } from '@/models/Attendance';
import { User } from '@/models/User';

/**
 * Convert to Pakistan Time (PKT) - UTC+5
 */
function toPKT(date) {
  const utcTime = date.getTime();
  const pktOffset = 5 * 60 * 60 * 1000;
  const pktDate = new Date(utcTime + pktOffset);
  return pktDate;
}

/**
 * Create a date at midnight in PKT
 */
function createPKTDate(year, month, day) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000+05:00`;
  return new Date(dateStr);
}

/**
 * GET /api/attendance/cleanup - Clean up attendance records
 * - Removes records before user creation date
 * - Removes duplicate records for same date
 * - Admin only
 */
export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only Admin can run cleanup
  if (user.role !== 'Admin') {
    return NextResponse.json({ message: 'Forbidden - Admin only' }, { status: 403 });
  }

  await connectDB();

  try {
    let totalDeleted = 0;
    const results = [];

    // Get all users
    const users = await User.find();

    for (const dbUser of users) {
      const userId = dbUser._id;
      const userCreatedAt = dbUser.createdAt;
      
      // Convert user creation date to PKT
      const userCreatedPKT = toPKT(new Date(userCreatedAt));
      const userStartDate = createPKTDate(
        userCreatedPKT.getFullYear(),
        userCreatedPKT.getMonth(),
        userCreatedPKT.getDate()
      );

      // Get all attendance records for this user
      const allRecords = await Attendance.find({ user: userId }).sort({ date: 1 });

      // Track records to delete
      const recordsToDelete = [];
      const seenDates = new Map(); // Map to track unique dates by PKT date string

      for (const record of allRecords) {
        const recordDate = new Date(record.date);
        
        // Check if record is before user creation date
        if (recordDate < userStartDate) {
          recordsToDelete.push(record._id);
          continue;
        }

        // Convert to PKT and create date string for duplicate detection
        const pktDate = toPKT(recordDate);
        const dateKey = `${pktDate.getFullYear()}-${String(pktDate.getMonth() + 1).padStart(2, '0')}-${String(pktDate.getDate()).padStart(2, '0')}`;

        // Check for duplicates
        if (seenDates.has(dateKey)) {
          // Keep the first record, delete duplicates
          recordsToDelete.push(record._id);
        } else {
          seenDates.set(dateKey, record._id);
        }
      }

      // Delete identified records
      if (recordsToDelete.length > 0) {
        await Attendance.deleteMany({ _id: { $in: recordsToDelete } });
        totalDeleted += recordsToDelete.length;
        results.push({
          userId: userId.toString(),
          userName: dbUser.name,
          deleted: recordsToDelete.length
        });
      }
    }

    return NextResponse.json({
      message: 'Cleanup completed successfully',
      totalDeleted,
      details: results
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { message: 'Cleanup failed', error: error.message },
      { status: 500 }
    );
  }
}
