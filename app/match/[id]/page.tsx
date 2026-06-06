import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import type { Round, Course, Match, Pairing, Player } from '@/lib/types';
import MatchScoring from './MatchScoring';

export const revalidate = 0;

export default async function RoundScoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roundId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('id, is_admin').eq('auth_user_id', user.id).maybeSingle();

  const { data: round } = await supabase
    .from('rounds').select('*, courses(*)').eq('id', roundId).maybeSingle() as { data: (Round & { courses: Course }) | null };
  if (!round) notFound();

  const { data: matches } = await supabase
    .from('matches').select('*').eq('round_id', roundId) as { data: Match[] | null };

  const { data: pairings } = await supabase
    .from('pairings')
    .select('*, player_a_data:players!player_a(id,name,first_name), player_b_data:players!player_b(id,name,first_name)')
    .eq('round_id', roundId) as { data: any[] | null };

  const matchIds = (matches ?? []).map(m => m.id);
  const { data: holeResults } = matchIds.length
    ? await supabase.from('hole_results').select('*').in('match_id', matchIds)
    : { data: [] as any[] };

  const { data: settings } = await supabase.from('trip_settings').select('*').eq('id', 1).maybeSingle();

  return (
    <div>
      <div className="page-header" style={{ background: round.courses?.rail_color ?? 'var(--green)' }}>
        <div className="wrap">
          <h1>Round {round.round_no}</h1>
          <p className="sub">{round.courses?.name} · {round.tee_time}</p>
        </div>
      </div>
      <MatchScoring
        round={round}
        matches={matches ?? []}
        pairings={pairings ?? []}
        holeResults={holeResults ?? []}
        myPlayerId={me?.id ?? null}
        isAdmin={!!me?.is_admin}
        settings={settings}
      />
    </div>
  );
}
