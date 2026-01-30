import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { User } from '@/models/User';
import { Department } from '@/models/Department';

// Update user salary information (HR/Admin only)
export async function PATCH(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['Admin', 'HR', 'Reporting Manager'].includes(user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await connectDB();

  const { id } = await params;
  const updates = await req.json();
  
  console.log('PATCH /api/users/[id] - Incoming updates:', updates);
  
  try {
    // Get the current user to check if role is actually changing
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // HR and Reporting Manager cannot update Admin or HR users - only Employees (check early)
    if ((user.role === 'HR' || user.role === 'Reporting Manager') && existingUser.role !== 'Employee') {
      return NextResponse.json({ message: 'You can only manage Employee accounts' }, { status: 403 });
    }
    
    // Reporting Manager can only update users in their department
    if (user.role === 'Reporting Manager') {
      const currentUserData = await User.findById(user.id);
      if (!currentUserData.department || existingUser.department?.toString() !== currentUserData.department.toString()) {
        return NextResponse.json({ message: 'You can only manage employees in your department' }, { status: 403 });
      }
    }
    
    // Allowed fields to update
    const allowedFields = [
      'name', 'email', 'department', 'role', 'designation', 'gender',
      'basic_salary', 'allowance', 'leave_limit',
      'sick_leave_limit', 'maternity_leave_limit', 'paternity_leave_limit',
      'reportingManagers', 'leave_entitlement_date'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        // Convert empty string to null for ObjectId fields
        if (field === 'department' && updates[field] === '') {
          updateData[field] = null;
        } else {
          updateData[field] = updates[field];
        }
      }
    });
    
    console.log('PATCH /api/users/[id] - Update data to save:', updateData);
    
    // If leave_entitlement_date is from a previous year, update it to Jan 1st of current year
    if (updateData.leave_entitlement_date || existingUser.leave_entitlement_date) {
      const entitlementDate = new Date(updateData.leave_entitlement_date || existingUser.leave_entitlement_date);
      const currentYear = new Date().getFullYear();
      
      if (entitlementDate.getFullYear() < currentYear) {
        updateData.leave_entitlement_date = new Date(currentYear, 0, 1);
        console.log('Updated leave_entitlement_date from previous year to:', updateData.leave_entitlement_date);
      }
    }
    
    // Only Admin can change roles - check if role is actually being changed
    if (updateData.role && updateData.role !== existingUser.role && user.role !== 'Admin') {
      return NextResponse.json({ message: 'Only Admin can change user roles' }, { status: 403 });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, select: '-password' }
    );
    
    // Handle reporting manager assignment
    const newRole = updateData.role || existingUser.role;
    const newDepartment = updateData.department !== undefined ? updateData.department : existingUser.department;
    const roleChanged = updateData.role && updateData.role !== existingUser.role;
    const departmentChanged = updateData.department !== undefined && updateData.department?.toString() !== existingUser.department?.toString();
    
    // If role changed TO Reporting Manager and has a department, assign to department
    if (roleChanged && newRole === 'Reporting Manager' && newDepartment) {
      await Department.findByIdAndUpdate(newDepartment, {
        reportingManager: id
      });
    }
    // If role changed FROM Reporting Manager, remove from all departments
    else if (roleChanged && existingUser.role === 'Reporting Manager') {
      await Department.updateMany(
        { reportingManager: id },
        { $unset: { reportingManager: 1 } }
      );
    }
    // If Reporting Manager's department changed
    else if (newRole === 'Reporting Manager' && departmentChanged) {
      // Remove from old department
      if (existingUser.department) {
        await Department.findByIdAndUpdate(existingUser.department, {
          $unset: { reportingManager: 1 }
        });
      }
      // Add to new department
      if (newDepartment) {
        await Department.findByIdAndUpdate(newDepartment, {
          reportingManager: id
        });
      }
    }
    
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
      .lean();
    
    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Manually populate department with HR
    if (targetUser.department) {
      const department = await Department.findById(targetUser.department)
        .populate('hr', 'name email')
        .lean();
      targetUser.department = department;
      
      // Set assignedHR from department's HR for frontend compatibility
      if (department?.hr) {
        targetUser.assignedHR = department.hr;
      }
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
  if (user.role !== 'Admin' && user.role !== 'HR') {
    return NextResponse.json({ message: 'Forbidden: Admin/HR access required' }, { status: 403 });
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
