'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { courseHandicap, fourballStrokes, combinedMatchStrokes, strokeHoles } from '@/lib/handicap';
import type { Round, Match, Pairing, Player, Course, CourseTee, GameFormat } from '@/lib/types';

interface FullRound extends Omit<Round, 'courses'> { courses: Course | null }

interface Props {
  rounds: FullRound[];
  allMatches: Match[];
  allPairings: (Pairing & { player_a_data?: Player; player_b_data?: Player })[];
  allPlayers: Player[];
  gameFormats: GameFormat[];
  isAdmin: boolean;
}

interface MatchState {
  matchId: string;
  formatKey: string;
  murrayPairingId: string;
  murrayA: string;
  murrayB: string;
  harrisPairingId: string;
  harrisA: string;
  harrisB: string;
}
interface RoundState { selectedTee: string; matches: MatchState[]; saving: boolean }

function lastName(p: Player | undefined): string {
  if (!p) return '?';
  return p.name.split(' ').pop() ?? p.name;
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function MatchRoundsClient({
  rounds, allMatches, allPairings, allPlayers, gameFormats, isAdmin,
}: Props) {
  const router = useRouter();

  const [roundStates, setRoundStates] = useState<RoundState[]>(() =>
    rounds.map(round => {
      const rms = allMatches
        .filter(m => m.round_id === round.id)
        .sort((a, b) => {
          const sa = allPairings.find(p => p.id === a.murray_pairing_id)?.slot ?? 0;
          const sb = allPairings.find(p => p.id === b.murray_pairing_id)?.slot ?? 0;
          return sa - sb;
        });
      return {
        selectedTee: round.selected_tee ?? '',
        saving: false,
        matches: rms.map(m => {
          const mp = allPairings.find(p => p.id === m.murray_pairing_id);
          const hp = allPairings.find(p => p.id === m.harris_pairing_id);
          return {
            matchId: m.id,
            formatKey: m.game_format_key ?? 'fourball',
            murrayPairingId: mp?.id ?? '',
            murrayA: mp?.player_a ?? '',
            murrayB: mp?.player_b ?? '',
            harrisPairingId: hp?.id ?? '',
            harrisA: hp?.player_a ?? '',
            harrisB: hp?.player_b ?? '',
          };
        }),
      };
    })
  );

  function setRound(ri: number, fn: (rs: RoundState) => RoundState) {
    setRoundStates(prev => prev.map((r, i) => i === ri ? fn(r) : r));
  }

  function setMatch(ri: number, mi: number, fn: (ms: MatchState) => MatchState) {
    setRound(ri, rs => ({ ...rs, matches: rs.matches.map((m, i) => i === mi ? fn(m) : m) }));
  }

  const supabase = createClient();

  async function saveTee(roundId: string, ri: number, tee: string) {
    setRound(ri, rs => ({ ...rs, selectedTee: tee }));
    await supabase.from('rounds').update({ selected_tee: tee || null }).eq('id', roundId);
    router.refresh();
  }

  async function saveFormat(matchId: string, ri: number, mi: number, key: string) {
    setMatch(ri, mi, ms => ({ ...ms, formatKey: key }));
    await supabase.from('matches').update({ game_format_key: key }).eq('id', matchId);
    router.refresh();
  }

  async function savePairings(ri: number) {
    const rs = roundStates[ri];
    setRound(ri, r => ({ ...r, saving: true }));
    await Promise.all(
      rs.matches.flatMap(ms => [
        supabase.from('pairings').update({ player_a: ms.murrayA, player_b: ms.murrayB }).eq('id', ms.murrayPairingId),
        supabase.from('pairings').update({ player_a: ms.harrisA, player_b: ms.harrisB }).eq('id', ms.harrisPairingId),
      ])
    );
    setRound(ri, r => ({ ...r, saving: false }));
    router.refresh();
  }

  function findPlayer(id: string) { return allPlayers.find(p => p.id === id); }
  function findFormat(key: string) { return gameFormats.find(f => f.key === key) ?? gameFormats[0]; }

  function duplicateIds(rs: RoundState, team: 'murray' | 'harris'): Set<string> {
    const ids = rs.matches.flatMap(ms =>
      team === 'murray' ? [ms.murrayA, ms.murrayB] : [ms.harrisA, ms.harrisB]
    ).filter(Boolean);
    const seen = new Set<string>();
    const dupes = new Set<string>();
    ids.forEach(id => { if (seen.has(id)) dupes.add(id); else seen.add(id); });
    return dupes;
  }

  function hasUnfilled(rs: RoundState) {
    return rs.matches.some(ms => !ms.murrayA || !ms.murrayB || !ms.harrisA || !ms.harrisB);
  }

  return (
    <div className="stack-lg">
      {rounds.map((round, ri) => {
        const rs = roundStates[ri];
        const course = round.courses;
        const tees: CourseTee[] = course?.tees ?? [];
        const teeObj = tees.find(t => t.name === rs.selectedTee) ?? null;
        const hasTee = teeObj != null;
        const coursePar = course?.par ?? 72;
        const teePar = teeObj?.par ?? coursePar;

        const roundMatchData = allMatches.filter(m => m.round_id === round.id);
        const rMurray = roundMatchData.reduce((s, m) => s + (m.status === 'final' ? Number(m.murray_points) : 0), 0);
        const rHarris = roundMatchData.reduce((s, m) => s + (m.status === 'final' ? Number(m.harris_points) : 0), 0);
        const hasScore = rMurray > 0 || rHarris > 0;

        const murrayDupes = isAdmin ? duplicateIds(rs, 'murray') : new Set<string>();
        const harrisDupes = isAdmin ? duplicateIds(rs, 'harris') : new Set<string>();
        const hasDupes = murrayDupes.size > 0 || harrisDupes.size > 0;
        const canSave = !hasDupes && !hasUnfilled(rs) && !rs.saving;

        const murrayPlayers = allPlayers.filter(p => p.team === 'murray');
        const harrisPlayers = allPlayers.filter(p => p.team === 'harris');

        return (
          <div key={round.id} className="card" style={{ borderLeft: `4px solid ${course?.rail_color ?? 'var(--gilt)'}` }}>
            {/* Round header */}
            <div className="row-between" style={{ marginBottom: 'var(--s-3)', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
                  Round {round.round_no} — {course?.name}
                </div>
                <div className="small muted">
                  {fmtDate(round.play_date)} · {round.tee_time}
                  {round.is_altshot && <span className="chip chip-gilt" style={{ marginLeft: 6 }}>Alt Shot</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
                {hasScore && (
                  <span>
                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>{rMurray}</span>
                    <span className="muted"> – </span>
                    <span style={{ color: 'var(--rail-portrush)', fontWeight: 700 }}>{rHarris}</span>
                  </span>
                )}
                {/* Tee selector — admin only */}
                {isAdmin && tees.length > 0 && (
                  <select
                    value={rs.selectedTee}
                    onChange={e => saveTee(round.id, ri, e.target.value)}
                    style={{ fontSize: 12, padding: '4px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}
                  >
                    <option value="">— Select tee —</option>
                    {tees.map(t => <option key={t.name} value={t.name}>{t.name} ({t.rating}/{t.slope})</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* Tee warning */}
            {!hasTee && (
              <div style={{ fontSize: 12, color: 'var(--mute)', marginBottom: 'var(--s-3)', padding: 'var(--s-2) var(--s-3)', background: 'var(--cream-dark)', borderRadius: 'var(--r-sm)' }}>
                {isAdmin ? '⚠ Select a tee above to enable handicap calculations' : '⚠ Tee not yet selected — handicaps pending'}
              </div>
            )}

            {/* Matches */}
            <div className="stack-sm">
              {rs.matches.map((ms, mi) => {
                const format = findFormat(ms.formatKey);
                const pM1 = findPlayer(ms.murrayA);
                const pM2 = findPlayer(ms.murrayB);
                const pH1 = findPlayer(ms.harrisA);
                const pH2 = findPlayer(ms.harrisB);

                const chM1 = hasTee && pM1?.handicap_index != null ? courseHandicap(pM1.handicap_index, teeObj!.slope, teeObj!.rating, teePar) : null;
                const chM2 = hasTee && pM2?.handicap_index != null ? courseHandicap(pM2.handicap_index, teeObj!.slope, teeObj!.rating, teePar) : null;
                const chH1 = hasTee && pH1?.handicap_index != null ? courseHandicap(pH1.handicap_index, teeObj!.slope, teeObj!.rating, teePar) : null;
                const chH2 = hasTee && pH2?.handicap_index != null ? courseHandicap(pH2.handicap_index, teeObj!.slope, teeObj!.rating, teePar) : null;

                const allCHs = chM1 != null && chM2 != null && chH1 != null && chH2 != null;

                let strokesSummary: string | null = null;
                let strokeHoleList: { label: string; holes: number[] } | null = null;

                if (allCHs) {
                  const params = format.params;
                  if (ms.formatKey === 'fourball') {
                    const s = fourballStrokes(chM1!, chM2!, chH1!, chH2!, (params.pct as number) ?? 90);
                    const si = teeObj?.si;
                    const parts = [
                      s.m1 > 0 ? `${lastName(pM1)} +${s.m1}` : null,
                      s.m2 > 0 ? `${lastName(pM2)} +${s.m2}` : null,
                      s.h1 > 0 ? `${lastName(pH1)} +${s.h1}` : null,
                      s.h2 > 0 ? `${lastName(pH2)} +${s.h2}` : null,
                    ].filter(Boolean);
                    strokesSummary = parts.length ? parts.join(' · ') : 'Level — no strokes given';
                    // Show stroke holes for the highest-stroke player (simplification)
                    const maxStrokes = Math.max(s.m1, s.m2, s.h1, s.h2);
                    if (si && maxStrokes > 0) {
                      strokeHoleList = { label: `${maxStrokes} stroke${maxStrokes > 1 ? 's' : ''} on`, holes: strokeHoles(si, maxStrokes) };
                    }
                  } else {
                    const res = combinedMatchStrokes(chM1!, chM2!, chH1!, chH2!, params as Record<string, number>);
                    const sTeam = res.receiver === 'murray' ? 'Murray' : res.receiver === 'harris' ? 'Harris' : null;
                    strokesSummary = res.receiver === 'level'
                      ? `Level — Murray PH ${res.murrayPH} · Harris PH ${res.harrisPH}`
                      : `Team ${sTeam} receives ${res.strokes} stroke${res.strokes !== 1 ? 's' : ''} · Murray PH ${res.murrayPH} · Harris PH ${res.harrisPH}`;
                    if (teeObj?.si && res.strokes > 0) {
                      strokeHoleList = { label: `Stroke${res.strokes > 1 ? 's' : ''} on`, holes: strokeHoles(teeObj.si, res.strokes) };
                    }
                  }
                }

                const matchRow = roundMatchData.find(m => m.id === ms.matchId);
                const isFinal = matchRow?.status === 'final';
                const isLive = matchRow?.status === 'live';

                return (
                  <div key={ms.matchId} style={{
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--r-md)',
                    padding: 'var(--s-3)',
                    background: 'var(--surface)',
                  }}>
                    {/* Format selector (admin) */}
                    {isAdmin && (
                      <div style={{ marginBottom: 'var(--s-2)' }}>
                        <select
                          value={ms.formatKey}
                          onChange={e => saveFormat(ms.matchId, ri, mi, e.target.value)}
                          style={{ fontSize: 11, padding: '3px 6px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--mute)' }}
                        >
                          {gameFormats.map(f => <option key={f.key} value={f.key}>{f.name}</option>)}
                        </select>
                      </div>
                    )}
                    {!isAdmin && (
                      <div style={{ fontSize: 11, color: 'var(--mute)', marginBottom: 'var(--s-1)', fontWeight: 500 }}>{format.name}</div>
                    )}

                    {/* Player slots */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--s-2)', alignItems: 'center' }}>
                      {/* Murray pair */}
                      <div>
                        {isAdmin ? (
                          <div className="stack-xs">
                            <PlayerSlot
                              value={ms.murrayA}
                              players={murrayPlayers}
                              isDupe={murrayDupes.has(ms.murrayA)}
                              ch={chM1}
                              onChange={id => setMatch(ri, mi, m => ({ ...m, murrayA: id }))}
                            />
                            <PlayerSlot
                              value={ms.murrayB}
                              players={murrayPlayers}
                              isDupe={murrayDupes.has(ms.murrayB)}
                              ch={chM2}
                              onChange={id => setMatch(ri, mi, m => ({ ...m, murrayB: id }))}
                            />
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--green)', fontWeight: 500 }}>
                              <PlayerChip player={pM1} ch={chM1} />
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--green)', fontWeight: 500 }}>
                              <PlayerChip player={pM2} ch={chM2} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Score or vs badge */}
                      <div style={{ textAlign: 'center' }}>
                        <span className={`chip ${isFinal ? (Number(matchRow?.murray_points ?? 0) > Number(matchRow?.harris_points ?? 0) ? 'chip-success' : Number(matchRow?.harris_points ?? 0) > Number(matchRow?.murray_points ?? 0) ? 'chip-danger' : 'chip-gilt') : isLive ? 'chip-danger' : 'chip-neutral'}`} style={{ fontSize: '0.7rem' }}>
                          {isFinal ? `${matchRow!.murray_points}–${matchRow!.harris_points}` : isLive ? 'LIVE' : 'vs'}
                        </span>
                      </div>

                      {/* Harris pair */}
                      <div style={{ textAlign: 'right' }}>
                        {isAdmin ? (
                          <div className="stack-xs" style={{ alignItems: 'flex-end' }}>
                            <PlayerSlot
                              value={ms.harrisA}
                              players={harrisPlayers}
                              isDupe={harrisDupes.has(ms.harrisA)}
                              ch={chH1}
                              onChange={id => setMatch(ri, mi, m => ({ ...m, harrisA: id }))}
                            />
                            <PlayerSlot
                              value={ms.harrisB}
                              players={harrisPlayers}
                              isDupe={harrisDupes.has(ms.harrisB)}
                              ch={chH2}
                              onChange={id => setMatch(ri, mi, m => ({ ...m, harrisB: id }))}
                            />
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--rail-portrush)', fontWeight: 500 }}>
                              <PlayerChip player={pH1} ch={chH1} rtl />
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--rail-portrush)', fontWeight: 500 }}>
                              <PlayerChip player={pH2} ch={chH2} rtl />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Strokes summary */}
                    {strokesSummary && (
                      <div style={{ marginTop: 'var(--s-2)', fontSize: 11, color: 'var(--mute)', borderTop: '1px solid var(--border-soft)', paddingTop: 'var(--s-2)' }}>
                        {strokesSummary}
                        {strokeHoleList && (
                          <span style={{ marginLeft: 6 }}>
                            · {strokeHoleList.label}: {strokeHoleList.holes.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                    {hasTee && !allCHs && (
                      <div style={{ marginTop: 'var(--s-2)', fontSize: 11, color: 'var(--mute)', fontStyle: 'italic' }}>
                        Handicap index missing for one or more players
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Admin: save pairings + dupe warning */}
            {isAdmin && (
              <div style={{ marginTop: 'var(--s-3)', display: 'flex', alignItems: 'center', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                {hasDupes && (
                  <span style={{ fontSize: 12, color: '#c84545', fontWeight: 600 }}>⚠ Duplicate player in round — resolve before saving</span>
                )}
                <button
                  onClick={() => savePairings(ri)}
                  disabled={!canSave}
                  className="btn btn-secondary btn-sm"
                >
                  {rs.saving ? 'Saving…' : 'Save Pairings'}
                </button>
              </div>
            )}

            {/* Score link */}
            <Link href={`/match/${round.id}`} className="btn btn-primary btn-block btn-sm" style={{ marginTop: 'var(--s-3)' }}>
              {roundMatchData.some(m => m.status === 'live') ? '⚡ Live Scoring' :
                roundMatchData.some(m => m.status === 'final') ? 'View Results' : 'Score This Round'}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function PlayerChip({ player, ch, rtl }: { player?: Player; ch: number | null; rtl?: boolean }) {
  const name = player ? lastName(player) : '—';
  const badge = ch != null ? (
    <span style={{ fontSize: 10, background: 'var(--cream-dark)', borderRadius: 'var(--r-sm)', padding: '1px 4px', color: 'var(--mute)', fontVariantNumeric: 'tabular-nums', marginLeft: 4 }}>
      CH {ch}
    </span>
  ) : null;
  if (rtl) return <span>{badge}{name}</span>;
  return <span>{name}{badge}</span>;
}

function PlayerSlot({
  value, players, isDupe, ch, onChange,
}: {
  value: string;
  players: Player[];
  isDupe: boolean;
  ch: number | null;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          fontSize: 12, padding: '3px 6px', borderRadius: 'var(--r-sm)',
          border: `1px solid ${isDupe ? '#c84545' : 'var(--border)'}`,
          background: isDupe ? 'rgba(200,69,69,.06)' : 'var(--surface)',
          cursor: 'pointer', color: isDupe ? '#c84545' : 'inherit', minWidth: 90,
        }}
      >
        <option value="">— pick —</option>
        {players.map(p => <option key={p.id} value={p.id}>{lastName(p)}</option>)}
      </select>
      {ch != null && (
        <span style={{ fontSize: 10, color: 'var(--mute)', fontVariantNumeric: 'tabular-nums' }}>CH {ch}</span>
      )}
    </div>
  );
}
