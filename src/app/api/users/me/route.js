import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';

export async function GET(req) {
  await connectDB();
  const decoded = authenticateRequest(req);
  if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  
  try {
    const user = await User.findById(decoded.id).populate('assignedHR', 'name email').select('-password');
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await connectDB();
  const decoded = authenticateRequest(req);
  if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, email, password, currentPassword } = body;

    const user = await User.findById(decoded.id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Update name and email
    if (name) user.name = name;
    if (email) user.email = email;

    // Update password if provided
    if (password) {
      if (!currentPassword) {
        return NextResponse.json({ message: 'Current password is required to set new password' }, { status: 400 });
      }
      
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
      }
      
      user.password = password;
    }

    await user.save();

    const updatedUser = await User.findById(decoded.id).populate('assignedHR', 'name email').select('-password');
    return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
