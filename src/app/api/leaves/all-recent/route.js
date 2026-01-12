import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Leave } from '@/models/Leave';
import { authenticateRequest } from '@/lib/auth';
import { autoRejectExpiredLeaves } from '@/lib/leave-utils';

// GET /api/leaves/all-recent - Get all recent leave requests (all statuses)
export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only HR and Admin can view all recent leave requests
  if (!['HR', 'Admin'].includes(user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  // Auto-reject expired pending leaves
  await autoRejectExpiredLeaves();

  try {
    // Fetch recent leave requests (all statuses) sorted by creation date
    const leaves = await Leave.find()
      .populate('user', 'name email role department')
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    return NextResponse.json({ leaves });
  } catch (error) {
    console.error('Error fetching recent leave requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch recent leave requests' },
      { status: 500 }
    );
  }
}
