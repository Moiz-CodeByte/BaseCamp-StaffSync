import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';
import { autoRejectExpiredLeaves } from '@/lib/leave-utils';

export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['HR', 'Admin'].includes(user.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();

  // Auto-reject expired pending leaves
  await autoRejectExpiredLeaves();

  // Get recently approved leaves (last 10)
  const leaves = await Leave.find({ status: 'Approved' })
    .populate('user', 'name email role department')
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();
  
  return NextResponse.json({ leaves });
}
