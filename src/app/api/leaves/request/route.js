import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';

export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const body = await req.json();
  const { type, startDate, endDate, reason } = body;
  try {
    const leave = await Leave.create({
      user: user.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    });
    return NextResponse.json({ leave }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
