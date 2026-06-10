import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TrendsClient from './TrendsClient';

export const revalidate = 300;

export default async function TrendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('id, is_admin').eq('auth_user_id', user.id).maybeSingle();
  const db = me ? supabase : createServiceClient();

  const { data: players } = await db
    .from('players')
    .select('id, name, first_name, team, handicap_index')
    .order('team')
    .order('name');

  const { data: history } = await db
    .from('player_indexes')
    .select('player_id, revision_date, index_value')
    .order('revision_date', { ascending: true });

  const { data: recentRoundsRaw } = await db
    .from('ghin_recent_rounds')
    .select('player_id, date_played, course_name, gross_score, differential')
    .order('date_played', { ascending: false });

  const historyByPlayer: Record<string, Array<{ date: string; value: number }>> = {};
  for (const row of history ?? []) {
    if (!historyByPlayer[row.player_id]) historyByPlayer[row.player_id] = [];
    historyByPlayer[row.player_id].push({ date: row.revision_date, value: Number(row.index_value) });
  }

  const playerNameMap: Record<string, string> = {};
  const playerIndexMap: Record<string, number | null> = {};
  for (const p of players ?? []) {
    playerNameMap[p.id] = (p.name as string).split(' ').pop() ?? (p.name as string);
    playerIndexMap[p.id] = p.handicap_index as number | null;
  }

  // Last 3 rounds per player, exclude Mitchell
  const roundsPerPlayer: Record<string, typeof recentRoundsRaw> = {};
  for (const r of recentRoundsRaw ?? []) {
    const lastName = playerNameMap[r.player_id] ?? '';
    if (lastName === 'Mitchell') continue;
    if (!roundsPerPlayer[r.player_id]) roundsPerPlayer[r.player_id] = [];
    if (roundsPerPlayer[r.player_id]!.length < 3) {
      roundsPerPlayer[r.player_id]!.push(r);
    }
  }

  const recentRounds = Object.values(roundsPerPlayer)
    .flat()
    .sort((a, b) => (b?.date_played ?? '').localeCompare(a?.date_played ?? ''))
    .map(r => {
      const idx = playerIndexMap[r!.player_id];
      const diff = r!.differential as number | null;
      const indexDelta = idx != null && diff != null
        ? Math.round((idx - diff) * 10) / 10
        : null;
      return {
        playerName: playerNameMap[r!.player_id] ?? 'Unknown',
        datePlayed: r!.date_played as string,
        courseName: r!.course_name as string,
        grossScore: r!.gross_score as number,
        indexDelta,
      };
    });

  const playerData = (players ?? []).map((p, i) => ({
    id: p.id,
    name: p.name as string,
    firstName: (p.first_name ?? p.name.split(' ')[0]) as string,
    team: p.team as 'murray' | 'harris',
    currentIndex: p.handicap_index as number | null,
    colorIndex: i,
    history: historyByPlayer[p.id] ?? [],
  }));

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100dvh' }}>
      <div className="wrap" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-8)' }}>
        <TrendsClient players={playerData} recentRounds={recentRounds} isAdmin={!!me?.is_admin} />
      </div>
    </div>
  );
}
