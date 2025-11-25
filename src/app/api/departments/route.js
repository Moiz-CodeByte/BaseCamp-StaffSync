import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Department } from '@/models/Department';
import { User } from '@/models/User';

// GET - List all departments
export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['Admin', 'HR'].includes(user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  try {
    const departments = await Department.find()
      .populate('hr', 'name email role')
      .sort({ createdAt: -1 });
    
    // Get employee count for each department
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await User.countDocuments({ department: dept._id });
        return {
          ...dept.toObject(),
          employeeCount
        };
      })
    );

    return NextResponse.json({ departments: departmentsWithCount });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST - Create new department
export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['Admin', 'HR'].includes(user.role)) {
    return NextResponse.json({ message: 'Forbidden - Only Admin and HR can create departments' }, { status: 403 });
  }

  await connectDB();

  try {
    const { name, reportingManagers, hr } = await req.json();

    // Validate required fields
    if (!name || !hr) {
      return NextResponse.json(
        { message: 'Name and HR are required' },
        { status: 400 }
      );
    }

    // Validate reporting managers array
    if (reportingManagers && !Array.isArray(reportingManagers)) {
      return NextResponse.json(
        { message: 'Reporting managers must be an array' },
        { status: 400 }
      );
    }

    // Verify HR user exists and has HR role
    const hrUser = await User.findById(hr);
    if (!hrUser) {
      return NextResponse.json({ message: 'HR user not found' }, { status: 404 });
    }
    if (hrUser.role !== 'HR') {
      return NextResponse.json({ message: 'Selected user is not an HR' }, { status: 400 });
    }

    // Check if department name already exists
    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return NextResponse.json(
        { message: 'Department with this name already exists' },
        { status: 400 }
      );
    }

    const department = await Department.create({
      name,
      reportingManagers: reportingManagers || [],
      hr
    });

    const populatedDept = await Department.findById(department._id).populate('hr', 'name email role');

    return NextResponse.json(
      { message: 'Department created successfully', department: populatedDept },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
