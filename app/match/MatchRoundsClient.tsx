'use client';

import { useState } from 'react';
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
  murrayPairingId: string;
  murrayA: string;
  murrayB: string;
  harrisPairingId: string;
  harrisA: string;
  harrisB: string;
}

// Format key is now per-round (all matches in a round share the same format)
interface RoundState {
  selectedTee: string;
  formatKey: string;
  matches: MatchState[];
  saving: boolean;
}

function lastName(p: Player | undefined): string {
  if (!p) return '—';
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

      // All matches in a round share a format — take it from the first match
      const roundFormat = rms[0]?.game_format_key ?? 'fourball';

      return {
        selectedTee: round.selected_tee ?? '',
        formatKey: roundFormat,
        saving: false,
        matches: rms.map(m => {
          const mp = allPairings.find(p => p.id === m.murray_pairing_id);
          const hp = allPairings.find(p => p.id === m.harris_pairing_id);
          return {
            matchId: m.id,
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

  function setMatchField(ri: number, mi: number, field: keyof MatchState, val: string) {
    setRound(ri, rs => ({
      ...rs,
      matches: rs.matches.map((m, i) => i === mi ? { ...m, [field]: val } : m),
    }));
  }

  const supabase = createClient();

  async function saveTee(roundId: string, ri: number, tee: string) {
    setRound(ri, rs => ({ ...rs, selectedTee: tee }));
    await supabase.from('rounds').update({ selected_tee: tee || null }).eq('id', roundId);
    router.refresh();
  }

  // Format change applies to all matches in the round at once
  async function saveRoundFormat(ri: number, key: string) {
    const rs = roundStates[ri];
    setRound(ri, r => ({ ...r, formatKey: key }));
    await Promise.all(
      rs.matches.map(ms => supabase.from('matches').update({ game_format_key: key }).eq('id', ms.matchId))
    );
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

  // Duplicate check: within a round, each player should appear at most once across all pairings
  function duplicateSet(rs: RoundState): Set<string> {
    const ids = rs.matches.flatMap(ms => [ms.murrayA, ms.murrayB, ms.harrisA, ms.harrisB]).filter(Boolean);
    const seen = new Set<string>(), dupes = new Set<string>();
    ids.forEach(id => { if (seen.has(id)) dupes.add(id); else seen.add(id); });
    return dupes;
  }

  function hasUnfilled(rs: RoundState) {
    return rs.matches.some(ms => !ms.murrayA || !ms.murrayB || !ms.harrisA || !ms.harrisB);
  }

  const murrayPlayers = allPlayers.filter(p => p.team === 'murray');
  const harrisPlayers = allPlayers.filter(p => p.team === 'harris');

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

        const dupes = isAdmin ? duplicateSet(rs) : new Set<string>();
        const hasDupes = dupes.size > 0;
        const canSave = !hasDupes && !hasUnfilled(rs) && !rs.saving;

        const format = findFormat(rs.formatKey);

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                {hasScore && (
                  <span>
                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>{rMurray}</span>
                    <span className="muted"> – </span>
                    <span style={{ color: 'var(--rail-portrush)', fontWeight: 700 }}>{rHarris}</span>
                  </span>
                )}
                {/* Tee selector — admin */}
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

            {/* Format — one per round */}
            <div style={{ marginBottom: 'var(--s-3)', display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
              {isAdmin ? (
                <select
                  value={rs.formatKey}
                  onChange={e => saveRoundFormat(ri, e.target.value)}
                  style={{ fontSize: 12, padding: '4px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}
                >
                  {gameFormats.map(f => <option key={f.key} value={f.key}>{f.name}</option>)}
                </select>
              ) : (
                <span className="chip chip-neutral" style={{ fontSize: 11 }}>{format?.name ?? rs.formatKey}</span>
              )}
              {!hasTee && (
                <span style={{ fontSize: 12, color: 'var(--mute)', fontStyle: 'italic' }}>
                  {isAdmin ? '⚠ Select tee to enable handicaps' : '⚠ Tee pending'}
                </span>
              )}
            </div>

            {/* Matches */}
            <div className="stack-sm">
              {rs.matches.map((ms, mi) => {
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
                let strokeHoleList: { holes: number[] } | null = null;

                if (allCHs) {
                  const params = format?.params ?? { pct: 90 };
                  if (rs.formatKey === 'fourball') {
                    const s = fourballStrokes(chM1!, chM2!, chH1!, chH2!, (params.pct as number) ?? 90);
                    const parts = [
                      s.m1 > 0 ? `${lastName(pM1)} +${s.m1}` : null,
                      s.m2 > 0 ? `${lastName(pM2)} +${s.m2}` : null,
                      s.h1 > 0 ? `${lastName(pH1)} +${s.h1}` : null,
                      s.h2 > 0 ? `${lastName(pH2)} +${s.h2}` : null,
                    ].filter(Boolean);
                    strokesSummary = parts.length ? parts.join(' · ') : 'Level — no strokes';
                    const maxS = Math.max(s.m1, s.m2, s.h1, s.h2);
                    if (teeObj?.si && maxS > 0) strokeHoleList = { holes: strokeHoles(teeObj.si, maxS) };
                  } else {
                    const res = combinedMatchStrokes(chM1!, chM2!, chH1!, chH2!, params as Record<string, number>);
                    const recv = res.receiver === 'murray' ? 'Murray' : res.receiver === 'harris' ? 'Harris' : null;
                    strokesSummary = recv
                      ? `Team ${recv} +${res.strokes} · Murray PH ${res.murrayPH} · Harris PH ${res.harrisPH}`
                      : `Level · Murray PH ${res.murrayPH} · Harris PH ${res.harrisPH}`;
                    if (teeObj?.si && res.strokes > 0) strokeHoleList = { holes: strokeHoles(teeObj.si, res.strokes) };
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
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--s-2)', alignItems: 'center' }}>

                      {/* Murray pair */}
                      <div>
                        {isAdmin ? (
                          <div className="stack-xs">
                            <PlayerSlot value={ms.murrayA} allPlayers={allPlayers} isDupe={dupes.has(ms.murrayA)} ch={chM1}
                              onChange={id => setMatchField(ri, mi, 'murrayA', id)} murrayFirst />
                            <PlayerSlot value={ms.murrayB} allPlayers={allPlayers} isDupe={dupes.has(ms.murrayB)} ch={chM2}
                              onChange={id => setMatchField(ri, mi, 'murrayB', id)} murrayFirst />
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

                      {/* Score or vs */}
                      <div style={{ textAlign: 'center' }}>
                        <span className={`chip ${isFinal
                          ? (Number(matchRow!.murray_points) > Number(matchRow!.harris_points) ? 'chip-success' : Number(matchRow!.harris_points) > Number(matchRow!.murray_points) ? 'chip-danger' : 'chip-gilt')
                          : isLive ? 'chip-danger' : 'chip-neutral'}`} style={{ fontSize: '0.7rem' }}>
                          {isFinal ? `${matchRow!.murray_points}–${matchRow!.harris_points}` : isLive ? 'LIVE' : 'vs'}
                        </span>
                      </div>

                      {/* Harris pair */}
                      <div style={{ textAlign: 'right' }}>
                        {isAdmin ? (
                          <div className="stack-xs" style={{ alignItems: 'flex-end' }}>
                            <PlayerSlot value={ms.harrisA} allPlayers={allPlayers} isDupe={dupes.has(ms.harrisA)} ch={chH1}
                              onChange={id => setMatchField(ri, mi, 'harrisA', id)} />
                            <PlayerSlot value={ms.harrisB} allPlayers={allPlayers} isDupe={dupes.has(ms.harrisB)} ch={chH2}
                              onChange={id => setMatchField(ri, mi, 'harrisB', id)} />
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--rail-portrush)', fontWeight: 500, textAlign: 'right' }}>
                              <PlayerChip player={pH1} ch={chH1} rtl />
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--rail-portrush)', fontWeight: 500, textAlign: 'right' }}>
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
                        {strokeHoleList && strokeHoleList.holes.length > 0 && (
                          <span style={{ marginLeft: 6 }}>· holes {strokeHoleList.holes.join(', ')}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Admin: save pairings */}
            {isAdmin && (
              <div style={{ marginTop: 'var(--s-3)', display: 'flex', alignItems: 'center', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                {hasDupes && (
                  <span style={{ fontSize: 12, color: '#c84545', fontWeight: 600 }}>⚠ Duplicate player — resolve before saving</span>
                )}
                <button onClick={() => savePairings(ri)} disabled={!canSave} className="btn btn-secondary btn-sm">
                  {rs.saving ? 'Saving…' : 'Save Pairings'}
                </button>
              </div>
            )}

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
    <span style={{ fontSize: 10, background: 'var(--cream-dark)', borderRadius: 'var(--r-sm)', padding: '1px 4px', color: 'var(--mute)', fontVariantNumeric: 'tabular-nums', marginLeft: rtl ? 0 : 4, marginRight: rtl ? 4 : 0 }}>
      CH {ch}
    </span>
  ) : null;
  if (rtl) return <span>{badge}{name}</span>;
  return <span>{name}{badge}</span>;
}

function PlayerSlot({
  value, allPlayers, isDupe, ch, onChange, murrayFirst,
}: {
  value: string;
  allPlayers: Player[];
  isDupe: boolean;
  ch: number | null;
  onChange: (id: string) => void;
  murrayFirst?: boolean;
}) {
  const murray = allPlayers.filter(p => p.team === 'murray');
  const harris = allPlayers.filter(p => p.team === 'harris');
  const [first, second] = murrayFirst ? [murray, harris] : [harris, murray];
  const firstLabel = murrayFirst ? 'Team Murray' : 'Team Harris';
  const secondLabel = murrayFirst ? 'Team Harris' : 'Team Murray';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          fontSize: 12, padding: '3px 6px', borderRadius: 'var(--r-sm)',
          border: `1px solid ${isDupe ? '#c84545' : 'var(--border)'}`,
          background: isDupe ? 'rgba(200,69,69,.06)' : 'var(--surface)',
          cursor: 'pointer', color: isDupe ? '#c84545' : 'inherit', minWidth: 95,
        }}
      >
        <option value="">— pick —</option>
        <optgroup label={firstLabel}>
          {first.map(p => <option key={p.id} value={p.id}>{lastName(p)}</option>)}
        </optgroup>
        <optgroup label={secondLabel}>
          {second.map(p => <option key={p.id} value={p.id}>{lastName(p)}</option>)}
        </optgroup>
      </select>
      {ch != null && (
        <span style={{ fontSize: 10, color: 'var(--mute)', fontVariantNumeric: 'tabular-nums' }}>CH {ch}</span>
      )}
    </div>
  );
}
