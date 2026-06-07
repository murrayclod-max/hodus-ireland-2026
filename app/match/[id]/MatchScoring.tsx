'use client';

import { useState, useCallback } from 'react';
import { Check, Minus, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Match, Round, Course, HoleResultRow } from '@/lib/types';

interface Props {
  round: Round & { courses: Course };
  matches: Match[];
  pairings: any[];
  holeResults: HoleResultRow[];
  myPlayerId: string | null;
  isAdmin: boolean;
  settings: any;
}

type HoleResult = 'murray' | 'harris' | 'halved';

function computeMatchStatus(holes: { hole: number; result: HoleResult | null }[]): {
  murrayUp: number;
  harrisUp: number;
  holesPlayed: number;
  holesRemaining: number;
  status: string;
  closedOutHole: number | null;
  murrayPoints: number;
  harrisPoints: number;
} {
  let murrayWins = 0, harrisWins = 0;
  let holesPlayed = 0;
  let closedOutHole: number | null = null;
  let closedOutAt = 0;
  let isClosedOut = false;

  for (let h = 1; h <= 18; h++) {
    const hr = holes.find(x => x.hole === h);
    if (!hr?.result) break;
    holesPlayed++;
    if (hr.result === 'murray') murrayWins++;
    else if (hr.result === 'harris') harrisWins++;

    const diff = murrayWins - harrisWins;
    const remaining = 18 - h;
    if (!isClosedOut && (diff > remaining || -diff > remaining)) {
      isClosedOut = true;
      closedOutHole = h;
      closedOutAt = h;
    }
  }

  const diff = murrayWins - harrisWins;
  const holesRemaining = 18 - holesPlayed;

  let status = '';
  if (!isClosedOut) {
    if (diff > 0) status = `Murray ${diff}UP`;
    else if (diff < 0) status = `Harris ${-diff}UP`;
    else status = 'All Square';
  } else {
    const holesUp = Math.abs(diff);
    const remaining18 = 18 - closedOutAt!;
    status = diff > 0 ? `Murray ${holesUp}&${remaining18}` : `Harris ${holesUp}&${remaining18}`;
  }

  // Half-log: closed-out match → 1pt to winner, then replay 18th for +0.5 (0.25 if halved)
  let murrayPoints = 0, harrisPoints = 0;
  if (holesPlayed === 18 || isClosedOut) {
    if (diff > 0) { murrayPoints = 1; }
    else if (diff < 0) { harrisPoints = 1; }
    else { murrayPoints = 0.5; harrisPoints = 0.5; }

    // Half-log on hole 18 replay
    const hole18 = holes.find(x => x.hole === 18);
    if (isClosedOut && hole18?.result) {
      if (hole18.result === 'murray') murrayPoints += 0.5;
      else if (hole18.result === 'harris') harrisPoints += 0.5;
      else { murrayPoints += 0.25; harrisPoints += 0.25; }
    }
  }

  return { murrayUp: Math.max(diff, 0), harrisUp: Math.max(-diff, 0), holesPlayed, holesRemaining, status, closedOutHole: isClosedOut ? closedOutHole : null, murrayPoints, harrisPoints };
}

function MatchCard({ match, pairings, holeResults, isAdmin }: {
  match: Match;
  pairings: any[];
  holeResults: HoleResultRow[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const murrayPairing = pairings.find(p => p.id === match.murray_pairing_id);
  const harrisPairing = pairings.find(p => p.id === match.harris_pairing_id);
  const matchHoles = holeResults.filter(h => h.match_id === match.id).map(h => ({ hole: h.hole, result: h.result as HoleResult | null }));

  const computed = computeMatchStatus(matchHoles);

  function pairingNames(p: any): string {
    if (!p) return '—';
    return `${p.player_a_data?.name?.split(' ').pop() ?? '?'} & ${p.player_b_data?.name?.split(' ').pop() ?? '?'}`;
  }

  async function setHoleResult(hole: number, result: HoleResult | null) {
    setSaving(true);
    const supabase = createClient();

    if (result === null) {
      await supabase.from('hole_results').delete().eq('match_id', match.id).eq('hole', hole);
    } else {
      await supabase.from('hole_results').upsert({
        match_id: match.id,
        hole,
        result,
      }, { onConflict: 'match_id,hole' });
    }

    // Recompute and update match status
    const { data: fresh } = await supabase
      .from('hole_results').select('*').eq('match_id', match.id);
    const freshHoles = (fresh ?? []).map((h: any) => ({ hole: h.hole, result: h.result as HoleResult | null }));
    const newStatus = computeMatchStatus(freshHoles);

    const isComplete = freshHoles.filter(h => h.result !== null).length === 18 || newStatus.closedOutHole !== null;
    await supabase.from('matches').update({
      status: isComplete ? 'final' : freshHoles.some(h => h.result) ? 'live' : 'pending',
      closed_out_hole: newStatus.closedOutHole,
      murray_points: isComplete ? newStatus.murrayPoints : 0,
      harris_points: isComplete ? newStatus.harrisPoints : 0,
    }).eq('id', match.id);

    setSaving(false);
    router.refresh();
  }

  const holes = Array.from({ length: 18 }, (_, i) => i + 1);
  const statusColor = computed.murrayUp > computed.harrisUp ? 'var(--green)'
    : computed.harrisUp > computed.murrayUp ? 'var(--rail-portrush)'
    : 'var(--gilt)';

  return (
    <div className="card" style={{ marginBottom: 'var(--s-3)' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 'var(--s-2)' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--green)' }}>{pairingNames(murrayPairing)}</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: statusColor }}>{computed.status || 'vs'}</div>
            {match.status === 'final' && <span className="chip chip-success" style={{ fontSize: '0.65rem' }}>Final</span>}
            {match.status === 'live' && <span className="chip chip-gilt" style={{ fontSize: '0.65rem' }}>Live</span>}
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--rail-portrush)', textAlign: 'right' }}>{pairingNames(harrisPairing)}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--s-2)', color: 'var(--mute)' }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 'var(--s-4)', borderTop: '1px solid var(--border-soft)', paddingTop: 'var(--s-4)' }}>
          <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Hole-by-Hole ({computed.holesPlayed}/18)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4 }}>
            {holes.map(hole => {
              const hr = matchHoles.find(h => h.hole === hole);
              const result = hr?.result ?? null;
              return (
                <div key={hole} style={{ textAlign: 'center' }}>
                  <div className="small muted" style={{ marginBottom: 2, fontSize: '0.65rem' }}>H{hole}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button
                      onClick={() => setHoleResult(hole, result === 'murray' ? null : 'murray')}
                      style={{
                        height: 28, borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
                        background: result === 'murray' ? 'var(--green)' : 'var(--cream-dark)',
                        color: result === 'murray' ? '#fff' : 'var(--mute)',
                      }}
                    >M</button>
                    <button
                      onClick={() => setHoleResult(hole, result === 'halved' ? null : 'halved')}
                      style={{
                        height: 28, borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
                        background: result === 'halved' ? 'var(--gilt)' : 'var(--cream-dark)',
                        color: result === 'halved' ? 'var(--ink)' : 'var(--mute)',
                      }}
                    >½</button>
                    <button
                      onClick={() => setHoleResult(hole, result === 'harris' ? null : 'harris')}
                      style={{
                        height: 28, borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
                        background: result === 'harris' ? 'var(--rail-portrush)' : 'var(--cream-dark)',
                        color: result === 'harris' ? '#fff' : 'var(--mute)',
                      }}
                    >H</button>
                  </div>
                </div>
              );
            })}
          </div>

          {match.status === 'final' && (
            <div style={{ marginTop: 'var(--s-4)', padding: 'var(--s-3)', background: 'var(--cream-dark)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
                Final: Murray {match.murray_points} – Harris {match.harris_points}
              </div>
              {match.closed_out_hole && (
                <p className="small muted">Closed out hole {match.closed_out_hole} · half-log applied</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MatchScoring({ round, matches, pairings, holeResults, myPlayerId, isAdmin, settings }: Props) {
  return (
    <div className="wrap" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>
      {matches.length === 0 ? (
        <div className="empty-state">
          <Trophy size={32} style={{ opacity: 0.3 }} />
          <p>No matches set up for this round yet.</p>
          {isAdmin && <p className="small muted">Add pairings from the admin panel.</p>}
        </div>
      ) : (
        <div>
          <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>
            {matches.length} {round.is_altshot ? 'Alternate Shot' : 'Fourball'} {matches.length === 1 ? 'Match' : 'Matches'}
          </p>
          {matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              pairings={pairings}
              holeResults={holeResults}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
