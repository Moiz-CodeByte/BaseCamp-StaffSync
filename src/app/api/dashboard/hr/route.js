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
    // First, find departments managed by this HR
    const hrDepartments = await Department.find({ hr: user.id }).select('_id').lean();
    const departmentIds = hrDepartments.map(dept => dept._id);
    
    // Fetch all data in parallel
    const [usersData, departmentsData, pendingLeaves, recentApproved, allRecent, meData] = await Promise.all([
      // Users with populated departments
      User.find({}, 'name email role department designation leave_limit sick_leave_limit maternity_leave_limit paternity_leave_limit createdAt')
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
      
      // Pending leaves - only from employees in HR's departments
      Leave.find({ status: 'Pending' })
        .populate({
          path: 'user',
          select: 'name email role leave_limit department',
          populate: {
            path: 'department',
            select: 'hr'
          }
        })
        .sort({ createdAt: -1 })
        .lean(),
      
      // Recently approved leaves - only from employees in HR's departments
      Leave.find({ status: 'Approved' })
        .populate({
          path: 'user',
          select: 'name email role department',
          populate: {
            path: 'department',
            select: 'hr'
          }
        })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
      
      // All recent leaves - only from employees in HR's departments
      Leave.find()
        .populate({
          path: 'user',
          select: 'name email role department',
          populate: {
            path: 'department',
            select: 'hr'
          }
        })
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
    
    // Filter pending leaves (HR only sees Employee requests from their departments)
    const filteredPendingLeaves = pendingLeaves.filter(leave => 
      leave.user && 
      leave.user.role === 'Employee' &&
      leave.user.department &&
      leave.user.department.hr &&
      leave.user.department.hr.toString() === user.id
    );
    
    // Filter recently approved leaves (HR only sees their department employees)
    const filteredRecentlyApproved = recentApproved.filter(leave =>
      leave.user &&
      leave.user.role === 'Employee' &&
      leave.user.department &&
      leave.user.department.hr &&
      leave.user.department.hr.toString() === user.id
    );
    
    // Filter all recent leaves (HR only sees their department employees)
    const filteredAllRecent = allRecent.filter(leave =>
      leave.user &&
      leave.user.role === 'Employee' &&
      leave.user.department &&
      leave.user.department.hr &&
      leave.user.department.hr.toString() === user.id
    );

    return NextResponse.json({
      users: usersData,
      departments: departmentsData,
      hrUsers,
      pending: filteredPendingLeaves,
      recentlyApproved: filteredRecentlyApproved,
      allRecentLeaves: filteredAllRecent,
      me: meData
    });
  } catch (error) {
    console.error('HR dashboard data fetch error:', error);
    return NextResponse.json({ message: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
