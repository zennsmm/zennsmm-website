import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Provider test disabled.' }, { status: 410 });
}
