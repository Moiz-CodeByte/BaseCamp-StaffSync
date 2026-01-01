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
  const users = await User.find({}, 'name email role department designation reportingManagers leave_limit leaveEntitlementDate sick_leave_limit createdAt')
    .lean();
  
  // Manually populate departments with HR and set reporting managers
  for (const user of users) {
    if (user.department) {
      user.department = await Department.findById(user.department).populate('hr', 'name email').lean();
      
      // If user has no reportingManagers field at all (undefined), use department managers
      // If it's an empty array [], that means explicitly set to zero managers
      if (user.reportingManagers === undefined || user.reportingManagers === null) {
        user.reportingManagers = user.department?.reportingManagers || [];
      }
    } else {
      // Ensure reportingManagers field exists (for backward compatibility)
      if (user.reportingManagers === undefined || user.reportingManagers === null) {
        user.reportingManagers = [];
      }
    }
  }
  
  return NextResponse.json({ users });
}
