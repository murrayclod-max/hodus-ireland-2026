/**
 * POST /api/ghin/backfill?months=24
 * Backfills full handicap index history from GHIN into player_indexes.
 * Run once; safe to re-run (upserts are idempotent).
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginGhin, fetchHandicapHistory } from '@/lib/ghin';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const months = Math.max(1, Math.min(36, Number(url.searchParams.get('months') ?? '24')));

  const end = new Date();
  const begin = new Date();
  begin.setMonth(begin.getMonth() - months);
  const dateBegin = begin.toISOString().split('T')[0];
  const dateEnd = end.toISOString().split('T')[0];

  const startedAt = new Date().toISOString();
  try {
    const supabase = createServiceClient();

    const { data: players } = await supabase
      .from('players')
      .select('id, name, ghin')
      .not('ghin', 'is', null)
      .not('ghin', 'eq', 'TBD');

    if (!players?.length) {
      return NextResponse.json({ ok: true, message: 'No players with GHIN numbers' });
    }

    const token = await loginGhin();

    const results: Array<{ name: string; ghin: string; revisions: number }> = [];
    const errors: string[] = [];

    for (const player of players) {
      const revisions = await fetchHandicapHistory(token, player.ghin!, dateBegin, dateEnd, 500)
        .catch((e) => {
          errors.push(`${player.name}: ${(e as Error).message}`);
          return [];
        });

      if (!revisions.length) continue;

      // Deduplicate by revision_date (keep last value per date — GHIN can return multiple)
      // Discard sentinel / out-of-range values (valid USGA range: -10 to 54)
      const byDate = new Map<string, number>();
      for (const r of revisions) {
        if (r.indexValue >= -10 && r.indexValue <= 54) {
          byDate.set(r.revisionDate, r.indexValue);
        }
      }

      if (!byDate.size) continue;

      const rows = Array.from(byDate.entries()).map(([revision_date, index_value]) => ({
        player_id: player.id,
        revision_date,
        index_value,
        source: 'ghin',
      }));

      const { error: upsertErr } = await supabase
        .from('player_indexes')
        .upsert(rows, { onConflict: 'player_id,revision_date', ignoreDuplicates: false });

      if (upsertErr) {
        errors.push(`${player.name} upsert: ${upsertErr.message}`);
      }

      results.push({ name: player.name, ghin: player.ghin!, revisions: revisions.length });
    }

    return NextResponse.json({
      ok: true,
      startedAt,
      finishedAt: new Date().toISOString(),
      dateRange: { dateBegin, dateEnd },
      results,
      errors,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, startedAt }, { status: 500 });
  }
}
