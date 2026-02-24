import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { User } from '@/models/User';
import { Department } from '@/models/Department';

export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['HR', 'Admin', 'Reporting Manager'].includes(user.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  
  await connectDB();
  
  // Build query based on role
  let userQuery = {};
  
  // Reporting Manager can only see users from their department
  if (user.role === 'Reporting Manager') {
    const managerData = await User.findById(user.id).select('department').lean();
    if (!managerData || !managerData.department) {
      return NextResponse.json({ message: 'Manager not assigned to any department' }, { status: 403 });
    }
    userQuery.department = managerData.department;
  }
  
  // Use populate to fetch departments in a single query (much faster)
  const users = await User.find(userQuery, 'name email role department designation gender leave_limit sick_leave_limit maternity_leave_limit paternity_leave_limit leave_entitlement_date createdAt')
    .populate({
      path: 'department',
      select: 'name hr reportingManagers',
      populate: [
        {
          path: 'hr',
          select: 'name email'
        },
        {
          path: 'reportingManagers',
          select: 'name email'
        }
      ]
    })
    .lean();
  
  return NextResponse.json({ users });
}
