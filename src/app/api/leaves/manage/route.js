import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';
import { Attendance } from '@/models/Attendance';

export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['HR', 'Admin'].includes(user.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();

  const leaves = await Leave.find({ status: 'Pending' }).populate('user', 'name email role').sort({ createdAt: -1 });
  return NextResponse.json({ leaves });
}

export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['HR', 'Admin'].includes(user.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();

  const { leaveId, action } = await req.json();
  const leave = await Leave.findById(leaveId);
  if (!leave) return NextResponse.json({ message: 'Leave not found' }, { status: 404 });
  if (leave.status !== 'Pending') return NextResponse.json({ message: 'Already processed' }, { status: 400 });
  if (!['approve', 'reject'].includes(action)) return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  
  leave.status = action === 'approve' ? 'Approved' : 'Rejected';
  leave.approver = user.id;
  await leave.save();
  
  // If approved, automatically mark all days as absent in attendance
  if (action === 'approve') {
    try {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      // Create attendance records for each day in the leave period
      const attendanceRecords = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Check if attendance already exists for this date
        const existingAttendance = await Attendance.findOne({
          user: leave.user,
          date: {
            $gte: new Date(dateString),
            $lt: new Date(new Date(dateString).getTime() + 24 * 60 * 60 * 1000)
          }
        });
        
        // Only create if doesn't exist
        if (!existingAttendance) {
          attendanceRecords.push({
            user: leave.user,
            date: new Date(dateString),
            status: 'Absent',
            leaveType: leave.type, // Store leave type for reference
            remarks: `Approved ${leave.type} leave`
          });
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Bulk insert attendance records
      if (attendanceRecords.length > 0) {
        await Attendance.insertMany(attendanceRecords);
      }
      
      return NextResponse.json({ 
        leave, 
        message: `Leave approved and ${attendanceRecords.length} attendance records created` 
      });
    } catch (e) {
      console.error('Error creating attendance records:', e);
      // Leave is still approved even if attendance creation fails
      return NextResponse.json({ 
        leave, 
        warning: 'Leave approved but failed to create some attendance records',
        error: e.message 
      });
    }
  }
  
  return NextResponse.json({ leave });
}
