/**
 * POST /api/ghin/refresh
 * Refreshes handicap indexes + recent rounds for all players with a GHIN number.
 * Protected by CRON_SECRET bearer token (same pattern as oominv).
 * Can also be triggered from the admin UI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginGhin, fetchIndexByGhin, fetchRecentGhinRounds } from '@/lib/ghin';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  const hasCronAuth = secret && auth === `Bearer ${secret}`;

  if (!hasCronAuth) {
    // Allow authenticated admin users to trigger from the UI
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { data: me } = await supabase
      .from('players').select('is_admin').eq('auth_user_id', user.id).maybeSingle();
    if (!me?.is_admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  try {
    const supabase = createServiceClient();

    // Fetch all players that have a GHIN number
    const { data: players } = await supabase
      .from('players')
      .select('id, name, ghin')
      .not('ghin', 'is', null)
      .not('ghin', 'eq', 'TBD');

    if (!players?.length) {
      return NextResponse.json({ ok: true, message: 'No players with GHIN numbers', startedAt });
    }

    const token = await loginGhin();
    const today = new Date().toISOString().split('T')[0];

    const results: Array<{ name: string; ghin: string; index: number | null; rounds: number }> = [];
    const errors: string[] = [];

    for (const player of players) {
      // Fetch current index
      const idx = await fetchIndexByGhin(token, player.ghin!).catch((e) => {
        errors.push(`${player.name}: ${(e as Error).message}`);
        return null;
      });

      // Discard sentinel / out-of-range values (valid USGA range: -10 to 54)
      const validIdx = idx !== null && idx >= -10 && idx <= 54 ? idx : null;

      if (validIdx !== null) {
        // Update handicap_index on players row
        await supabase.from('players')
          .update({ handicap_index: validIdx })
          .eq('id', player.id);

        // Snapshot into player_indexes
        await supabase.from('player_indexes').upsert(
          { player_id: player.id, revision_date: today, index_value: validIdx, source: 'ghin' },
          { onConflict: 'player_id,revision_date', ignoreDuplicates: false },
        );
      }

      // Fetch recent rounds
      const { rounds: recentRounds } = await fetchRecentGhinRounds(token, player.ghin!, 20)
        .catch(() => ({ rounds: [], rawResponse: null }));

      for (const round of recentRounds) {
        await supabase.from('ghin_recent_rounds').upsert(
          {
            player_id: player.id,
            date_played: round.date_played,
            course_name: round.course_name,
            course_rating: round.course_rating,
            slope_rating: round.slope_rating,
            gross_score: round.gross_score,
            adjusted_gross_score: round.adjusted_gross_score,
            differential: round.differential,
            raw: round.raw,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: 'player_id,date_played,course_name', ignoreDuplicates: false },
        );
      }

      // Keep only 20 most recent
      const { data: allRows } = await supabase
        .from('ghin_recent_rounds')
        .select('id, date_played')
        .eq('player_id', player.id)
        .order('date_played', { ascending: false });
      if (allRows && allRows.length > 20) {
        const toDelete = allRows.slice(20).map(r => r.id);
        await supabase.from('ghin_recent_rounds').delete().in('id', toDelete);
      }

      results.push({ name: player.name, ghin: player.ghin!, index: idx, rounds: recentRounds.length });
    }

    return NextResponse.json({ ok: true, startedAt, finishedAt: new Date().toISOString(), results, errors });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, startedAt }, { status: 500 });
  }
}
