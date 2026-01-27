import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

// Debug endpoint to check if an email exists as a user
export async function GET(req) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Email parameter required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('-password').lean();

    if (user) {
      return NextResponse.json({
        found: true,
        message: 'User exists in database',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      });
    } else {
      return NextResponse.json({
        found: false,
        message: 'User not found in database',
        email: email
      });
    }
  } catch (err) {
    return NextResponse.json({ 
      message: 'Error checking user', 
      error: err.message 
    }, { status: 500 });
  }
}
