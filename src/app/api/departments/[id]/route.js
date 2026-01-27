import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Department } from '@/models/Department';
import { User } from '@/models/User';

// GET - Get single department
export async function GET(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectDB();

  try {
    const { id } = await params;
    const department = await Department.findById(id)
      .populate('hr', 'name email role')
      .populate('reportingManager', 'name email role');
    
    if (!department) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }

    // Get employee count
    const employeeCount = await User.countDocuments({ department: id });
    
    // Get employees in this department
    const employees = await User.find({ department: id }).select('name email role');

    return NextResponse.json({
      department: {
        ...department.toObject(),
        employeeCount,
        employees
      }
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT - Update department
export async function PUT(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['Admin', 'HR'].includes(user.role)) {
    return NextResponse.json({ message: 'Forbidden - Only Admin and HR can update departments' }, { status: 403 });
  }

  await connectDB();

  try {
    const { id } = await params;
    const { name, reportingManagers, hr } = await req.json();

    const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }

    // Validate reporting managers array
    if (reportingManagers !== undefined && !Array.isArray(reportingManagers)) {
      return NextResponse.json(
        { message: 'Reporting managers must be an array' },
        { status: 400 }
      );
    }

    // If HR is being updated, verify the user exists and has HR role
    if (hr && hr !== department.hr.toString()) {
      // Only Admin can change the assigned HR
      if (user.role !== 'Admin') {
        return NextResponse.json({ 
          message: 'Only Admin can change the assigned HR for a department' 
        }, { status: 403 });
      }
      
      const hrUser = await User.findById(hr);
      if (!hrUser) {
        return NextResponse.json({ message: 'HR user not found' }, { status: 404 });
      }
      if (hrUser.role !== 'HR') {
        return NextResponse.json({ message: 'Selected user is not an HR' }, { status: 400 });
      }
    }

    // Check if new name conflicts with existing department (excluding current one)
    if (name && name !== department.name) {
      const existingDept = await Department.findOne({ name, _id: { $ne: id } });
      if (existingDept) {
        return NextResponse.json(
          { message: 'Department with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update fields
    if (name) department.name = name;
    if (reportingManagers !== undefined) {
      const oldManagers = department.reportingManagers || [];
      department.reportingManagers = reportingManagers;
      
      // Get all users in this department who have reporting managers assigned
      const usersInDept = await User.find({ 
        department: id,
        reportingManagers: { $exists: true, $ne: null, $not: { $size: 0 } }
      });
      
      for (const user of usersInDept) {
        let needsUpdate = false;
        let updatedManagers = [...user.reportingManagers];
        
        // Update or remove managers based on department changes
        updatedManagers = updatedManagers.filter((userMgr) => {
          // Find if this manager still exists in department (by email)
          const stillInDept = reportingManagers.find(deptMgr => deptMgr.email === userMgr.email);
          
          if (stillInDept) {
            // Manager still in department, check if details changed
            if (stillInDept.name !== userMgr.name || stillInDept.email !== userMgr.email) {
              needsUpdate = true;
            }
            // Return the updated manager details
            return true;
          } else {
            // Manager was removed from department, remove from user too
            needsUpdate = true;
            return false;
          }
        });

        // Update manager details for remaining managers
        updatedManagers = updatedManagers.map((userMgr) => {
          const deptMgr = reportingManagers.find(m => m.email === userMgr.email);
          if (deptMgr && (deptMgr.name !== userMgr.name || deptMgr.email !== userMgr.email)) {
            needsUpdate = true;
            return { ...deptMgr };
          }
          return userMgr;
        });

        if (needsUpdate) {
          user.reportingManagers = updatedManagers;
          await user.save();
        }
      }
    }
    if (hr) department.hr = hr;

    await department.save();

    const updatedDept = await Department.findById(id)
      .populate('hr', 'name email role')
      .populate('reportingManager', 'name email role');

    return NextResponse.json({
      message: 'Department updated successfully',
      department: updatedDept
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE - Delete department
export async function DELETE(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['Admin', 'HR'].includes(user.role)) {
    return NextResponse.json({ message: 'Forbidden - Only Admin and HR can delete departments' }, { status: 403 });
  }

  await connectDB();

  try {
    const { id } = await params;
    
    // Check if department exists
    const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }

    // Check if any users are assigned to this department
    const employeeCount = await User.countDocuments({ department: id });
    if (employeeCount > 0) {
      return NextResponse.json(
        { message: `Cannot delete department. ${employeeCount} employee(s) are assigned to this department.` },
        { status: 400 }
      );
    }

    await Department.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
