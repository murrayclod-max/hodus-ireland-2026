import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Match, Round, Course, Pairing, Player, GameFormat } from '@/lib/types';
import MatchRoundsClient from './MatchRoundsClient';
import GameFormatsEditor from './GameFormatsEditor';

export const revalidate = 30;

export default async function MatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('id, is_admin').eq('auth_user_id', user.id).maybeSingle();
  const isAdmin = !!me?.is_admin;

  const [
    { data: rounds },
    { data: allMatches },
    { data: allPairings },
    { data: allPlayers },
    { data: gameFormats },
    { data: settings },
    { data: aces },
  ] = await Promise.all([
    supabase.from('rounds').select('*, courses(*)').order('round_no') as unknown as Promise<{ data: (Round & { courses: Course })[] | null }>,
    supabase.from('matches').select('*') as unknown as Promise<{ data: Match[] | null }>,
    supabase.from('pairings').select('*, player_a_data:players!player_a(id,name,first_name,handicap_index,team), player_b_data:players!player_b(id,name,first_name,handicap_index,team)') as unknown as Promise<{ data: any[] | null }>,
    supabase.from('players').select('id,name,first_name,handicap_index,team,is_captain,is_admin,auth_user_id,avatar_url,bio,home_club,nickname,phone,ghin,fun_facts').order('team').order('name') as unknown as Promise<{ data: Player[] | null }>,
    supabase.from('game_formats').select('*').order('sort') as unknown as Promise<{ data: GameFormat[] | null }>,
    supabase.from('trip_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('aces').select('*, players(name), rounds(round_no, courses(name))') as unknown as Promise<{ data: any[] | null }>,
  ]);

  const murrayTotal = (allMatches ?? []).filter(m => m.status === 'final').reduce((s, m) => s + Number(m.murray_points), 0);
  const harrisTotal = (allMatches ?? []).filter(m => m.status === 'final').reduce((s, m) => s + Number(m.harris_points), 0);
  const totalPts = murrayTotal + harrisTotal || 1;

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>Match Play</h1>
          <p className="sub">6 rounds · Fourball + Alternate Shot</p>
        </div>
      </div>

      <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>

        {/* Team standings */}
        <div className="card">
          <p className="section-label" style={{ marginBottom: 'var(--s-4)' }}>Team Standings</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)' }}>
            <div style={{ textAlign: 'center', padding: 'var(--s-4)', background: 'rgba(14,59,46,.06)', borderRadius: 'var(--r-lg)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2.5rem', color: 'var(--green)' }}>{murrayTotal}</div>
              <div style={{ fontWeight: 600 }}>Team Murray</div>
              <div className="small muted">Dan Murray, Capt.</div>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--s-4)', background: 'rgba(22,58,95,.06)', borderRadius: 'var(--r-lg)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2.5rem', color: 'var(--rail-portrush)' }}>{harrisTotal}</div>
              <div style={{ fontWeight: 600 }}>Team Harris</div>
              <div className="small muted">Dave Harris, Capt.</div>
            </div>
          </div>
          {(murrayTotal > 0 || harrisTotal > 0) && (
            <div style={{ height: 8, borderRadius: 'var(--r-pill)', background: 'var(--cream-dark)', marginTop: 'var(--s-4)', overflow: 'hidden', display: 'flex' }}>
              <div style={{ height: '100%', width: `${(murrayTotal / totalPts) * 100}%`, background: 'var(--green)', borderRadius: 'var(--r-pill)' }} />
            </div>
          )}
        </div>

        {/* Round cards — client component handles both read-only and admin setup */}
        <MatchRoundsClient
          rounds={(rounds ?? []) as any}
          allMatches={allMatches ?? []}
          allPairings={allPairings ?? []}
          allPlayers={allPlayers ?? []}
          gameFormats={gameFormats ?? []}
          isAdmin={isAdmin}
        />

        {/* Ace pool */}
        <div className="card" style={{ borderColor: 'var(--gilt)', background: 'rgba(201,162,75,.05)' }}>
          <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>🏆 Ace Pool</p>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--gilt)' }}>
            ${((settings?.ace_pool_per_man ?? 100) * 12).toLocaleString()} waiting
          </div>
          <p className="small muted" style={{ marginTop: 4 }}>${settings?.ace_pool_per_man ?? 100}/man · 12 players · paid in full to any hole-in-one</p>
          {(aces ?? []).length > 0 ? (
            <div className="stack-sm" style={{ marginTop: 'var(--s-3)' }}>
              {(aces ?? []).map((a: any) => (
                <div key={a.id} className="chip chip-gilt">
                  🎯 {a.players?.name} — Hole {a.hole}, Round {a.rounds?.round_no} ({a.rounds?.courses?.name})
                </div>
              ))}
            </div>
          ) : (
            <p className="small muted italic" style={{ marginTop: 'var(--s-2)' }}>No aces yet. That pool is waiting.</p>
          )}
        </div>

        {/* Rules */}
        {settings?.rules_md && (
          <div className="card">
            <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Rules</p>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.6 }}>
              {settings.rules_md.replace(/^#+\s*/gm, '').replace(/\*\*/g, '')}
            </div>
          </div>
        )}

        {/* Admin: format handicap % editor */}
        {isAdmin && (gameFormats ?? []).length > 0 && (
          <GameFormatsEditor formats={gameFormats ?? []} />
        )}
      </div>
    </div>
  );
}
