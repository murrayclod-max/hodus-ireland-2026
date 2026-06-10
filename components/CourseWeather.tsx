'use client';

import { useEffect, useState } from 'react';
import type { WeatherResponse } from '@/app/api/weather/route';

interface Props {
  slug: string;
  rounds: Array<{
    id: string;
    round_no: number;
    play_date: string;   // 'YYYY-MM-DD'
    tee_time: string;    // 'HH:MM' or '8:00 AM'
    in_competition: boolean;
  }>;
}

function WindArrow({ dir }: { dir: string }) {
  const map: Record<string, string> = {
    N: '↓', NNE: '↓', NE: '↙', ENE: '←', E: '←', ESE: '←',
    SE: '↖', SSE: '↑', S: '↑', SSW: '↑', SW: '↗', WSW: '→',
    W: '→', WNW: '→', NW: '↘', NNW: '↓',
  };
  return <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>{map[dir] ?? '→'}</span>;
}

function RoundWeather({ slug, round }: { slug: string; round: Props['rounds'][0] }) {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ slug, date: round.play_date, teeTime: round.tee_time });
    fetch(`/api/weather?${params}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [slug, round.play_date, round.tee_time]);

  const label = round.in_competition ? `Round ${round.round_no}` : 'Appetizer';
  const playDate = new Date(round.play_date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--cream-dark)',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="chip chip-neutral" style={{ fontSize: '0.68rem' }}>{label}</span>
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{playDate}</span>
        </div>
        {data && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
            <span style={{ fontWeight: 700 }}>{data.lowF}°</span>
            <span style={{ color: 'var(--mute)' }}>–</span>
            <span style={{ fontWeight: 700, color: '#b84a00' }}>{data.highF}°F</span>
            {data.source === 'historical' && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em',
                color: 'var(--mute)', background: 'var(--border)', borderRadius: 4,
                padding: '2px 5px', textTransform: 'uppercase',
              }}>Avg</span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--mute)', fontSize: '0.82rem' }}>
          Loading forecast…
        </div>
      ) : !data ? (
        <div style={{ padding: '14px', color: 'var(--mute)', fontSize: '0.82rem' }}>
          Weather unavailable
        </div>
      ) : (
        <>
          {data.source === 'historical' && (
            <div style={{
              padding: '6px 14px',
              background: 'rgba(201,162,75,0.08)',
              borderBottom: '1px solid rgba(201,162,75,0.2)',
              fontSize: '0.72rem', color: '#7a5c10',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>📊</span>
              Historical September averages — live forecast available ~14 days before play
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--cream-dark)', borderBottom: '1px solid var(--border)' }}>
                  {['Time', 'Temp', 'Conditions', 'Wind', 'Gusts', 'Rain'].map(h => (
                    <th key={h} style={{
                      padding: '5px 8px', fontFamily: 'var(--font-sans)',
                      fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.07em',
                      textTransform: 'uppercase', color: 'var(--mute)',
                      textAlign: h === 'Time' || h === 'Conditions' ? 'left' : 'right',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.hours.map((row, i) => {
                  const isTeeRow = row.hour.includes('⛳');
                  const isHighWind = row.windMph >= 20;
                  const isGust = row.gustMph >= 30;
                  const isRainy = row.precipPct >= 50;
                  return (
                    <tr key={i} style={{
                      borderBottom: i < data.hours.length - 1 ? '1px solid var(--border-soft)' : 'none',
                      background: isTeeRow ? 'rgba(14,59,46,0.06)' : 'transparent',
                    }}>
                      <td style={{
                        padding: '7px 8px', fontWeight: isTeeRow ? 700 : 500,
                        whiteSpace: 'nowrap', color: isTeeRow ? 'var(--green)' : 'var(--ink)',
                        fontSize: '0.8rem',
                      }}>{row.hour}</td>
                      <td style={{
                        padding: '7px 8px', textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                        color: row.tempF >= 62 ? '#b84a00' : row.tempF <= 50 ? '#0050a0' : 'var(--ink)',
                      }}>{row.tempF}°</td>
                      <td style={{ padding: '7px 8px', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                        {row.icon} {row.condition}
                      </td>
                      <td style={{
                        padding: '7px 8px', textAlign: 'right', whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                        color: isHighWind ? '#8a4800' : 'var(--ink)',
                        fontWeight: isHighWind ? 700 : 400,
                      }}>
                        <WindArrow dir={row.windDir} /> {row.windDir} {row.windMph}
                      </td>
                      <td style={{
                        padding: '7px 8px', textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        color: isGust ? '#a03000' : 'var(--mute)',
                        fontWeight: isGust ? 700 : 400,
                      }}>{row.gustMph}</td>
                      <td style={{
                        padding: '7px 8px', textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        color: isRainy ? '#0050a0' : 'var(--mute)',
                        fontWeight: isRainy ? 700 : 400,
                      }}>{row.precipPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: '5px 14px 7px',
            fontSize: '0.65rem', color: 'var(--mute)',
            borderTop: '1px solid var(--border-soft)',
            display: 'flex', gap: 12,
          }}>
            <span>⛳ = tee time</span>
            <span>Wind &amp; gusts in mph</span>
            {data.source === 'forecast' && <span>Source: Open-Meteo · updates every 30 min</span>}
          </div>
        </>
      )}
    </div>
  );
}

export default function CourseWeather({ slug, rounds }: Props) {
  if (rounds.length === 0) return null;
  return (
    <div>
      <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Weather Forecast</p>
      <div className="stack-sm">
        {rounds.map(r => <RoundWeather key={r.id} slug={slug} round={r} />)}
      </div>
    </div>
  );
}
