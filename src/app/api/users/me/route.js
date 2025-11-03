import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ user });
}
