import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { initials, formatDate } from '@/lib/utils';
import type { Player } from '@/lib/types';
import PlayerIndexPanel from '@/components/PlayerIndexPanel';
import GhinRecentRounds from '@/components/GhinRecentRounds';
import GhinRefreshButton from './GhinRefreshButton';

export const revalidate = 300;

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('is_admin').eq('auth_user_id', user.id).maybeSingle();
  const isAdmin = !!me?.is_admin;
  const db = me ? supabase : createServiceClient();

  const { data: player } = await db
    .from('players').select('*').eq('id', id).maybeSingle() as { data: Player | null };
  if (!player) notFound();

  // Index history for chart
  const { data: indexHistory } = await db
    .from('player_indexes')
    .select('revision_date, index_value')
    .eq('player_id', id)
    .order('revision_date', { ascending: true });

  // Recent GHIN rounds
  const { data: recentRounds } = await db
    .from('ghin_recent_rounds')
    .select('date_played, course_name, course_rating, slope_rating, gross_score, adjusted_gross_score, differential')
    .eq('player_id', id)
    .order('date_played', { ascending: false })
    .limit(20);

  // Pairings across all rounds
  const { data: pairings } = await db
    .from('pairings')
    .select('*, rounds(round_no, play_date, tee_time, is_altshot, courses(name, rail_color, slug)), player_a_data:players!player_a(id,name,first_name), player_b_data:players!player_b(id,name,first_name)')
    .or(`player_a.eq.${id},player_b.eq.${id}`)
    .order('rounds(play_date)');

  // Match record
  const { data: matches } = await db
    .from('matches')
    .select('murray_points, harris_points, murray_pairing:pairings!murray_pairing_id(player_a,player_b), harris_pairing:pairings!harris_pairing_id(player_a,player_b)')
    .eq('status', 'final') as { data: any[] | null };

  let wins = 0, halves = 0, losses = 0;
  for (const m of matches ?? []) {
    const isInMurray = m.murray_pairing && (m.murray_pairing.player_a === id || m.murray_pairing.player_b === id);
    const isInHarris = m.harris_pairing && (m.harris_pairing.player_a === id || m.harris_pairing.player_b === id);
    if (!isInMurray && !isInHarris) continue;
    const myPts = isInMurray ? Number(m.murray_points) : Number(m.harris_points);
    const theirPts = isInMurray ? Number(m.harris_points) : Number(m.murray_points);
    if (myPts > theirPts) wins++;
    else if (myPts === theirPts) halves++;
    else losses++;
  }
  const played = wins + halves + losses;

  const historyPoints = (indexHistory ?? []).map(r => ({ date: r.revision_date, value: Number(r.index_value) }));
  const funFacts = player.fun_facts as Record<string, string> | null;
  const teamColor = player.team === 'murray' ? 'var(--green)' : 'var(--rail-portrush)';
  const teamLabel = player.team === 'murray' ? 'Team Murray' : 'Team Harris';

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100dvh' }}>
      <div style={{ height: 4, background: teamColor }} />

      <div className="wrap" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-8)' }}>
        <div className="stack-lg">

          {/* ── Player board ─────────────────────────────────────────── */}
          <div className="board">
            {/* Board title */}
            <div className="board-title" style={{ paddingTop: 24, paddingBottom: 20 }}>
              <div style={{ fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--mute)', marginBottom: 4, fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>
                {teamLabel}{player.is_captain ? ' · Captain' : ''}
              </div>
              {player.name.toUpperCase()}
              {player.nickname && (
                <div style={{ fontSize: '0.78rem', letterSpacing: '0.04em', fontStyle: 'italic', color: 'var(--mute)', marginTop: 4, fontWeight: 400, textTransform: 'none' }}>
                  &ldquo;{player.nickname}&rdquo;
                </div>
              )}
            </div>

            {/* Avatar + quick stats */}
            <div style={{ display: 'flex', gap: 'var(--s-4)', alignItems: 'center', padding: 'var(--s-5) var(--s-5) 0' }}>
              <div className="avatar" style={{ width: 68, height: 68, flexShrink: 0, border: `3px solid ${teamColor}` }}>
                {player.avatar_url
                  ? <Image src={player.avatar_url} alt={player.name} width={68} height={68} />
                  : <div className="avatar-initials" style={{ fontSize: '1.2rem', color: teamColor }}>{initials(player.name)}</div>
                }
              </div>
              <div style={{ display: 'flex', gap: 'var(--s-4)', flexWrap: 'wrap' }}>
                {player.ghin && (
                  <div className="stat-block">
                    <span className="stat-label">GHIN</span>
                    <span className="stat-value" style={{ fontSize: '1rem', paddingTop: 6, color: 'var(--ink)' }}>{player.ghin}</span>
                  </div>
                )}
                {played > 0 && (
                  <div className="stat-block">
                    <span className="stat-label">Record</span>
                    <span className="stat-value" style={{ fontSize: '1rem', paddingTop: 6, color: 'var(--ink)' }}>{wins}-{losses}-{halves}</span>
                    <span className="stat-sub">{played} matches</span>
                  </div>
                )}
                {player.home_club && (
                  <div className="stat-block">
                    <span className="stat-label">Home Club</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--ink)', marginTop: 2 }}>{player.home_club}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Index panel (chart + current/high/low/trend) */}
            <PlayerIndexPanel
              history={historyPoints}
              currentIndex={player.handicap_index}
            />

            {/* Bio */}
            {player.bio && (
              <div style={{ padding: '0 var(--s-5) var(--s-5)', borderTop: '1px solid var(--border-soft)', paddingTop: 'var(--s-4)' }}>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--mute)', fontStyle: 'italic', textAlign: 'center' }}>
                  {player.bio}
                </p>
              </div>
            )}
          </div>

          {/* ── Recent GHIN rounds ───────────────────────────────────── */}
          {recentRounds && recentRounds.length > 0 && (
            <GhinRecentRounds rounds={recentRounds as any[]} />
          )}

          {/* No GHIN data yet */}
          {(!recentRounds || recentRounds.length === 0) && player.ghin && player.ghin !== 'TBD' && (
            <div className="board">
              <div className="board-title">Recent GHIN Rounds</div>
              <div style={{ padding: 'var(--s-5)', textAlign: 'center' }}>
                <p className="muted small">No GHIN rounds loaded yet.</p>
                {isAdmin && <GhinRefreshButton />}
              </div>
            </div>
          )}

          {/* ── Pairings table ───────────────────────────────────────── */}
          {(pairings ?? []).length > 0 && (
            <div className="board">
              <div className="board-title">Pairings This Trip</div>
              <table className="ht">
                <thead>
                  <tr>
                    <th>Rnd</th>
                    <th>Course</th>
                    <th>Partner</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(pairings ?? []).map((p: any) => {
                    const round = p.rounds;
                    const course = round?.courses;
                    const partner = p.player_a === id ? p.player_b_data : p.player_a_data;
                    return (
                      <tr key={p.id}>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: course?.rail_color ?? 'var(--gilt)', display: 'inline-block', flexShrink: 0 }} />
                            R{round?.round_no}
                            {round?.is_altshot && <span className="chip chip-gilt" style={{ fontSize: '0.58rem', padding: '1px 4px' }}>AS</span>}
                          </span>
                        </td>
                        <td>
                          {course?.slug
                            ? <Link href={`/courses/${course.slug}`} style={{ color: 'var(--green)', fontWeight: 500 }}>{course.name}</Link>
                            : (course?.name ?? '—')
                          }
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {partner
                            ? <Link href={`/players/${partner.id}`} style={{ color: 'var(--ink)' }}>{partner.name}</Link>
                            : '—'}
                        </td>
                        <td style={{ color: 'var(--mute)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {round?.play_date ? formatDate(round.play_date) : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Fun facts ────────────────────────────────────────────── */}
          {funFacts && Object.keys(funFacts).length > 0 && (
            <div className="board">
              <div className="board-title">Fun Facts</div>
              <div style={{ padding: 'var(--s-4) var(--s-5) var(--s-5)' }} className="stack-sm">
                {Object.entries(funFacts).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 'var(--s-2)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--gilt)', flexShrink: 0 }}>•</span>
                    <span><strong>{k}:</strong> {v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s-3)' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>Refresh GHIN Data</div>
                <div className="small muted">Updates all player indexes + recent rounds</div>
              </div>
              <GhinRefreshButton />
            </div>
          )}

          <Link href="/players" style={{ color: 'var(--mute)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← All Players
          </Link>
        </div>
      </div>
    </div>
  );
}
