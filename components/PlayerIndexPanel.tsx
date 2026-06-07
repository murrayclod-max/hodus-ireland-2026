'use client';

import { useMemo, useState } from 'react';

type HistoryPoint = { date: string; value: number };

const TREND_OPTIONS = [
  { id: '1w', label: '1 week',    days: 7 },
  { id: '1m', label: '1 month',   days: 30 },
  { id: '1q', label: '1 quarter', days: 90 },
  { id: '1y', label: '1 year',    days: 365 },
];

function formatIdx(v: number | null): string {
  if (v == null) return '—';
  if (v < 0) return `+${Math.abs(v).toFixed(1)}`;
  return v.toFixed(1);
}

function formatShortDate(s: string): string {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mute)', fontFamily: 'var(--font-sans)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--gilt)', lineHeight: 1.1, marginTop: 2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function TrendStat({ trend, choiceId, onChange }: {
  trend: { diff: number } | null;
  choiceId: string;
  onChange: (id: string) => void;
}) {
  const color = !trend ? 'var(--mute)'
    : trend.diff < 0 ? '#3d9e59'
    : trend.diff > 0 ? '#c84545'
    : 'var(--mute)';
  const arrow = !trend || trend.diff === 0 ? '·' : trend.diff < 0 ? '↓' : '↑';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mute)', fontFamily: 'var(--font-sans)' }}>
        Trend
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color, lineHeight: 1.1, marginTop: 2 }}>
        {trend ? `${arrow} ${Math.abs(trend.diff).toFixed(1)}` : '—'}
      </div>
      <select
        value={choiceId}
        onChange={e => onChange(e.target.value)}
        style={{
          marginTop: 4, background: 'transparent', border: 'none',
          fontSize: 10, color: 'var(--mute)', cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {TREND_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );
}

function IndexChart({ points }: { points: HistoryPoint[] }) {
  const W = 900, H = 160, padL = 32, padR = 12, padT = 12, padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const values = points.map(p => p.value);
  let yMin = Math.min(...values);
  let yMax = Math.max(...values);
  if (yMax - yMin < 2) { const mid = (yMax + yMin) / 2; yMin = mid - 1; yMax = mid + 1; }

  const dates = points.map(p => Date.parse(p.date));
  const xMin = dates[0], xMax = dates[dates.length - 1];
  const xRange = xMax - xMin || 1;

  const toX = (ms: number) => padL + ((ms - xMin) / xRange) * innerW;
  const toY = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const path = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${toX(Date.parse(p.date)).toFixed(1)},${toY(p.value).toFixed(1)}`
  ).join(' ');

  const yTicks = 4;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / yTicks);

  const monthLabels: Array<{ x: number; label: string }> = [];
  let lastMonth = '';
  for (const p of points) {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key !== lastMonth) {
      lastMonth = key;
      monthLabels.push({ x: toX(d.getTime()), label: String(d.getMonth() + 1).padStart(2, '0') });
    }
  }
  const thinned = monthLabels.filter((_, i) => i % Math.max(1, Math.ceil(monthLabels.length / 8)) === 0);
  const last = points[points.length - 1];

  return (
    <div style={{ marginTop: 16, overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: '100%', display: 'block' }}>
        {yTickVals.map((v, i) => {
          const y = toY(v);
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="var(--gilt)" strokeOpacity="0.12" />
              <text x={padL - 4} y={y} fill="var(--mute)" fontSize="10" textAnchor="end" dominantBaseline="middle">
                {formatIdx(v)}
              </text>
            </g>
          );
        })}
        {thinned.map((m, i) => (
          <text key={i} x={m.x} y={H - 6} fill="var(--mute)" fontSize="10" textAnchor="middle">{m.label}</text>
        ))}
        <path d={path} fill="none" stroke="var(--gilt)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx={toX(Date.parse(last.date))} cy={toY(last.value)} r="3" fill="var(--gilt)" />
      </svg>
    </div>
  );
}

export default function PlayerIndexPanel({
  history,
  currentIndex,
}: {
  history: HistoryPoint[];
  currentIndex: number | null;
}) {
  const [trendChoice, setTrendChoice] = useState('1m');
  const sorted = useMemo(() => [...history].sort((a, b) => a.date.localeCompare(b.date)), [history]);
  const current = currentIndex ?? sorted[sorted.length - 1]?.value ?? null;

  const high = useMemo(() => sorted.reduce<HistoryPoint | null>((h, p) => (!h || p.value > h.value) ? p : h, null), [sorted]);
  const low  = useMemo(() => sorted.reduce<HistoryPoint | null>((l, p) => (!l || p.value < l.value) ? p : l, null), [sorted]);

  const trend = useMemo(() => {
    if (current == null || !sorted.length) return null;
    const opt = TREND_OPTIONS.find(o => o.id === trendChoice) ?? TREND_OPTIONS[1];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - opt.days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    let past: HistoryPoint | null = null;
    for (const p of sorted) { if (p.date <= cutoffStr) past = p; else break; }
    if (!past) return null;
    return { diff: +(current - past.value).toFixed(1) };
  }, [sorted, current, trendChoice]);

  return (
    <div style={{ padding: '16px 20px 20px' }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stat label="Current Index" value={formatIdx(current)} />
        <Stat label="High" value={high ? formatIdx(high.value) : '—'} sub={high ? formatShortDate(high.date) : undefined} />
        <Stat label="Low"  value={low  ? formatIdx(low.value)  : '—'} sub={low  ? formatShortDate(low.date)  : undefined} />
        <TrendStat trend={trend} choiceId={trendChoice} onChange={setTrendChoice} />
      </div>
      {sorted.length > 1 && <IndexChart points={sorted} />}
    </div>
  );
}
