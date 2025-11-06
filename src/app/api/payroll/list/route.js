import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Payroll } from '@/models/Payroll';

// GET all payroll records (HR/Admin only)
export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'Admin' && user.role !== 'HR') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    
    // Build query
    const query = {};
    if (month) query.month = month;
    if (status) query.status = status;
    if (userId) query.user = userId;
    
    const payrolls = await Payroll.find(query)
      .populate('user', 'name email department role')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ payrolls });
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
