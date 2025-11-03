import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Attendance } from '@/models/Attendance';

export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let att = await Attendance.findOne({ user: user.id, date: today });
  if (!att || !att.checkInAt) {
    return NextResponse.json({ message: 'Check-in required first' }, { status: 400 });
  }
  if (att.checkOutAt) {
    return NextResponse.json({ message: 'Already checked out' }, { status: 400 });
  }
  att.checkOutAt = new Date();
  await att.save();
  return NextResponse.json({ attendance: att });
}
