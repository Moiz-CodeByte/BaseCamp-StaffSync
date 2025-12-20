import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  await connectDB();
  const { name, email, password, role, department, designation, previousLeavesAvailed } = await req.json();

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
