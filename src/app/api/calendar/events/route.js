import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { CalendarEvent } from '@/models/CalendarEvent';

export async function GET() {
  await connectDB();
  const events = await CalendarEvent.find().sort({ date: 1 });
  return NextResponse.json({ events });
}

export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['HR', 'Admin'].includes(user.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();
  const { title, description, date, type } = await req.json();
  const event = await CalendarEvent.create({ title, description, date: new Date(date), type, createdBy: user.id });
  return NextResponse.json({ event }, { status: 201 });
}
