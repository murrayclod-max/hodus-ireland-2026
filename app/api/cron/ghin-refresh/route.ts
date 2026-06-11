import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Reuse the same refresh logic as POST /api/ghin/refresh
  const res = await fetch(new URL('/api/ghin/refresh', req.url).toString(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
