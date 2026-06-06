import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import { initials, formatDate } from '@/lib/utils';
import type { Player, Round, Course, Pairing } from '@/lib/types';

export const revalidate = 300;

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: player } = await supabase
    .from('players').select('*').eq('id', id).maybeSingle() as { data: Player | null };
  if (!player) notFound();

  // Their pairings across all rounds
  const { data: pairings } = await supabase
    .from('pairings')
    .select('*, rounds(round_no, play_date, tee_time, courses(name, rail_color)), player_a_data:players!player_a(id,name,first_name), player_b_data:players!player_b(id,name,first_name)')
    .or(`player_a.eq.${id},player_b.eq.${id}`)
    .order('rounds(play_date)');

  const funFacts = player.fun_facts as Record<string, string> | null;

  const teamColor = player.team === 'murray' ? 'var(--green)' : 'var(--rail-portrush)';
  const teamLabel = player.team === 'murray' ? 'Team Murray' : 'Team Harris';

  return (
    <div>
      {/* Hero */}
      <div style={{ background: teamColor, padding: 'var(--s-6) var(--s-4) var(--s-5)', paddingTop: 'calc(var(--s-6) + env(safe-area-inset-top))' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
          <div className="avatar" style={{ width: 80, height: 80, border: '3px solid rgba(255,255,255,.3)' }}>
            {player.avatar_url
              ? <Image src={player.avatar_url} alt={player.name} width={80} height={80} />
              : <div className="avatar-initials" style={{ fontSize: '1.4rem', color: '#fff', background: 'rgba(255,255,255,.2)' }}>{initials(player.name)}</div>
            }
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(1.3rem,4vw,1.8rem)' }}>{player.name}</h1>
            {player.nickname && <p style={{ color: 'rgba(255,255,255,.75)', fontStyle: 'italic' }}>&ldquo;{player.nickname}&rdquo;</p>}
            <div style={{ display: 'flex', gap: 'var(--s-2)', marginTop: 'var(--s-2)', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,.15)', color: '#fff', borderRadius: 'var(--r-pill)', padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
                {teamLabel}
              </span>
              {player.is_captain && <span className="chip chip-gilt">Captain</span>}
              <span style={{ background: 'rgba(255,255,255,.15)', color: '#fff', borderRadius: 'var(--r-pill)', padding: '3px 10px', fontSize: '0.78rem' }}>
                {player.handicap_index ?? '—'} index
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>

        {/* Stats row */}
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--s-2)', textAlign: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem' }}>{player.handicap_index ?? '—'}</div>
              <div className="small muted">Index</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem' }}>{player.ghin ?? '—'}</div>
              <div className="small muted">GHIN</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem' }}>{player.home_club ? player.home_club.split(' ')[0] : '—'}</div>
              <div className="small muted">Home Club</div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {player.bio && (
          <div className="card">
            <p className="section-label" style={{ marginBottom: 'var(--s-2)' }}>About</p>
            <p>{player.bio}</p>
          </div>
        )}

        {/* Fun facts */}
        {funFacts && Object.keys(funFacts).length > 0 && (
          <div className="card">
            <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Fun Facts</p>
            <div className="stack-sm">
              {Object.entries(funFacts).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 'var(--s-2)' }}>
                  <span style={{ fontSize: '1rem' }}>•</span>
                  <div><strong>{k}:</strong> {v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pairings */}
        {(pairings ?? []).length > 0 && (
          <div>
            <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Pairings This Trip</p>
            <div className="stack-sm">
              {(pairings ?? []).map((p: any) => {
                const round = p.rounds;
                const partner = p.player_a === id ? p.player_b_data : p.player_a_data;
                const course = round?.courses;
                return (
                  <div key={p.id} className="card" style={{ borderLeft: `3px solid ${course?.rail_color ?? 'var(--gilt)'}` }}>
                    <div className="row-between">
                      <div>
                        <span className="chip chip-neutral" style={{ marginRight: 6 }}>R{round?.round_no}</span>
                        <span style={{ fontWeight: 500 }}>w/ {partner?.name ?? '—'}</span>
                      </div>
                      <div className="small muted">{round?.play_date ? formatDate(round.play_date) : ''}</div>
                    </div>
                    <div className="small muted" style={{ marginTop: 2 }}>{course?.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
