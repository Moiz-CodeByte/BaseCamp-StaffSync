import { authenticateRequest } from '@/lib/auth';
import { Leave } from '@/models/Leave';
import { connectDB } from '@/lib/db';

export async function DELETE(req, { params }) {
  await connectDB();
  const decoded = authenticateRequest(req);
  if (!decoded) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const leave = await Leave.findById(id);
    
    if (!leave) {
      return Response.json({ message: 'Leave request not found' }, { status: 404 });
    }

    // Only allow deletion if it's the user's own leave and status is still Pending
    if (leave.user.toString() !== decoded.id) {
      return Response.json({ message: 'You can only delete your own leave requests' }, { status: 403 });
    }

    if (leave.status !== 'Pending') {
      return Response.json({ message: 'Cannot delete a leave request that has been approved or rejected' }, { status: 400 });
    }

    await Leave.findByIdAndDelete(id);
    return Response.json({ message: 'Leave request deleted successfully' }, { status: 200 });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}
