import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Flight, Player } from '@/lib/types';
import FlightsClient from './FlightsClient';

export const revalidate = 60;

export default async function FlightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('id, is_admin').eq('auth_user_id', user.id).maybeSingle() as { data: Pick<Player, 'id' | 'is_admin'> | null };

  const { data: flights } = await supabase
    .from('flights')
    .select('*, players(id, name, first_name, team)')
    .order('arrive_at', { nullsFirst: false }) as { data: (Flight & { players: Player })[] | null };

  const { data: players } = await supabase
    .from('players').select('id, name, first_name, team').order('team').order('name') as { data: Pick<Player, 'id' | 'name' | 'first_name' | 'team'>[] | null };

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>Flights</h1>
          <p className="sub">Arrival &amp; departure info for all 12</p>
        </div>
      </div>
      <FlightsClient
        flights={flights ?? []}
        players={players ?? []}
        myPlayerId={me?.id ?? null}
        isAdmin={!!me?.is_admin}
      />
    </div>
  );
}
