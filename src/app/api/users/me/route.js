import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { connectDB } from '@/lib/db';

export async function GET(req) {
  await connectDB();
  const decoded = authenticateRequest(req);
  if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  
  try {
    const user = await User.findById(decoded.id)
      .populate({
        path: 'assignedHR',
        select: 'name email'
      })
      .select('-password')
      .lean();
    
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    
    // Manually populate department
    if (user.department) {
      const department = await Department.findById(user.department);
      user.department = department;
      
      // If user has no reportingManagers field at all (undefined), use department managers
      // If it's an empty array [], that means explicitly set to zero managers
      if (user.reportingManagers === undefined || user.reportingManagers === null) {
        user.reportingManagers = department?.reportingManagers || [];
      }
    } else {
      // Ensure reportingManagers field exists (for backward compatibility)
      if (user.reportingManagers === undefined || user.reportingManagers === null) {
        user.reportingManagers = [];
      }
    }
    
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

// Support PUT method as well (alias to PATCH)
export async function PUT(req) {
  return PATCH(req);
}
