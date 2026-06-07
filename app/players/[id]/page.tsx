import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { initials, formatDate } from '@/lib/utils';
import type { Player } from '@/lib/types';

export const revalidate = 300;

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: player } = await supabase
    .from('players').select('*').eq('id', id).maybeSingle() as { data: Player | null };
  if (!player) notFound();

  const { data: pairings } = await supabase
    .from('pairings')
    .select('*, rounds(round_no, play_date, tee_time, is_altshot, courses(name, rail_color, slug)), player_a_data:players!player_a(id,name,first_name), player_b_data:players!player_b(id,name,first_name)')
    .or(`player_a.eq.${id},player_b.eq.${id}`)
    .order('rounds(play_date)');

  const { data: matches } = await supabase
    .from('matches')
    .select('*, murray_pairing:pairings!murray_pairing_id(player_a,player_b), harris_pairing:pairings!harris_pairing_id(player_a,player_b)')
    .eq('status', 'final');

  const teamColor = player.team === 'murray' ? 'var(--green)' : 'var(--rail-portrush)';
  const teamLabel = player.team === 'murray' ? 'Team Murray' : 'Team Harris';
  const funFacts = player.fun_facts as Record<string, string> | null;

  // Count wins in final matches where this player was involved
  let wins = 0, halves = 0, losses = 0;
  for (const m of (matches ?? []) as any[]) {
    const mPairing = m.murray_pairing;
    const hPairing = m.harris_pairing;
    const isInMurray = mPairing && (mPairing.player_a === id || mPairing.player_b === id);
    const isInHarris = hPairing && (hPairing.player_a === id || hPairing.player_b === id);
    if (!isInMurray && !isInHarris) continue;
    const mPts = Number(m.murray_points);
    const hPts = Number(m.harris_points);
    const myPts = isInMurray ? mPts : hPts;
    const theirPts = isInMurray ? hPts : mPts;
    if (myPts > theirPts) wins++;
    else if (myPts === theirPts) halves++;
    else losses++;
  }
  const played = wins + halves + losses;

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100dvh' }}>

      {/* Slim team-color top bar */}
      <div style={{ height: 4, background: teamColor }} />

      <div className="wrap" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-8)' }}>
        <div className="stack-lg">

          {/* ── Player card ──────────────────────────────────────────── */}
          <div className="board">

            {/* Board title: "—— DAN MURRAY ——" */}
            <div className="board-title" style={{ paddingTop: 24, paddingBottom: 20 }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--mute)', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>
                {teamLabel}{player.is_captain ? ' · Captain' : ''}
              </div>
              {player.name.toUpperCase()}
              {player.nickname && (
                <div style={{ fontSize: '0.75rem', letterSpacing: '0.06em', fontStyle: 'italic', color: 'var(--mute)', marginTop: 4, fontWeight: 400, textTransform: 'none' }}>
                  &ldquo;{player.nickname}&rdquo;
                </div>
              )}
            </div>

            {/* Avatar + stats row */}
            <div style={{ padding: 'var(--s-5) var(--s-5) var(--s-4)', display: 'flex', gap: 'var(--s-4)', alignItems: 'center' }}>
              {/* Avatar */}
              <div className="avatar" style={{
                width: 72, height: 72, flexShrink: 0,
                border: `3px solid ${teamColor}`,
              }}>
                {player.avatar_url
                  ? <Image src={player.avatar_url} alt={player.name} width={72} height={72} />
                  : <div className="avatar-initials" style={{ fontSize: '1.3rem', color: teamColor }}>{initials(player.name)}</div>
                }
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 'var(--s-4)', flex: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <div className="stat-block">
                  <span className="stat-label">Index</span>
                  <span className="stat-value" style={{ color: teamColor }}>{player.handicap_index ?? '—'}</span>
                </div>
                <div className="stat-block">
                  <span className="stat-label">GHIN</span>
                  <span className="stat-value" style={{ fontSize: '1.1rem', paddingTop: 4 }}>{player.ghin ?? '—'}</span>
                </div>
                {played > 0 && (
                  <div className="stat-block">
                    <span className="stat-label">Record</span>
                    <span className="stat-value" style={{ fontSize: '1.1rem', paddingTop: 4 }}>{wins}-{losses}-{halves}</span>
                    <span className="stat-sub">{played} matches</span>
                  </div>
                )}
                {player.home_club && (
                  <div className="stat-block">
                    <span className="stat-label">Home Club</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 500, textAlign: 'center', color: 'var(--ink)', marginTop: 2 }}>
                      {player.home_club}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {player.bio && (
              <div style={{ padding: '0 var(--s-5) var(--s-4)', borderTop: '1px solid var(--border-soft)', paddingTop: 'var(--s-4)' }}>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--mute)', fontStyle: 'italic', textAlign: 'center' }}>
                  {player.bio}
                </p>
              </div>
            )}
          </div>

          {/* ── Pairings table ───────────────────────────────────────── */}
          {(pairings ?? []).length > 0 && (
            <div className="board">
              <div style={{ padding: '16px var(--s-5) 12px' }}>
                <p className="ruled">Pairings This Trip</p>
              </div>
              <table className="ht">
                <thead>
                  <tr>
                    <th>Round</th>
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
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                              background: course?.rail_color ?? 'var(--gilt)',
                              display: 'inline-block'
                            }} />
                            R{round?.round_no}
                            {round?.is_altshot && (
                              <span className="chip chip-gilt" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>AS</span>
                            )}
                          </span>
                        </td>
                        <td>
                          {course?.slug ? (
                            <Link href={`/courses/${course.slug}`} style={{ color: 'var(--green)', fontWeight: 500 }}>
                              {course?.name ?? '—'}
                            </Link>
                          ) : (course?.name ?? '—')}
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {partner ? (
                            <Link href={`/players/${partner.id}`} style={{ color: 'var(--ink)' }}>
                              {partner.name}
                            </Link>
                          ) : '—'}
                        </td>
                        <td className="muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
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
              <div style={{ padding: '16px var(--s-5) 12px' }}>
                <p className="ruled">Fun Facts</p>
              </div>
              <div style={{ padding: 'var(--s-3) var(--s-5) var(--s-5)' }}>
                <div className="stack-sm">
                  {Object.entries(funFacts).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 'var(--s-2)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--gilt)', flexShrink: 0 }}>•</span>
                      <span><strong>{k}:</strong> {v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Back link */}
          <Link href="/players" style={{ color: 'var(--mute)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← All Players
          </Link>
        </div>
      </div>
    </div>
  );
}
