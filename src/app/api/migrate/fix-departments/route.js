import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { authenticateRequest } from '@/lib/auth';
import mongoose from 'mongoose';

async function runMigration(user) {
  await connectDB();

  try {
    console.log('Starting migration...');
    
    // Update all users with string department to ObjectId
    const result1 = await User.updateMany(
      { 
        department: { $type: 'string', $ne: '' }
      },
      [{
        $set: {
          department: { $toObjectId: '$department' }
        }
      }]
    );
    
    // Update all users with empty string department to null
    const result2 = await User.updateMany(
      { department: '' },
      { $set: { department: null } }
    );

    console.log(`Migration completed. String to ObjectId: ${result1.modifiedCount}, Empty to null: ${result2.modifiedCount}`);

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully!`,
      stringToObjectId: result1.modifiedCount,
      emptyToNull: result2.modifiedCount,
      totalUpdated: result1.modifiedCount + result2.modifiedCount
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET(req) {
  const user = authenticateRequest(req);
  return runMigration(user);
}

export async function POST(req) {
  const user = authenticateRequest(req);
  return runMigration(user);
}
