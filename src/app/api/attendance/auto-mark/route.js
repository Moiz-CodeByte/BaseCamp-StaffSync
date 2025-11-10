import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { autoMarkAbsentForAllEmployees } from '@/lib/attendance-utils';

/**
 * POST endpoint to manually trigger auto-marking of absent records for all employees
 * Can be called by Admin/HR or set up as a cron job
 */
export async function POST(req) {
  const user = authenticateRequest(req);
  
  // Only Admin can trigger this
  if (!user || user.role !== 'Admin') {
    return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  await connectDB();

  const result = await autoMarkAbsentForAllEmployees();

  if (result.success) {
    return NextResponse.json({
      message: 'Successfully auto-marked absent records',
      ...result
    });
  } else {
    return NextResponse.json({
      message: 'Failed to auto-mark absent records',
      error: result.error
    }, { status: 500 });
  }
}
