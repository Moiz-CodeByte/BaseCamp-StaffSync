import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Department } from '@/models/Department';
import { User } from '@/models/User';

// GET - List all departments
export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['Admin', 'HR', 'Reporting Manager'].includes(user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  try {
    // Reporting Manager can only see their own department
    let matchStage = {};
    if (user.role === 'Reporting Manager') {
      const managerData = await User.findById(user.id).select('department').lean();
      if (!managerData || !managerData.department) {
        return NextResponse.json({ message: 'Manager not assigned to any department' }, { status: 403 });
      }
      matchStage = { $match: { _id: managerData.department } };
    }

    // Use aggregation to get departments with employee counts in one query
    const pipeline = [];
    
    // Add match stage if needed (for Reporting Manager)
    if (user.role === 'Reporting Manager') {
      pipeline.push(matchStage);
    }
    
    pipeline.push(
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
        $lookup: {
          from: 'users',
          localField: 'reportingManager',
          foreignField: '_id',
          as: 'managerUser'
        }
      },
      {
        $unwind: {
          path: '$hrUser',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$managerUser',
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
          },
          reportingManager: {
            _id: '$managerUser._id',
            name: '$managerUser.name',
            email: '$managerUser.email',
            role: '$managerUser.role'
          }
        }
      },
      {
        $project: {
          employees: 0,
          hrUser: 0,
          managerUser: 0
        }
      },
      { $sort: { createdAt: -1 } }
    );
    
    const departmentsWithCount = await Department.aggregate(pipeline);

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
    const { name, reportingManager, hr } = await req.json();

    // Validate required fields
    if (!name || !hr) {
      return NextResponse.json(
        { message: 'Name and HR are required' },
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

    // Verify reporting manager if provided
    if (reportingManager) {
      const manager = await User.findById(reportingManager);
      if (!manager) {
        return NextResponse.json({ message: 'Reporting Manager not found' }, { status: 404 });
      }
      if (manager.role !== 'Reporting Manager') {
        return NextResponse.json({ message: 'Selected user is not a Reporting Manager' }, { status: 400 });
      }
    }

    // Check if department name already exists
    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return NextResponse.json(
        { message: 'Department with this name already exists' },
        { status: 400 }
      );
    }

    const deptData = {
      name,
      hr
    };
    
    if (reportingManager) {
      deptData.reportingManager = reportingManager;
    }

    const department = await Department.create(deptData);

    const populatedDept = await Department.findById(department._id)
      .populate('hr', 'name email role')
      .populate('reportingManager', 'name email role');

    return NextResponse.json(
      { message: 'Department created successfully', department: populatedDept },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
