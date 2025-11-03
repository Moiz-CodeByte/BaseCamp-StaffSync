import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Payroll } from '@/models/Payroll';
import { User } from '@/models/User';

export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'Admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();

  const { month, year, defaultBasic = 1000 } = await req.json();
  const employees = await User.find({ role: { $in: ['Employee', 'HR', 'Admin'] } }, '_id');
  const results = [];
  for (const emp of employees) {
    const payload = {
      user: emp._id,
      month,
      year,
      basic: defaultBasic,
      allowances: 0,
      deductions: 0,
      net: defaultBasic,
    };
    try {
      const slip = await Payroll.findOneAndUpdate(
        { user: emp._id, month, year },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push({ user: String(emp._id), ok: true });
    } catch (e) {
      results.push({ user: String(emp._id), ok: false, error: e.message });
    }
  }
  return NextResponse.json({ results });
}
