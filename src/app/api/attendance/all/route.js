import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Attendance } from '@/models/Attendance';

/**
 * GET /api/attendance/all - Get all attendance records (Admin/HR only)
 * Query params:
 * - startDate: Filter by start date (optional)
 * - endDate: Filter by end date (optional)
 * - userId: Filter by specific user (optional)
 * - status: Filter by status (optional)
 */
export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['Admin', 'HR'].includes(user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    // Build query
    let query = {};

    if (startDate && endDate) {
      // For date comparisons, set time to start and end of day
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startDateTime,
        $lte: endDateTime,
      };
    } else if (startDate) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      query.date = { $gte: startDateTime };
    } else if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query.date = { $lte: endDateTime };
    }

    if (userId) {
      query.user = userId;
    }

    if (status) {
      query.status = status;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('user', 'name email role department')
      .sort({ date: -1, 'user.name': 1 })
      .limit(1000); // Limit to prevent excessive data

    return NextResponse.json({ 
      success: true, 
      attendance: attendanceRecords,
      count: attendanceRecords.length 
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { message: 'Failed to fetch attendance records', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendance/all - Manually create/update attendance record (Admin/HR only)
 */
export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['Admin', 'HR'].includes(user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  try {
    const { userId, date, status, remarks, checkInAt, checkOutAt } = await req.json();

    if (!userId || !date || !status) {
      return NextResponse.json(
        { message: 'userId, date, and status are required' },
        { status: 400 }
      );
    }

    // Check if attendance record already exists for this user and date
    const existingRecord = await Attendance.findOne({
      user: userId,
      date: new Date(date),
    });

    if (existingRecord) {
      // Update existing record
      existingRecord.status = status;
      existingRecord.remarks = remarks || existingRecord.remarks;
      if (checkInAt) existingRecord.checkInAt = new Date(checkInAt);
      if (checkOutAt) existingRecord.checkOutAt = new Date(checkOutAt);
      await existingRecord.save();

      const updatedRecord = await Attendance.findById(existingRecord._id)
        .populate('user', 'name email role department');

      return NextResponse.json({
        success: true,
        message: 'Attendance record updated successfully',
        attendance: updatedRecord,
      });
    } else {
      // Create new record
      const newRecord = await Attendance.create({
        user: userId,
        date: new Date(date),
        status,
        remarks,
        checkInAt: checkInAt ? new Date(checkInAt) : undefined,
        checkOutAt: checkOutAt ? new Date(checkOutAt) : undefined,
      });

      const populatedRecord = await Attendance.findById(newRecord._id)
        .populate('user', 'name email role department');

      return NextResponse.json({
        success: true,
        message: 'Attendance record created successfully',
        attendance: populatedRecord,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating attendance record:', error);
    return NextResponse.json(
      { message: 'Failed to create/update attendance record', error: error.message },
      { status: 500 }
    );
  }
}
