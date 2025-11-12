import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';
import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT/PATCH - Update leave status (Admin/HR only)
export async function PUT(req, { params }) {
  await connectDB();
  const decoded = authenticateRequest(req);
  if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  // Only Admin and HR can approve/reject leaves
  if (!['Admin', 'HR'].includes(decoded.role)) {
    return NextResponse.json({ message: 'Forbidden - Only Admin and HR can update leave status' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // Validate status
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status. Must be Approved, Rejected, or Pending' }, { status: 400 });
    }

    const leave = await Leave.findById(id);
    
    if (!leave) {
      return NextResponse.json({ message: 'Leave request not found' }, { status: 404 });
    }

    // Update the leave status
    leave.status = status;
    await leave.save();

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
