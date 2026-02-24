import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { User } from '@/models/User';
import { Leave } from '@/models/Leave';
import { Department } from '@/models/Department';
import { autoRejectExpiredLeaves } from '@/lib/leave-utils';

export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'Reporting Manager') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  
  await connectDB();
  
  // Auto-reject expired pending leaves
  await autoRejectExpiredLeaves();

  try {
    // Get the manager's department
    const managerData = await User.findById(user.id).select('department').lean();
    if (!managerData || !managerData.department) {
      return NextResponse.json({ message: 'Manager not assigned to any department' }, { status: 403 });
    }

    const managerDepartmentId = managerData.department;

    // Fetch all data in parallel - but only for the manager's department
    const [usersData, departmentData, pendingLeaves, recentApproved, allRecent, meData] = await Promise.all([
      // Users only from this department
      User.find({ department: managerDepartmentId }, 'name email role department designation gender leave_limit sick_leave_limit maternity_leave_limit paternity_leave_limit createdAt')
        .populate({
          path: 'department',
          select: 'name hr',
          populate: {
            path: 'hr',
            select: 'name email'
          }
        })
        .lean(),
      
      // Only this department with employee count
      Department.aggregate([
        { $match: { _id: managerDepartmentId } },
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
            localField: 'reportingManagers',
            foreignField: '_id',
            as: 'reportingManagersData'
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
            },
            reportingManagers: '$reportingManagersData'
          }
        },
        {
          $project: {
            employees: 0,
            hrUser: 0,
            reportingManagersData: 0
          }
        }
      ]),
      
      // Pending leaves - only from employees in this department
      Leave.find({ status: 'Pending' })
        .populate({
          path: 'user',
          match: { department: managerDepartmentId },
          select: 'name email role leave_limit department',
          populate: {
            path: 'department',
            select: 'hr name'
          }
        })
        .sort({ createdAt: -1 })
        .lean(),
      
      // Recently approved leaves - only from employees in this department
      Leave.find({ status: 'Approved' })
        .populate({
          path: 'user',
          match: { department: managerDepartmentId },
          select: 'name email role department',
          populate: {
            path: 'department',
            select: 'hr name'
          }
        })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
      
      // All recent leaves (approved, rejected, pending) - only from this department
      Leave.find({ status: { $in: ['Approved', 'Rejected', 'Pending'] } })
        .populate({
          path: 'user',
          match: { department: managerDepartmentId },
          select: 'name email role department',
          populate: {
            path: 'department',
            select: 'hr name'
          }
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      
      // Current user data
      User.findById(user.id)
        .populate({
          path: 'department',
          populate: {
            path: 'hr',
            select: 'name email'
          }
        })
        .select('-password')
        .lean()
    ]);

    // Filter out leaves where user population failed (user not in department)
    const filteredPending = pendingLeaves.filter(leave => leave.user);
    const filteredRecentApproved = recentApproved.filter(leave => leave.user);
    const filteredAllRecent = allRecent.filter(leave => leave.user);

    // Get HR users - empty for manager as they don't manage other departments
    const hrUsers = [];

    // Set assignedHR from department's HR for frontend compatibility
    if (meData.department?.hr) {
      meData.assignedHR = meData.department.hr;
    }

    return NextResponse.json({
      users: usersData || [],
      departments: departmentData || [],
      hrUsers: hrUsers,
      pending: filteredPending || [],
      recentlyApproved: filteredRecentApproved || [],
      allRecentLeaves: filteredAllRecent || [],
      me: meData
    });
  } catch (error) {
    console.error('Manager dashboard error:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch dashboard data',
      error: error.message 
    }, { status: 500 });
  }
}
