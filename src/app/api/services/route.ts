import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Endpoint disabled. System is in manual mode.' }, { status: 410 });
}
