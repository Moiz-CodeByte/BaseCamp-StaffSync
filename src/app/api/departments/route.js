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
    // Use aggregation to get departments with employee counts in one query
    const departmentsWithCount = await Department.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'employees'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'hr',
          foreignField: '_id',
          as: 'hrUser'
        }
      },
      {
        $unwind: {
          path: '$hrUser',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          employeeCount: { $size: '$employees' },
          hr: {
            _id: '$hrUser._id',
            name: '$hrUser.name',
            email: '$hrUser.email',
            role: '$hrUser.role'
          }
        }
      },
      {
        $project: {
          employees: 0,
          hrUser: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

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
