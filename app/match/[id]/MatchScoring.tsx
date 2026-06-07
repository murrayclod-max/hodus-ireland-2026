'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
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
type Winner = 'murray' | 'harris' | 'halved';

// All valid match-play margins in order
const MARGINS = [
  { code: '1up',   label: '1 UP',  up: 1, remaining: 0 },
  { code: '2and1', label: '2&1',   up: 2, remaining: 1 },
  { code: '3and2', label: '3&2',   up: 3, remaining: 2 },
  { code: '4and3', label: '4&3',   up: 4, remaining: 3 },
  { code: '5and4', label: '5&4',   up: 5, remaining: 4 },
  { code: '6and5', label: '6&5',   up: 6, remaining: 5 },
  { code: '7and6', label: '7&6',   up: 7, remaining: 6 },
  { code: '8and7', label: '8&7',   up: 8, remaining: 7 },
  { code: '9and8', label: '9&8',   up: 9, remaining: 8 },
];

function computeLiveStatus(holes: { hole: number; result: HoleResult | null }[]) {
  let murrayWins = 0, harrisWins = 0, holesPlayed = 0;
  let closedOutHole: number | null = null;
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
    }
  }

  const diff = murrayWins - harrisWins;
  const holesRemaining = 18 - holesPlayed;
  let status = '';
  if (!isClosedOut) {
    if (diff > 0) status = `Murray ${diff}UP`;
    else if (diff < 0) status = `Harris ${-diff}UP`;
    else status = holesPlayed > 0 ? 'All Square' : 'vs';
  } else {
    const remaining18 = 18 - closedOutHole!;
    status = diff > 0 ? `Murray ${Math.abs(diff)}&${remaining18}` : `Harris ${Math.abs(diff)}&${remaining18}`;
  }

  // Points (1 win, 0.5 halved each, plus half-log on closed-out hole 18)
  let murrayPoints = 0, harrisPoints = 0;
  if (holesPlayed === 18 || isClosedOut) {
    if (diff > 0) murrayPoints = 1;
    else if (diff < 0) harrisPoints = 1;
    else { murrayPoints = 0.5; harrisPoints = 0.5; }

    if (isClosedOut) {
      const h18 = holes.find(x => x.hole === 18);
      if (h18?.result === 'murray') murrayPoints += 0.5;
      else if (h18?.result === 'harris') harrisPoints += 0.5;
      else if (h18?.result === 'halved') { murrayPoints += 0.25; harrisPoints += 0.25; }
    }
  }

  return { diff, holesPlayed, holesRemaining, status, closedOutHole: isClosedOut ? closedOutHole : null, murrayPoints, harrisPoints };
}

function pairingNames(p: any): string {
  if (!p) return '—';
  const a = p.player_a_data?.name?.split(' ').pop() ?? '?';
  const b = p.player_b_data?.name?.split(' ').pop() ?? '?';
  return `${a} & ${b}`;
}

// Derive display label from saved quick-score notes or live hole data
function finalLabel(match: Match, matchHoles: { hole: number; result: HoleResult | null }[]): string {
  if (match.notes) return match.notes;
  if (matchHoles.length > 0) return computeLiveStatus(matchHoles).status;
  return match.murray_points > match.harris_points ? 'Murray wins' : match.harris_points > match.murray_points ? 'Harris wins' : 'Halved';
}

function MatchCard({ match, pairings, holeResults, isAdmin }: {
  match: Match; pairings: any[]; holeResults: HoleResultRow[]; isAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const murrayPairing = pairings.find(p => p.id === match.murray_pairing_id);
  const harrisPairing = pairings.find(p => p.id === match.harris_pairing_id);
  const matchHoles = holeResults
    .filter(h => h.match_id === match.id)
    .map(h => ({ hole: h.hole, result: h.result as HoleResult | null }));

  const hasLiveData = matchHoles.length > 0;

  // Default to live mode if hole data already exists
  const [mode, setMode] = useState<'quick' | 'live'>(hasLiveData ? 'live' : 'quick');

  // Quick score state — pre-fill from existing result if final
  const initWinner = (): Winner | null => {
    if (match.status !== 'final') return null;
    if (match.murray_points > match.harris_points) return 'murray';
    if (match.harris_points > match.murray_points) return 'harris';
    return 'halved';
  };
  const [winner, setWinner] = useState<Winner | null>(initWinner);
  const [marginCode, setMarginCode] = useState('2and1');
  const [saving, setSaving] = useState(false);

  // Live scoring
  const liveStatus = computeLiveStatus(matchHoles);
  const statusColor = liveStatus.diff > 0 ? 'var(--green)' : liveStatus.diff < 0 ? 'var(--rail-portrush)' : 'var(--gilt)';

  async function saveQuickScore() {
    if (!winner) return;
    setSaving(true);

    let murrayPoints = 0, harrisPoints = 0;
    let closedOutHole: number | null = null;
    let noteStr = '';

    if (winner === 'halved') {
      murrayPoints = 0.5;
      harrisPoints = 0.5;
      noteStr = 'Halved';
    } else {
      const margin = MARGINS.find(m => m.code === marginCode) ?? MARGINS[0];
      closedOutHole = margin.remaining > 0 ? 18 - margin.remaining : null;
      if (winner === 'murray') { murrayPoints = 1; noteStr = `Murray ${margin.label}`; }
      else { harrisPoints = 1; noteStr = `Harris ${margin.label}`; }
    }

    // Clear any existing hole-by-hole data when saving a quick score
    await supabase.from('hole_results').delete().eq('match_id', match.id);

    await supabase.from('matches').update({
      status: 'final',
      closed_out_hole: closedOutHole,
      murray_points: murrayPoints,
      harris_points: harrisPoints,
      notes: noteStr,
    }).eq('id', match.id);

    setSaving(false);
    router.refresh();
  }

  async function clearResult() {
    setSaving(true);
    await supabase.from('hole_results').delete().eq('match_id', match.id);
    await supabase.from('matches').update({
      status: 'pending', closed_out_hole: null,
      murray_points: 0, harris_points: 0, notes: null,
    }).eq('id', match.id);
    setWinner(null);
    setSaving(false);
    router.refresh();
  }

  async function setHoleResult(hole: number, result: HoleResult | null) {
    setSaving(true);
    if (result === null) {
      await supabase.from('hole_results').delete().eq('match_id', match.id).eq('hole', hole);
    } else {
      await supabase.from('hole_results').upsert({ match_id: match.id, hole, result }, { onConflict: 'match_id,hole' });
    }

    const { data: fresh } = await supabase.from('hole_results').select('*').eq('match_id', match.id);
    const freshHoles = (fresh ?? []).map((h: any) => ({ hole: h.hole, result: h.result as HoleResult | null }));
    const st = computeLiveStatus(freshHoles);
    const isComplete = freshHoles.filter(h => h.result !== null).length === 18 || st.closedOutHole !== null;

    await supabase.from('matches').update({
      status: isComplete ? 'final' : freshHoles.some(h => h.result) ? 'live' : 'pending',
      closed_out_hole: st.closedOutHole,
      murray_points: isComplete ? st.murrayPoints : 0,
      harris_points: isComplete ? st.harrisPoints : 0,
      notes: null, // live scoring clears any quick-score note
    }).eq('id', match.id);

    setSaving(false);
    router.refresh();
  }

  const isFinal = match.status === 'final';
  const isLive = match.status === 'live';

  return (
    <div className="card" style={{ marginBottom: 'var(--s-3)' }}>
      {/* Header: pairing names + status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-3)' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--green)' }}>{pairingNames(murrayPairing)}</div>
        <div style={{ textAlign: 'center', minWidth: 56 }}>
          {isFinal ? (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: statusColor, whiteSpace: 'nowrap' }}>
                {finalLabel(match, matchHoles)}
              </div>
              <span className="chip chip-success" style={{ fontSize: '0.65rem', marginTop: 2 }}>Final</span>
            </div>
          ) : isLive ? (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: statusColor }}>{liveStatus.status}</div>
              <span className="chip chip-gilt" style={{ fontSize: '0.65rem', marginTop: 2 }}>Live</span>
            </div>
          ) : (
            <span className="chip chip-neutral" style={{ fontSize: '0.7rem' }}>vs</span>
          )}
        </div>
        <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--rail-portrush)', textAlign: 'right' }}>{pairingNames(harrisPairing)}</div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 'var(--s-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        {(['quick', 'live'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1, padding: '6px 0', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: mode === m ? 'var(--ink)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--mute)',
              transition: 'background 0.15s',
            }}
          >
            {m === 'quick' ? 'Quick Score' : 'Hole by Hole'}
          </button>
        ))}
      </div>

      {/* ── QUICK SCORE PANEL ── */}
      {mode === 'quick' && (
        <div>
          {/* Winner picker */}
          <p className="section-label" style={{ marginBottom: 'var(--s-2)' }}>Winner</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--s-2)', marginBottom: 'var(--s-3)' }}>
            {(['murray', 'halved', 'harris'] as Winner[]).map(w => {
              const active = winner === w;
              const color = w === 'murray' ? 'var(--green)' : w === 'harris' ? 'var(--rail-portrush)' : 'var(--gilt)';
              const label = w === 'murray' ? 'Murray' : w === 'harris' ? 'Harris' : 'Halved';
              return (
                <button
                  key={w}
                  onClick={() => setWinner(active ? null : w)}
                  style={{
                    padding: 'var(--s-3)', borderRadius: 'var(--r-md)', border: `2px solid ${active ? color : 'var(--border)'}`,
                    background: active ? color : 'transparent',
                    color: active ? (w === 'halved' ? 'var(--ink)' : '#fff') : 'var(--ink)',
                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Margin selector (not shown for halved) */}
          {winner && winner !== 'halved' && (
            <div style={{ marginBottom: 'var(--s-3)' }}>
              <p className="section-label" style={{ marginBottom: 'var(--s-2)' }}>Margin</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--s-2)' }}>
                {MARGINS.map(m => {
                  const active = marginCode === m.code;
                  return (
                    <button
                      key={m.code}
                      onClick={() => setMarginCode(m.code)}
                      style={{
                        padding: 'var(--s-2) var(--s-1)', borderRadius: 'var(--r-md)',
                        border: `2px solid ${active ? 'var(--gilt)' : 'var(--border)'}`,
                        background: active ? 'rgba(201,162,75,.12)' : 'transparent',
                        fontWeight: active ? 700 : 500, fontSize: '0.82rem', cursor: 'pointer',
                        color: active ? 'var(--ink)' : 'var(--mute)',
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preview */}
          {winner && (
            <div style={{ marginBottom: 'var(--s-3)', padding: 'var(--s-2) var(--s-3)', background: 'var(--cream-dark)', borderRadius: 'var(--r-md)', fontSize: '0.88rem', textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {winner === 'halved' ? 'Halved' : winner === 'murray' ? `Murray ${MARGINS.find(m => m.code === marginCode)?.label}` : `Harris ${MARGINS.find(m => m.code === marginCode)?.label}`}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
            <button
              onClick={saveQuickScore}
              disabled={!winner || saving}
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
            >
              {saving ? 'Saving…' : isFinal ? 'Update Result' : 'Save Result'}
            </button>
            {isFinal && (
              <button onClick={clearResult} disabled={saving} className="btn btn-secondary btn-sm">
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── HOLE BY HOLE PANEL ── */}
      {mode === 'live' && (
        <div>
          <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>
            Hole-by-Hole ({liveStatus.holesPlayed}/18)
            {liveStatus.holesPlayed > 0 && (
              <span style={{ marginLeft: 8, color: statusColor, fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>
                — {liveStatus.status}
              </span>
            )}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4 }}>
            {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => {
              const hr = matchHoles.find(h => h.hole === hole);
              const result = hr?.result ?? null;
              return (
                <div key={hole} style={{ textAlign: 'center' }}>
                  <div className="small muted" style={{ marginBottom: 2, fontSize: '0.65rem' }}>H{hole}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(['murray', 'halved', 'harris'] as const).map(r => {
                      const bg = result === r
                        ? r === 'murray' ? 'var(--green)' : r === 'harris' ? 'var(--rail-portrush)' : 'var(--gilt)'
                        : 'var(--cream-dark)';
                      const fg = result === r ? (r === 'halved' ? 'var(--ink)' : '#fff') : 'var(--mute)';
                      return (
                        <button
                          key={r}
                          onClick={() => setHoleResult(hole, result === r ? null : r)}
                          style={{ height: 28, borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, background: bg, color: fg }}
                        >
                          {r === 'murray' ? 'M' : r === 'halved' ? '½' : 'H'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {isFinal && (
            <div style={{ marginTop: 'var(--s-4)', padding: 'var(--s-3)', background: 'var(--cream-dark)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
                {liveStatus.status} — Murray {match.murray_points} · Harris {match.harris_points} pts
              </div>
              {match.closed_out_hole && (
                <p className="small muted" style={{ marginTop: 4 }}>Closed out hole {match.closed_out_hole} · half-log applied</p>
              )}
            </div>
          )}

          {isFinal && (
            <button onClick={clearResult} disabled={saving} className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--s-3)' }}>
              Clear Result
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function MatchScoring({ round, matches, pairings, holeResults, myPlayerId, isAdmin, settings }: Props) {
  const sorted = [...matches].sort((a, b) => {
    const sa = pairings.find(p => p.id === a.murray_pairing_id)?.slot ?? 0;
    const sb = pairings.find(p => p.id === b.murray_pairing_id)?.slot ?? 0;
    return sa - sb;
  });

  return (
    <div className="wrap" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>
      {sorted.length === 0 ? (
        <div className="empty-state">
          <Trophy size={32} style={{ opacity: 0.3 }} />
          <p>No matches set up for this round yet.</p>
          {isAdmin && <p className="small muted">Configure pairings from the Match page.</p>}
        </div>
      ) : (
        <div>
          <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>
            {sorted.length} {sorted[0]?.game_format_key === 'altshot' ? 'Alternate Shot' : 'Fourball'} {sorted.length === 1 ? 'Match' : 'Matches'}
          </p>
          {sorted.map(match => (
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
