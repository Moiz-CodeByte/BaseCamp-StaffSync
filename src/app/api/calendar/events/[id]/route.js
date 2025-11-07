import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { CalendarEvent } from '@/models/CalendarEvent';

export async function DELETE(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['HR', 'Admin'].includes(user.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  
  await connectDB();
  const { id } = await params;
  
  const event = await CalendarEvent.findByIdAndDelete(id);
  if (!event) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }
  
  return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
}
