import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TrendsClient from './TrendsClient';

export const revalidate = 300;

export default async function TrendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('id').eq('auth_user_id', user.id).maybeSingle();
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

  const historyByPlayer: Record<string, Array<{ date: string; value: number }>> = {};
  for (const row of history ?? []) {
    if (!historyByPlayer[row.player_id]) historyByPlayer[row.player_id] = [];
    historyByPlayer[row.player_id].push({ date: row.revision_date, value: Number(row.index_value) });
  }

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
        <TrendsClient players={playerData} />
      </div>
    </div>
  );
}
