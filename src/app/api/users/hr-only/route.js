import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['HR', 'Admin'].includes(user.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ message: 'Hello HR/Admin' });
}
