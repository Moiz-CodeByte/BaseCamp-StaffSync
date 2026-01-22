import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { User } from '@/models/User';
import { Department } from '@/models/Department';

export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['HR', 'Admin'].includes(user.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  
  await connectDB();
  
  // Use populate to fetch departments in a single query (much faster)
  const users = await User.find({}, 'name email role department designation leave_limit sick_leave_limit maternity_leave_limit paternity_leave_limit createdAt')
    .populate({
      path: 'department',
      select: 'name hr',
      populate: {
        path: 'hr',
        select: 'name email'
      }
    })
    .lean();
  
  return NextResponse.json({ users });
}
