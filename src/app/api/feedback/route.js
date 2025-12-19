import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Feedback } from '@/models/Feedback';

// Submit feedback
export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  
  await connectDB();

  try {
    const { type, subject, description, priority } = await req.json();

    if (!type || !subject || !description) {
      return NextResponse.json({ 
        message: 'Type, subject, and description are required' 
      }, { status: 400 });
    }

    const feedback = await Feedback.create({
      user: user.id,
      type,
      subject,
      description,
      priority: priority || 'Medium',
      status: 'Open'
    });

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate('user', 'name email role')
      .lean();

    return NextResponse.json({ 
      message: 'Feedback submitted successfully',
      feedback: populatedFeedback 
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ 
      message: error.message 
    }, { status: 500 });
  }
}

// Get user's own feedback
export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  
  await connectDB();

  try {
    const feedbacks = await Feedback.find({ user: user.id })
      .populate('user', 'name email role')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ 
      message: error.message 
    }, { status: 500 });
  }
}
