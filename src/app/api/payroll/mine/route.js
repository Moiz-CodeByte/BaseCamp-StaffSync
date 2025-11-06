import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Payroll } from '@/models/Payroll';

export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const payslips = await Payroll.find({ user: user.id })
    .sort({ createdAt: -1 })
    .select('month basic_salary allowance bonus deductions leave_deduction total_salary status payment_date payslip_url createdAt');
  
  return NextResponse.json({ payslips });
}
