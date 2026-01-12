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
  if (user.role !== 'HR') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  
  await connectDB();
  
  // Auto-reject expired pending leaves
  await autoRejectExpiredLeaves();

  try {
    // Fetch all data in parallel
    const [usersData, departmentsData, pendingLeaves, recentApproved, allRecent, meData] = await Promise.all([
      // Users with populated departments
      User.find({}, 'name email role department designation reportingManagers leave_limit leaveEntitlementDate sick_leave_limit createdAt')
        .populate({
          path: 'department',
          select: 'name hr reportingManagers',
          populate: {
            path: 'hr',
            select: 'name email'
          }
        })
        .lean(),
      
      // Departments with employee counts via aggregation
      Department.aggregate([
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
      ]),
      
      // Pending leaves
      Leave.find({ status: 'Pending' })
        .populate('user', 'name email role leave_limit')
        .sort({ createdAt: -1 })
        .lean(),
      
      // Recently approved leaves
      Leave.find({ status: 'Approved' })
        .populate('user', 'name email role department')
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
      
      // All recent leaves
      Leave.find()
        .populate('user', 'name email role department')
        .sort({ createdAt: -1 })
        .limit(15)
        .lean(),
      
      // Current user
      User.findById(user.id).select('-password').lean()
    ]);

    // Set reporting managers for users
    for (const userItem of usersData) {
      if (userItem.reportingManagers === undefined || userItem.reportingManagers === null) {
        userItem.reportingManagers = userItem.department?.reportingManagers || [];
      }
    }
    
    // Filter HR users
    const hrUsers = usersData.filter(u => u.role === 'HR');
    
    // Filter pending leaves (HR only sees Employee requests)
    const filteredPendingLeaves = pendingLeaves.filter(leave => 
      leave.user && leave.user.role === 'Employee'
    );

    return NextResponse.json({
      users: usersData,
      departments: departmentsData,
      hrUsers,
      pending: filteredPendingLeaves,
      recentlyApproved: recentApproved,
      allRecentLeaves: allRecent,
      me: meData
    });
  } catch (error) {
    console.error('HR dashboard data fetch error:', error);
    return NextResponse.json({ message: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
