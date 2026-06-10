'use client';

import { useMemo, useState, useCallback } from 'react';

type HistoryPoint = { date: string; value: number };

type PlayerData = {
  id: string;
  name: string;
  firstName: string;
  team: 'murray' | 'harris';
  currentIndex: number | null;
  colorIndex: number;
  history: HistoryPoint[];
};

const PERIOD_OPTIONS = [
  { id: '2y',  label: '2Y',     months: 24, rounds: null },
  { id: '1y',  label: '1Y',     months: 12, rounds: null },
  { id: '6m',  label: '6M',     months: 6,  rounds: null },
  { id: '3m',  label: '3M',     months: 3,  rounds: null },
  { id: '1m',  label: '1M',     months: 1,  rounds: null },
  { id: '20r', label: '20 Rds', months: null, rounds: 20 },
] as const;
type PeriodId = (typeof PERIOD_OPTIONS)[number]['id'];

// All colors bright enough to read on cream/white — no dark greys or browns
const PALETTE = [
  '#2196f3', // blue         (0 Dave Harris)
  '#c9a84c', // gilt         (1 Eric Strong)
  '#43a047', // green        (2 Galen Archibald)
  '#e53935', // red          (3 Jeff Pinksa)
  '#8e24aa', // purple       (4 Jim Hughes)
  '#fb8c00', // orange       (5 Joe Gulash)
  '#00acc1', // cyan         (6 Dan Murray)
  '#d81b60', // pink         (7 Jim Mitchell)
  '#00897b', // teal         (8 Lee Einhorn)  was dark steel #607d8b
  '#f4511e', // deep orange  (9 Matt Burns)   was dark brown #795548
  '#5e35b1', // deep purple  (10 Matt Hodus)
  '#7cb342', // lime green   (11 Todd Moutafian)
];

const TEAM_COLOR = { murray: '#3d9e59', harris: '#c84545' } as const;
const VALID = (v: number) => v >= -10 && v <= 54;

function formatIdx(v: number): string {
  if (v < 0) return `+${Math.abs(v).toFixed(1)}`;
  return v.toFixed(1);
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('');
}

function filterByPeriod(points: HistoryPoint[], period: PeriodId): HistoryPoint[] {
  const opt = PERIOD_OPTIONS.find(o => o.id === period)!;
  if (opt.rounds != null) return points.slice(-opt.rounds);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - opt.months!);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return points.filter(p => p.date >= cutoffStr);
}

function computeTeamSeries(players: PlayerData[], team: 'murray' | 'harris', period: PeriodId): HistoryPoint[] {
  const teamPlayers = players.filter(p => p.team === team && p.history.length > 0);
  if (!teamPlayers.length) return [];

  const allDates = [...new Set(teamPlayers.flatMap(p => p.history.map(h => h.date)))].sort();
  const current = new Map<string, number>();
  const result: HistoryPoint[] = [];

  for (const date of allDates) {
    for (const p of teamPlayers) {
      const pt = p.history.find(h => h.date === date);
      if (pt) current.set(p.id, pt.value);
    }
    const vals = [...current.values()];
    if (vals.length > 0) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      result.push({ date, value: Math.round(avg * 10) / 10 });
    }
  }

  return filterByPeriod(result, period);
}

// ── Chart ──────────────────────────────────────────────────────────────────

type Series = {
  id: string;
  label: string;
  initials: string;
  color: string;
  points: HistoryPoint[];
};

function MultiSeriesChart({ series }: { series: Series[] }) {
  const W = 900, H = 380;
  const padL = 52, padR = 48, padT = 16, padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const allPoints = series.flatMap(s => s.points);
  if (!allPoints.length) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)', fontSize: 14 }}>
        No data for this period
      </div>
    );
  }

  const allValues = allPoints.map(p => p.value);
  let yMin = Math.min(...allValues);
  let yMax = Math.max(...allValues);
  if (yMax - yMin < 2) { const mid = (yMax + yMin) / 2; yMin = mid - 1; yMax = mid + 1; }

  const allMs = allPoints.map(p => Date.parse(p.date));
  const xMin = Math.min(...allMs);
  const xMax = Math.max(...allMs);
  const xRange = xMax - xMin || 1;

  const toX = (ms: number) => padL + ((ms - xMin) / xRange) * innerW;
  const toY = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const yTicks = 5;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / yTicks);

  const monthSet = new Map<string, number>();
  for (const p of allPoints) {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthSet.has(key)) monthSet.set(key, toX(d.getTime()));
  }
  const monthLabels = [...monthSet.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, x]) => ({ x, label: `${key.split('-')[1]}/${key.split('-')[0].slice(2)}` }));
  const thinned = monthLabels.filter((_, i) => i % Math.max(1, Math.ceil(monthLabels.length / 12)) === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: '100%' }}>
      {/* y-axis grid + tick labels */}
      {yTickVals.map((v, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={toY(v)} y2={toY(v)}
            stroke="var(--border)" strokeOpacity="0.6" />
          <text x={padL - 26} y={toY(v)} fill="var(--mute)" fontSize="11"
            textAnchor="end" dominantBaseline="middle">
            {formatIdx(v)}
          </text>
        </g>
      ))}

      {/* month labels */}
      {thinned.map((m, i) => (
        <text key={i} x={m.x} y={H - 8} fill="var(--mute)" fontSize="10" textAnchor="middle">
          {m.label}
        </text>
      ))}

      {/* series lines + start/end labels */}
      {series.map(s => {
        if (s.points.length < 2) return null;
        const path = s.points.map((p, i) =>
          `${i === 0 ? 'M' : 'L'}${toX(Date.parse(p.date)).toFixed(1)},${toY(p.value).toFixed(1)}`
        ).join(' ');

        const first = s.points[0];
        const last  = s.points[s.points.length - 1];
        const firstX = toX(Date.parse(first.date));
        const firstY = toY(first.value);
        const lastX  = toX(Date.parse(last.date));
        const lastY  = toY(last.value);

        return (
          <g key={s.id}>
            <path d={path} fill="none" stroke={s.color} strokeWidth="2.2"
              strokeLinejoin="round" strokeLinecap="round" />

            {/* start dot + initials label (left of line) */}
            <circle cx={firstX} cy={firstY} r="3" fill={s.color} />
            <text
              x={firstX - 5}
              y={firstY}
              fill={s.color}
              fontSize="10"
              textAnchor="end"
              dominantBaseline="middle"
              fontFamily="var(--font-sans)"
              fontWeight="700"
              letterSpacing="0.02em"
            >
              {s.initials}
            </text>

            {/* end dot + value label (right of line) */}
            <circle cx={lastX} cy={lastY} r="3.5" fill={s.color} />
            <text
              x={lastX + 6}
              y={lastY}
              fill={s.color}
              fontSize="10"
              dominantBaseline="middle"
              fontFamily="var(--font-sans)"
              fontWeight="600"
            >
              {formatIdx(last.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Controls ───────────────────────────────────────────────────────────────

function Pill({ label, active, color, onClick }: {
  label: string; active: boolean; color?: string; onClick: () => void;
}) {
  const bg = active ? (color ?? 'var(--ink)') : 'transparent';
  const border = active ? (color ?? 'var(--ink)') : 'var(--border)';
  return (
    <button onClick={onClick} style={{
      padding: '4px 12px', borderRadius: 99,
      border: `1px solid ${border}`, background: bg,
      color: active ? '#fff' : 'var(--mute)',
      fontSize: 12, fontFamily: 'var(--font-sans)',
      fontWeight: active ? 600 : 400,
      letterSpacing: '0.04em', cursor: 'pointer',
      transition: 'all 0.12s', whiteSpace: 'nowrap',
    }}>
      {label}
    </button>
  );
}

function SegmentedControl({ value, onChange }: {
  value: 'teams' | 'players'; onChange: (v: 'teams' | 'players') => void;
}) {
  const opts: { id: 'teams' | 'players'; label: string }[] = [
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
  ];
  return (
    <div style={{
      display: 'inline-flex', borderRadius: 8,
      border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--white)',
    }}>
      {opts.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          padding: '6px 20px',
          background: value === o.id ? 'var(--ink)' : 'transparent',
          color: value === o.id ? '#fff' : 'var(--mute)',
          border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 13,
          fontWeight: value === o.id ? 600 : 400,
          letterSpacing: '0.04em', transition: 'all 0.12s',
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Legend ─────────────────────────────────────────────────────────────────

function TeamLegend({ players }: { players: PlayerData[] }) {
  return (
    <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
      {(['murray', 'harris'] as const).map(team => (
        <div key={team} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 3, borderRadius: 2, background: TEAM_COLOR[team] }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: TEAM_COLOR[team], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Team {team.charAt(0).toUpperCase() + team.slice(1)}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--font-sans)' }}>
            {players.filter(p => p.team === team).map(p => p.name.split(' ').pop()).join(' · ')}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

type RecentRound = {
  playerName: string;
  datePlayed: string;
  courseName: string;
  grossScore: number;
  indexDelta: number | null;
};

function formatRoundDate(d: string): string {
  const [, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[Number(m) - 1]} ${Number(day)}`;
}

export default function TrendsClient({ players, recentRounds = [], isAdmin = false }: { players: PlayerData[]; recentRounds?: RecentRound[]; isAdmin?: boolean }) {
  const [view, setView] = useState<'teams' | 'players'>('teams');
  const [period, setPeriod] = useState<PeriodId>('2y');
  const [activePlayers, setActivePlayers] = useState<Set<string>>(
    () => new Set(players.map(p => p.id))
  );
  const [ghinStatus, setGhinStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [ghinMsg, setGhinMsg] = useState('');

  const refreshGhin = useCallback(async () => {
    setGhinStatus('loading');
    setGhinMsg('');
    try {
      const res = await fetch('/api/ghin/refresh', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setGhinMsg(`Updated ${json.results?.length ?? 0} players — reload to see rounds`);
        setGhinStatus('done');
      } else {
        setGhinMsg(json.error ?? 'Failed');
        setGhinStatus('error');
      }
    } catch {
      setGhinMsg('Network error');
      setGhinStatus('error');
    }
  }, []);

  // Strip any bad values that slipped through before server-side guard existed
  const cleanPlayers = useMemo(() =>
    players.map(p => ({ ...p, history: p.history.filter(h => VALID(h.value)) })),
    [players]
  );

  function togglePlayer(id: string) {
    setActivePlayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  }

  const series = useMemo<Series[]>(() => {
    if (view === 'teams') {
      return [
        { id: 'murray', label: 'Team Murray', initials: 'MUR', color: TEAM_COLOR.murray,
          points: computeTeamSeries(cleanPlayers, 'murray', period) },
        { id: 'harris', label: 'Team Harris', initials: 'HAR', color: TEAM_COLOR.harris,
          points: computeTeamSeries(cleanPlayers, 'harris', period) },
      ].filter(s => s.points.length > 0);
    }

    return cleanPlayers
      .filter(p => activePlayers.has(p.id) && p.history.length > 0)
      .map(p => ({
        id: p.id,
        label: p.name,
        initials: getInitials(p.name),
        color: PALETTE[p.colorIndex % PALETTE.length],
        points: filterByPeriod(p.history, period),
      }))
      .filter(s => s.points.length > 0);
  }, [view, period, activePlayers, cleanPlayers]);

  return (
    <div className="stack-lg">
      <div className="board">
        <div className="board-title" style={{ paddingTop: 20, paddingBottom: 16 }}>
          Index Trends
        </div>

        <div style={{ padding: '0 var(--s-5) var(--s-5)' }}>
          {/* Controls */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SegmentedControl value={view} onChange={setView} />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {PERIOD_OPTIONS.map(o => (
                <Pill key={o.id} label={o.label} active={period === o.id}
                  color="var(--gilt)" onClick={() => setPeriod(o.id)} />
              ))}
            </div>
          </div>

          {/* Chart */}
          <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', overflow: 'hidden', background: 'var(--white)' }}>
            <MultiSeriesChart series={series} />
          </div>

          {/* Legend / toggles */}
          {view === 'teams' ? (
            <TeamLegend players={cleanPlayers} />
          ) : (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
                Toggle players
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cleanPlayers.map(p => {
                  const active = activePlayers.has(p.id);
                  const color = PALETTE[p.colorIndex % PALETTE.length];
                  const hasData = p.history.length > 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => hasData && togglePlayer(p.id)}
                      disabled={!hasData}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 10px', borderRadius: 99,
                        border: `1px solid ${active && hasData ? color : 'var(--border)'}`,
                        background: active && hasData ? color + '18' : 'transparent',
                        color: active && hasData ? color : 'var(--mute)',
                        cursor: hasData ? 'pointer' : 'default',
                        fontSize: 12, fontFamily: 'var(--font-sans)',
                        fontWeight: active ? 600 : 400,
                        opacity: hasData ? 1 : 0.4,
                        transition: 'all 0.12s',
                      }}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: active && hasData ? color : 'var(--border)',
                        flexShrink: 0, display: 'inline-block',
                      }} />
                      {p.name.split(' ').pop()}
                      {p.currentIndex != null && (
                        <span style={{ fontSize: 10, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>
                          {formatIdx(p.currentIndex)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Rounds */}
      {(recentRounds.length > 0 || isAdmin) && (
        <div className="board">
          <div className="board-title" style={{ paddingTop: 20, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Recent Rounds</span>
            {isAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <button
                  onClick={refreshGhin}
                  disabled={ghinStatus === 'loading'}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  {ghinStatus === 'loading' ? 'Refreshing…' : '↻ Refresh GHIN'}
                </button>
                {ghinMsg && (
                  <span style={{ fontSize: '0.7rem', color: ghinStatus === 'error' ? '#c0392b' : 'var(--green)' }}>
                    {ghinMsg}
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={{ padding: '0 var(--s-5) var(--s-5)' }}>
            {recentRounds.length === 0 && (
              <p className="muted small" style={{ paddingBottom: 8 }}>
                No rounds yet — hit Refresh GHIN to load data.
              </p>
            )}
            <div className="stack-xs">
              {recentRounds.map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: i < recentRounds.length - 1 ? '1px solid var(--border-soft)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
                      {r.playerName}
                    </span>
                    <span style={{ color: 'var(--mute)', fontSize: '0.85rem' }}>
                      {r.courseName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
                      {r.grossScore}
                    </span>
                    {r.indexDelta != null && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: r.indexDelta >= 0 ? 'var(--green, #2d7a3a)' : '#c0392b',
                        minWidth: 36,
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {r.indexDelta >= 0 ? '+' : ''}{r.indexDelta.toFixed(1)}
                      </span>
                    )}
                    <span style={{ color: 'var(--mute)', fontSize: '0.75rem', minWidth: 44, textAlign: 'right' }}>
                      {formatRoundDate(r.datePlayed)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
