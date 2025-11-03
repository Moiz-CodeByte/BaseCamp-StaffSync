import { NextResponse } from 'next/server';

// Deprecated: This route has been removed. Returning 410 Gone.
export async function GET() {
  return NextResponse.json({ message: 'This endpoint has been removed' }, { status: 410 });
}
