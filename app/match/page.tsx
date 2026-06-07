import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Match, Round, Course, Pairing, Player } from '@/lib/types';

export const revalidate = 30;

export default async function MatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('id, is_admin').eq('auth_user_id', user.id).maybeSingle();
  const isAdmin = !!me?.is_admin;

  const { data: rounds } = await supabase
    .from('rounds').select('*, courses(*)').order('round_no') as { data: (Round & { courses: Course })[] | null };

  const { data: allMatches } = await supabase
    .from('matches').select('*') as { data: Match[] | null };

  const { data: allPairings } = await supabase
    .from('pairings')
    .select('*, player_a_data:players!player_a(id,name,first_name), player_b_data:players!player_b(id,name,first_name)') as { data: any[] | null };

  const { data: settings } = await supabase.from('trip_settings').select('*').eq('id', 1).maybeSingle();

  const murrayTotal = (allMatches ?? []).filter(m => m.status === 'final').reduce((s, m) => s + Number(m.murray_points), 0);
  const harrisTotal = (allMatches ?? []).filter(m => m.status === 'final').reduce((s, m) => s + Number(m.harris_points), 0);
  const totalPts = murrayTotal + harrisTotal || 1;

  function getPairings(roundId: string, team: 'murray' | 'harris') {
    return (allPairings ?? []).filter(p => p.round_id === roundId && p.team === team).sort((a, b) => a.slot - b.slot);
  }

  function getMatches(roundId: string) {
    return (allMatches ?? []).filter(m => m.round_id === roundId);
  }

  function pairingNames(p: any) {
    return `${p.player_a_data?.name?.split(' ').pop() ?? '?'} & ${p.player_b_data?.name?.split(' ').pop() ?? '?'}`;
  }

  const { data: aces } = await supabase
    .from('aces').select('*, players(name), rounds(round_no, courses(name))') as { data: any[] | null };

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

        {/* Round-by-round */}
        {(rounds ?? []).map(round => {
          const roundMatches = getMatches(round.id);
          const murrayPairings = getPairings(round.id, 'murray');
          const harrisPairings = getPairings(round.id, 'harris');
          const roundMurrayPts = roundMatches.filter(m => m.status === 'final').reduce((s, m) => s + Number(m.murray_points), 0);
          const roundHarrisPts = roundMatches.filter(m => m.status === 'final').reduce((s, m) => s + Number(m.harris_points), 0);

          return (
            <div key={round.id} className="card" style={{ borderLeft: `4px solid ${round.courses?.rail_color ?? 'var(--gilt)'}` }}>
              <div className="row-between" style={{ marginBottom: 'var(--s-3)' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
                    Round {round.round_no} — {round.courses?.name}
                  </div>
                  <div className="small muted">
                    {new Date(round.play_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {round.tee_time}
                    {round.is_altshot && <span className="chip chip-gilt" style={{ marginLeft: 6 }}>Alt Shot</span>}
                  </div>
                </div>
                {(roundMurrayPts > 0 || roundHarrisPts > 0) && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>{roundMurrayPts}</span>
                    <span className="muted"> – </span>
                    <span style={{ color: 'var(--rail-portrush)', fontWeight: 700 }}>{roundHarrisPts}</span>
                  </div>
                )}
              </div>

              {/* Pairings grid */}
              {murrayPairings.length > 0 && (
                <div style={{ marginBottom: 'var(--s-3)' }}>
                  <p className="section-label" style={{ marginBottom: 'var(--s-2)' }}>Pairings</p>
                  <div className="stack-sm">
                    {murrayPairings.map((mp, i) => {
                      const hp = harrisPairings[i];
                      const match = roundMatches.find(m =>
                        m.murray_pairing_id === mp.id && m.harris_pairing_id === hp?.id
                      );
                      return (
                        <div key={mp.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--s-2)', alignItems: 'center', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--green)', fontWeight: 500 }}>{pairingNames(mp)}</span>
                          <span className={`chip ${match?.status === 'final' ? (Number(match.murray_points) > Number(match.harris_points) ? 'chip-success' : Number(match.harris_points) > Number(match.murray_points) ? 'chip-danger' : 'chip-gilt') : 'chip-neutral'}`} style={{ fontSize: '0.7rem' }}>
                            {match?.status === 'final'
                              ? `${match.murray_points}–${match.harris_points}`
                              : match?.status === 'live' ? 'LIVE' : 'vs'}
                          </span>
                          <span style={{ color: 'var(--rail-portrush)', fontWeight: 500, textAlign: 'right' }}>{hp ? pairingNames(hp) : '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Link href={`/match/${round.id}`} className="btn btn-primary btn-block btn-sm">
                {roundMatches.some(m => m.status === 'live') ? '⚡ Live Scoring' :
                  roundMatches.some(m => m.status === 'final') ? 'View Results' : 'Score This Round'}
              </Link>
            </div>
          );
        })}

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

        {/* Rules link */}
        {settings?.rules_md && (
          <div className="card">
            <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Rules</p>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.6 }}>
              {settings.rules_md.replace(/^#+\s*/gm, '').replace(/\*\*/g, '')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
