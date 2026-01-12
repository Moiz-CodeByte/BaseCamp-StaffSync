import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';
import { autoRejectExpiredLeaves } from '@/lib/leave-utils';

export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();

  // Auto-reject expired pending leaves
  await autoRejectExpiredLeaves();

  // Check if userId is provided in query params (for admin/HR viewing other users)
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  // Use provided userId if available, otherwise use authenticated user's id
  const targetUserId = userId || user.id;

  const leaves = await Leave.find({ user: targetUserId })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  return NextResponse.json({ leaves });
}
