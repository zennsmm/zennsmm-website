import { NextResponse } from 'next/server';
import { SMM_API_URL, SMM_API_KEY } from '@/lib/api-client';

export async function GET() {
  try {
    console.log('[API] Fetching services from SMMZIO...');
    const response = await fetch(`${SMM_API_URL}?key=${SMM_API_KEY}&action=services`);
    const data = await response.json();
    
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[API Error] Services fetch failed:', err);
    return NextResponse.json({ error: 'Failed to connect to SMM provider' }, { status: 500 });
  }
}
