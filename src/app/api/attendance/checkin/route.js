import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Attendance } from '@/models/Attendance';

/**
 * Create a date at midnight in PKT (UTC+5)
 */
function createPKTDate(year, month, day) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000+05:00`;
  return new Date(dateStr);
}

/**
 * Get current date in PKT
 */
function getCurrentPKTDate() {
  const now = new Date();
  const utcTime = now.getTime();
  const pktOffset = 5 * 60 * 60 * 1000; // PKT is UTC+5
  const pktDate = new Date(utcTime + pktOffset);
  return pktDate;
}

export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();

  // Get today's date in PKT at midnight
  const nowPKT = getCurrentPKTDate();
  const today = createPKTDate(nowPKT.getFullYear(), nowPKT.getMonth(), nowPKT.getDate());

  let att = await Attendance.findOne({ user: user.id, date: today });
  if (!att) {
    att = await Attendance.create({ user: user.id, date: today, checkInAt: new Date() });
  } else {
    if (att.checkInAt) {
      return NextResponse.json({ message: 'Already checked in' }, { status: 400 });
    }
    att.checkInAt = new Date();
    await att.save();
  }
  return NextResponse.json({ attendance: att });
}
