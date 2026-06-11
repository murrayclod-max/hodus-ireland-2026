import { NextRequest, NextResponse } from 'next/server';
import { generateLassOfTheDay } from '@/lib/lass-generator';

// Must run as Node.js serverless — image gen + upload routinely takes 20-40s
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify the request comes from Vercel Cron (or the admin trigger)
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await generateLassOfTheDay();

  if (!result.success) {
    console.error('[lass-of-the-day cron] failed:', result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  console.log(`[lass-of-the-day cron] day ${result.dayNumber} published: ${result.imageUrl}`);
  return NextResponse.json({ ok: true, dayNumber: result.dayNumber, imageUrl: result.imageUrl });
}
