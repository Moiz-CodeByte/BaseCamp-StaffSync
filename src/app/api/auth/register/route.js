import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  await connectDB();
  const { name, email, password, role, department, designation, previousLeavesAvailed, leaveEntitlementDate } = await req.json();

  const exists = await User.findOne({ email });
  if (exists) {
    return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
  }

  try {
    const userData = { 
      name, 
      email, 
      password, 
      role, 
      department: department || undefined,
      designation: designation || undefined
    };
    
    // Only add previousLeavesAvailed if provided and greater than 0
    if (previousLeavesAvailed && previousLeavesAvailed > 0) {
      userData.previousLeavesAvailed = previousLeavesAvailed;
      userData.previousLeavesAvailedYear = new Date().getFullYear();
    }
    
    // Add leaveEntitlementDate if provided
    if (leaveEntitlementDate) {
      userData.leaveEntitlementDate = new Date(leaveEntitlementDate);
      
      // Auto-calculate leave_limit based on entitlement date
      const now = new Date();
      const currentYear = now.getFullYear();
      const entitlementDate = new Date(leaveEntitlementDate);
      const entitlementYear = entitlementDate.getFullYear();
      
      // Use entitlement date if in current year, otherwise use Jan 1
      const effectiveDate = entitlementYear === currentYear 
        ? entitlementDate 
        : new Date(currentYear, 0, 1);
      
      const endOfYear = new Date(currentYear, 11, 31);
      const daysFromEntitlementToYearEnd = Math.floor((endOfYear - effectiveDate) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calculate leave_limit: days(entitlementDate, yearEnd) × 10 ÷ 365
      // Round: if decimal >= 0.5, round up; otherwise round down
      const calculatedLeaveLimit = Math.round((daysFromEntitlementToYearEnd * 10) / 365);
      userData.leave_limit = calculatedLeaveLimit;
    }
    
    const user = await User.create(userData);
    const token = signToken(user);
    return NextResponse.json(
      { token, user: { id: user._id, name, email, role: user.role, department: user.department } },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
