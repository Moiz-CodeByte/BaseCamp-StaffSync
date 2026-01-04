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
  const users = await User.find({}, 'name email role department designation reportingManagers leave_limit leaveEntitlementDate sick_leave_limit createdAt')
    .populate({
      path: 'department',
      select: 'name hr reportingManagers',
      populate: {
        path: 'hr',
        select: 'name email'
      }
    })
    .lean();
  
  // Set reporting managers efficiently (no additional queries)
  for (const user of users) {
    // If user has no reportingManagers field at all (undefined), use department managers
    // If it's an empty array [], that means explicitly set to zero managers
    if (user.reportingManagers === undefined || user.reportingManagers === null) {
      user.reportingManagers = user.department?.reportingManagers || [];
    }
  }
  
  return NextResponse.json({ users });
}
