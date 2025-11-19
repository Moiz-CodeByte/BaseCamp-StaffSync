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
  const users = await User.find({}, 'name email role department basic_salary allowance leave_limit createdAt')
    .lean();
  
  // Manually populate departments
  for (const user of users) {
    if (user.department) {
      user.department = await Department.findById(user.department);
    }
  }
  
  return NextResponse.json({ users });
}
