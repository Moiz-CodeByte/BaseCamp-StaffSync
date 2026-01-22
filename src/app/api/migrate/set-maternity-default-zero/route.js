import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function POST() {
  try {
    await connectDB();

    // Update all users to set maternity_leave_limit to 0
    const result = await User.updateMany(
      {}, // Empty filter to match all documents
      { $set: { maternity_leave_limit: 0 } }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} user records. Maternity leave limit set to 0 for all existing users.`,
      details: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update maternity leave limits',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
