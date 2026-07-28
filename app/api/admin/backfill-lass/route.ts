import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateLassOfTheDay } from '@/lib/lass-generator';
import { LASS_QUEUE } from '@/lib/lass-queue';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // Accept either a logged-in admin session or the CRON_SECRET bearer token
  const auth = req.headers.get('authorization') ?? '';
  const isCron = auth === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: player } = await supabase
      .from('players').select('is_admin').eq('auth_user_id', user.id).maybeSingle();
    if (!player?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { days?: number[]; count?: number };

  let daysToGenerate: number[];

  if (body.days && Array.isArray(body.days)) {
    // Specific list of day numbers
    daysToGenerate = body.days;
  } else {
    // Auto-detect: find all days with specs that are missing or failed
    const { data: existing } = await supabase
      .from('lass_of_the_day')
      .select('day_number, status');

    const publishedSet = new Set(
      (existing ?? [])
        .filter((r: { day_number: number; status: string }) => r.status === 'published')
        .map((r: { day_number: number }) => r.day_number)
    );

    const allSpecDays = LASS_QUEUE.map(s => s.day_number);
    const missing = allSpecDays.filter(d => !publishedSet.has(d));
    const limit = body.count ?? 5;
    daysToGenerate = missing.slice(0, limit);
  }

  if (daysToGenerate.length === 0) {
    return NextResponse.json({ ok: true, message: 'Nothing to backfill', results: [] });
  }

  const results: Array<{ day: number; ok: boolean; imageUrl?: string; error?: string }> = [];

  for (const day of daysToGenerate) {
    const r = await generateLassOfTheDay(day);
    results.push({ day, ok: r.success, imageUrl: r.imageUrl, error: r.error });
  }

  const succeeded = results.filter(r => r.ok).length;
  return NextResponse.json({ ok: true, generated: succeeded, total: daysToGenerate.length, results });
}
