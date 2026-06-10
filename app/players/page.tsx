import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PlayersGrid from '@/components/PlayersGrid';
import type { Player } from '@/lib/types';

export const revalidate = 300;

export default async function PlayersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('id').eq('auth_user_id', user.id).maybeSingle();
  const db = me ? supabase : createServiceClient();

  const { data: players } = await db
    .from('players').select('*').order('team').order('handicap_index') as { data: Player[] | null };

  const murray = (players ?? []).filter(p => p.team === 'murray');
  const harris = (players ?? []).filter(p => p.team === 'harris');

  const murrayIdx = murray.reduce((s, p) => s + (p.handicap_index ?? 0), 0);
  const harrisIdx = harris.reduce((s, p) => s + (p.handicap_index ?? 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>Players</h1>
          <p className="sub">12 men · 2 teams · 6 rounds</p>
        </div>
      </div>

      <PlayersGrid
        murray={murray}
        harris={harris}
        murrayIdx={murrayIdx}
        harrisIdx={harrisIdx}
      />
    </div>
  );
}
