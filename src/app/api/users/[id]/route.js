import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { User } from '@/models/User';
import { Department } from '@/models/Department';

// Update user salary information (HR/Admin only)
export async function PATCH(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'Admin' && user.role !== 'HR') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await connectDB();

  const { id } = await params;
  const updates = await req.json();
  
  try {
    // Get the current user to check if role is actually changing
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Allowed fields to update
    const allowedFields = [
      'name', 'email', 'department', 'role', 
      'basic_salary', 'allowance', 'leave_limit', 'assignedHR'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        // Convert empty string to null for ObjectId fields
        if ((field === 'department' || field === 'assignedHR') && updates[field] === '') {
          updateData[field] = null;
        } else {
          updateData[field] = updates[field];
        }
      }
    });
    
    // Only Admin can change roles - check if role is actually being changed
    if (updateData.role && updateData.role !== existingUser.role && user.role !== 'Admin') {
      return NextResponse.json({ message: 'Only Admin can change user roles' }, { status: 403 });
    }
    
    // HR cannot update Admin or HR users - only Employees
    if (user.role === 'HR' && existingUser.role !== 'Employee') {
      return NextResponse.json({ message: 'HR can only manage Employee accounts' }, { status: 403 });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, select: '-password' }
    );
    
    return NextResponse.json({ user: updatedUser, message: 'User updated successfully' });
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}

// Get user details (HR/Admin can view all, employees can view themselves)
export async function GET(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const { id } = await params;
  
  try {
    // Employees can only view their own profile
    if (user.role === 'Employee' && id !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    const targetUser = await User.findById(id)
      .select('-password')
      .populate('assignedHR', 'name email')
      .lean();
    
    // Manually populate department
    if (targetUser && targetUser.department) {
      targetUser.department = await Department.findById(targetUser.department);
    }
    
    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user: targetUser });
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}

// Delete user (Admin only)
export async function DELETE(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'Admin') {
    return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
  }

  await connectDB();

  try {
    const { id } = await params;

    // Prevent admin from deleting themselves
    if (user.id === id) {
      return NextResponse.json(
        { message: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${deletedUser.name} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Failed to delete user', error: error.message },
      { status: 500 }
    );
  }
}
