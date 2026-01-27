import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Feedback } from '@/models/Feedback';

// Get all feedback (Admin only)
export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'Admin' && user.role !== 'HR') {
    return NextResponse.json({ message: 'Forbidden: Admin/HR access required' }, { status: 403 });
  }
  
  await connectDB();

  try {
    const feedbacks = await Feedback.find()
      .populate('user', 'name email role department')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    return NextResponse.json({ 
      message: error.message 
    }, { status: 500 });
  }
}

// Update feedback status (Admin only)
export async function PATCH(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'Admin') {
    return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
  }
  
  await connectDB();

  try {
    const { feedbackId, status, adminNotes } = await req.json();

    if (!feedbackId) {
      return NextResponse.json({ 
        message: 'Feedback ID is required' 
      }, { status: 400 });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    
    if (status === 'Resolved' || status === 'Closed') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = user.id;
    }

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      updateData,
      { new: true }
    )
      .populate('user', 'name email role')
      .populate('resolvedBy', 'name email')
      .lean();

    if (!feedback) {
      return NextResponse.json({ 
        message: 'Feedback not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Feedback updated successfully',
      feedback 
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ 
      message: error.message 
    }, { status: 500 });
  }
}
