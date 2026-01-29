import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  await connectDB();
  const { name, email, password, role, department, designation, leave_entitlement_date, leave_limit, sick_leave_limit, maternity_leave_limit, paternity_leave_limit } = await req.json();

  const exists = await User.findOne({ email });
  if (exists) {
    return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
  }

  try {
    // If leave_entitlement_date is from a previous year, set it to Jan 1st of current year
    let entitlementDate = leave_entitlement_date;
    if (entitlementDate) {
      const entitlement = new Date(entitlementDate);
      const currentYear = new Date().getFullYear();
      
      if (entitlement.getFullYear() < currentYear) {
        entitlementDate = new Date(currentYear, 0, 1).toISOString();
        console.log('Adjusted leave_entitlement_date from previous year to:', entitlementDate);
      }
    }
    
    const userData = { 
      name, 
      email, 
      password, 
      role, 
      department: department || undefined,
      designation: designation || undefined,
      leave_entitlement_date: entitlementDate || undefined,
      leave_limit: leave_limit !== undefined ? leave_limit : 10,
      sick_leave_limit: sick_leave_limit !== undefined ? sick_leave_limit : 3,
      maternity_leave_limit: maternity_leave_limit !== undefined ? maternity_leave_limit : 0,
      paternity_leave_limit: paternity_leave_limit !== undefined ? paternity_leave_limit : 2
    };
    
    const user = await User.create(userData);
    
    // If creating a Reporting Manager with a department, assign them to that department
    if (role === 'Reporting Manager' && department) {
      await Department.findByIdAndUpdate(department, {
        reportingManager: user._id
      });
    }
    
    const token = signToken(user);
    return NextResponse.json(
      { token, user: { id: user._id, name, email, role: user.role, department: user.department } },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
