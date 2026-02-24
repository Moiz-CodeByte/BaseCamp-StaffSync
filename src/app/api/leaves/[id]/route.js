import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';
import { sendHRNotificationEmail } from '@/lib/email';
import { sendLeaveStatusEmail } from '@/lib/email';
import { calculateLeaveStats } from '@/lib/leave-stats';

// PUT/PATCH - Update leave status (Admin/HR only)
export async function PUT(req, { params }) {
  await connectDB();
  const decoded = authenticateRequest(req);
  if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  // Only Admin, HR, and Reporting Manager can approve/reject leaves
  if (!['Admin', 'HR', 'Reporting Manager'].includes(decoded.role)) {
    return NextResponse.json({ message: 'Forbidden - Only Admin, HR and Reporting Manager can update leave status' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // Validate status
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status. Must be Approved, Rejected, or Pending' }, { status: 400 });
    }

    const leave = await Leave.findById(id).populate('user');
    
    if (!leave) {
      return NextResponse.json({ message: 'Leave request not found' }, { status: 404 });
    }

    // Reporting Manager can only update leaves from their department
    if (decoded.role === 'Reporting Manager') {
      const managerData = await User.findById(decoded.id).select('department').lean();
      if (!managerData || !managerData.department) {
        return NextResponse.json({ message: 'Manager not assigned to any department' }, { status: 403 });
      }
      
      const employeeWithDept = await User.findById(leave.user._id).select('department').lean();
      if (!employeeWithDept.department || 
          employeeWithDept.department.toString() !== managerData.department.toString()) {
        return NextResponse.json({ message: 'You can only manage leaves from your department' }, { status: 403 });
      }
    }

    const previousStatus = leave.status;

    // Update the leave status
    leave.status = status;
    await leave.save();

    // Send notification to HR if status changed to Approved or Rejected
    if ((status === 'Approved' || status === 'Rejected') && previousStatus !== status) {
      try {
        const employeeWithDept = await User.findById(leave.user._id).populate('department');
        
        if (employeeWithDept.department && employeeWithDept.department.hr) {
          const hrUser = await User.findById(employeeWithDept.department.hr);
          
          // Get HR user info
          const hrUserWhoApproved = await User.findById(decoded.id);
          
          if (hrUser && hrUser.email) {
            // Calculate leave statistics
            const leaveStats = await calculateLeaveStats(leave.user._id);
            
            // Reload leave with updated data
            const updatedLeave = await Leave.findById(leave._id).populate('user');
            
            await sendHRNotificationEmail({
              hrEmail: hrUser.email,
              hrName: hrUser.name,
              leave: updatedLeave,
              employee: employeeWithDept,
              leaveStats: leaveStats,
              eventType: status === 'Approved' ? 'approved' : 'rejected',
              managerName: hrUserWhoApproved?.name || 'HR'
            });
            
            console.log(`✅ HR notification sent to ${hrUser.email} (${status} - Dashboard)`);
          }
        }
      } catch (hrEmailError) {
        console.error('Failed to send HR notification:', hrEmailError);
        // Don't fail the request if HR email fails
      }

      // Send notification to reporting managers if status changed
      try {
        const employeeWithDept = await User.findById(leave.user._id).populate('department');
        
        if (employeeWithDept.department && employeeWithDept.department.reportingManagers && 
            Array.isArray(employeeWithDept.department.reportingManagers) && 
            employeeWithDept.department.reportingManagers.length > 0) {
          
          // Get the user who approved/rejected
          const approverUser = await User.findById(decoded.id);
          
          // Calculate leave statistics
          const leaveStats = await calculateLeaveStats(leave.user._id);
          
          // Reload leave with updated data
          const updatedLeave = await Leave.findById(leave._id).populate('user');
          
          // Send notification to each reporting manager
          for (const managerId of employeeWithDept.department.reportingManagers) {
            const managerUser = await User.findById(managerId);
            
            if (managerUser && managerUser.email && managerUser._id.toString() !== decoded.id) {
              await sendHRNotificationEmail({
                hrEmail: managerUser.email,
                hrName: managerUser.name,
                leave: updatedLeave,
                employee: employeeWithDept,
                leaveStats: leaveStats,
                eventType: status === 'Approved' ? 'approved' : 'rejected',
                managerName: approverUser?.name || 'Manager'
              });
              
              console.log(`✅ Reporting Manager notification sent to ${managerUser.email} (${status} - Dashboard)`);
            }
          }
          }
        }
      } catch (managerEmailError) {
        console.error('Failed to send Reporting Manager notification:', managerEmailError);
        // Don't fail the request if manager email fails
      }

      // Send notification to employee about status change
      try {
        const employeeWithDept = await User.findById(leave.user._id).populate('department');
        const approverUser = await User.findById(decoded.id);
        
        if (employeeWithDept && employeeWithDept.email) {
          const updatedLeave = await Leave.findById(leave._id).populate('user');
          
          await sendLeaveStatusEmail({
            employeeEmail: employeeWithDept.email,
            employeeName: employeeWithDept.name,
            leave: updatedLeave,
            status: status,
            managerName: approverUser?.name || 'Admin',
            approverType: decoded.role
          });
          
          console.log(`✅ Employee notification sent to ${employeeWithDept.email} (${status})`);
        }
      } catch (employeeEmailError) {
        console.error('Failed to send employee notification:', employeeEmailError);
        // Don't fail the request if employee email fails
      }

      // Send notification to all admin users about status change
      try {
        const adminUsers = await User.find({ role: 'Admin' }).lean();
        const employeeWithDept = await User.findById(leave.user._id).populate('department');
        const approverUser = await User.findById(decoded.id);
        
        if (adminUsers && adminUsers.length > 0) {
          const updatedLeave = await Leave.findById(leave._id).populate('user');
          
          for (const admin of adminUsers) {
            try {
              await sendHRNotificationEmail({
                hrEmail: admin.email,
                hrName: admin.name,
                leave: updatedLeave,
                employee: employeeWithDept,
                leaveStats: await calculateLeaveStats(leave.user._id),
                eventType: status === 'Approved' ? 'approved' : 'rejected',
                managerName: approverUser?.name || 'System'
              });
              
              console.log(`✅ Admin notification sent to ${admin.email} (${status})`);
            } catch (error) {
              console.error(`Failed to send admin notification to ${admin.email}:`, error);
            }
          }
        }
      } catch (adminEmailError) {
        console.error('Failed to send admin notifications:', adminEmailError);
        // Don't fail the request if admin email fails
      }
    }

    return NextResponse.json({ 
      message: `Leave ${status.toLowerCase()} successfully`,
      leave 
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PATCH is an alias to PUT
export async function PATCH(req, { params }) {
  return PUT(req, { params });
}

// DELETE - Delete leave request (Employee only, own requests)
export async function DELETE(req, { params }) {
  await connectDB();
  const decoded = authenticateRequest(req);
  if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const leave = await Leave.findById(id);
    
    if (!leave) {
      return NextResponse.json({ message: 'Leave request not found' }, { status: 404 });
    }

    // Only allow deletion if it's the user's own leave and status is still Pending
    if (leave.user.toString() !== decoded.id) {
      return NextResponse.json({ message: 'You can only delete your own leave requests' }, { status: 403 });
    }

    if (leave.status !== 'Pending') {
      return NextResponse.json({ message: 'Cannot delete a leave request that has been approved or rejected' }, { status: 400 });
    }

    await Leave.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Leave request deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
