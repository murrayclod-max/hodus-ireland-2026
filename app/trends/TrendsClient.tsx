'use client';

import { useMemo, useState } from 'react';

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

// Distinct colors that read well on cream background
const PALETTE = [
  '#4a7eb5', // blue
  '#c9a84c', // gilt
  '#3d9e59', // green
  '#c84545', // red
  '#9b59b6', // purple
  '#e67e22', // orange
  '#1abc9c', // teal
  '#d81b60', // pink
  '#607d8b', // steel
  '#795548', // brown
  '#00838f', // cyan
  '#558b2f', // olive
];

const TEAM_COLOR = { murray: '#3d9e59', harris: '#c84545' } as const;

function formatIdx(v: number): string {
  if (v < 0) return `+${Math.abs(v).toFixed(1)}`;
  return v.toFixed(1);
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
  color: string;
  points: HistoryPoint[];
};

function MultiSeriesChart({ series }: { series: Series[] }) {
  const W = 900, H = 380, padL = 36, padR = 16, padT = 16, padB = 30;
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
      {/* horizontal grid */}
      {yTickVals.map((v, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={toY(v)} y2={toY(v)}
            stroke="var(--border)" strokeOpacity="0.6" />
          <text x={padL - 5} y={toY(v)} fill="var(--mute)" fontSize="11"
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

      {/* series */}
      {series.map(s => {
        if (s.points.length < 2) return null;
        const d = s.points.map((p, i) =>
          `${i === 0 ? 'M' : 'L'}${toX(Date.parse(p.date)).toFixed(1)},${toY(p.value).toFixed(1)}`
        ).join(' ');
        const last = s.points[s.points.length - 1];
        return (
          <g key={s.id}>
            <path d={d} fill="none" stroke={s.color} strokeWidth="2.2"
              strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={toX(Date.parse(last.date))} cy={toY(last.value)}
              r="4" fill={s.color} />
            {/* end label */}
            <text
              x={toX(Date.parse(last.date)) + 7}
              y={toY(last.value)}
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

// ── Pills ──────────────────────────────────────────────────────────────────

function Pill({ label, active, color, onClick }: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  const bg = active ? (color ?? 'var(--ink)') : 'transparent';
  const border = active ? (color ?? 'var(--ink)') : 'var(--border)';
  const text = active ? '#fff' : 'var(--mute)';
  return (
    <button onClick={onClick} style={{
      padding: '4px 12px', borderRadius: 99,
      border: `1px solid ${border}`,
      background: bg, color: text,
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
  value: 'teams' | 'players';
  onChange: (v: 'teams' | 'players') => void;
}) {
  const opts: { id: 'teams' | 'players'; label: string }[] = [
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
  ];
  return (
    <div style={{
      display: 'inline-flex', borderRadius: 8,
      border: '1px solid var(--border)', overflow: 'hidden',
      background: 'var(--white)',
    }}>
      {opts.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          padding: '6px 20px',
          background: value === o.id ? 'var(--ink)' : 'transparent',
          color: value === o.id ? '#fff' : 'var(--mute)',
          border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 13,
          fontWeight: value === o.id ? 600 : 400,
          letterSpacing: '0.04em',
          transition: 'all 0.12s',
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Legend (teams mode) ────────────────────────────────────────────────────

function TeamLegend({ players }: { players: PlayerData[] }) {
  const byTeam = { murray: players.filter(p => p.team === 'murray'), harris: players.filter(p => p.team === 'harris') };
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
            {byTeam[team].map(p => p.firstName).join(' · ')}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function TrendsClient({ players }: { players: PlayerData[] }) {
  const [view, setView] = useState<'teams' | 'players'>('teams');
  const [period, setPeriod] = useState<PeriodId>('2y');
  const [activePlayers, setActivePlayers] = useState<Set<string>>(
    () => new Set(players.map(p => p.id))
  );

  function togglePlayer(id: string) {
    setActivePlayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id); // always keep at least one
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const series = useMemo<Series[]>(() => {
    if (view === 'teams') {
      return [
        {
          id: 'murray',
          label: 'Team Murray',
          color: TEAM_COLOR.murray,
          points: computeTeamSeries(players, 'murray', period),
        },
        {
          id: 'harris',
          label: 'Team Harris',
          color: TEAM_COLOR.harris,
          points: computeTeamSeries(players, 'harris', period),
        },
      ].filter(s => s.points.length > 0);
    }

    // Players mode
    return players
      .filter(p => activePlayers.has(p.id) && p.history.length > 0)
      .map(p => ({
        id: p.id,
        label: p.name,
        color: PALETTE[p.colorIndex % PALETTE.length],
        points: filterByPeriod(p.history, period),
      }))
      .filter(s => s.points.length > 0);
  }, [view, period, activePlayers, players]);

  return (
    <div className="stack-lg">
      <div className="board">
        {/* Header */}
        <div className="board-title" style={{ paddingTop: 20, paddingBottom: 16 }}>
          Index Trends
        </div>

        <div style={{ padding: '0 var(--s-5) var(--s-5)' }}>

          {/* Controls row */}
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
            <TeamLegend players={players} />
          ) : (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
                Toggle players
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {players.map(p => {
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
                      {p.firstName}
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
    </div>
  );
}
