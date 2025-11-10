import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Attendance } from '@/models/Attendance';
import { User } from '@/models/User';
import { autoMarkAbsentForPastDates } from '@/lib/attendance-utils';

export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();

  // Get user details to check when they joined
  const userDetails = await User.findById(user.id);
  if (!userDetails) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  // Auto-mark past dates as absent if no check-in
  await autoMarkAbsentForPastDates(user.id, userDetails.createdAt);

  const records = await Attendance.find({ user: user.id })
    .sort({ date: -1 })
    .limit(30);
  return NextResponse.json({ records });
}
