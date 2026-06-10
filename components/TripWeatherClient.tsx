'use client';

import { useEffect, useState } from 'react';
import type { WeatherResponse } from '@/app/api/weather/route';

interface DaySlot {
  date: string;       // YYYY-MM-DD
  label: string;      // e.g. "Sat, Sep 12"
  slug: string;       // course slug for location
  locationName: string;
  roundLabel?: string; // e.g. "Round 1 — Royal County Down"
}

interface Props {
  days: DaySlot[];
}

function WindArrow({ dir }: { dir: string }) {
  const map: Record<string, string> = {
    N: '↓', NNE: '↓', NE: '↙', ENE: '←', E: '←', ESE: '←',
    SE: '↖', SSE: '↑', S: '↑', SSW: '↑', SW: '↗', WSW: '→',
    W: '→', WNW: '→', NW: '↘', NNW: '↓',
  };
  return <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.6 }}>{map[dir] ?? '→'}</span>;
}

function DayWeather({ day }: { day: DaySlot }) {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ slug: day.slug, date: day.date, mode: 'day' });
    fetch(`/api/weather?${params}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [day.slug, day.date]);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Day header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--cream-dark)',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>{day.label}</div>
          {day.roundLabel ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: 600, marginTop: 1 }}>{day.roundLabel}</div>
          ) : (
            <div style={{ fontSize: '0.72rem', color: 'var(--mute)', marginTop: 1 }}>{day.locationName}</div>
          )}
        </div>
        {data && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
            <span style={{ fontWeight: 700 }}>{data.lowF}°</span>
            <span style={{ color: 'var(--mute)' }}>–</span>
            <span style={{ fontWeight: 700, color: '#b84a00' }}>{data.highF}°F</span>
            {data.source === 'historical' && (
              <span style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em',
                color: 'var(--mute)', background: 'var(--border)', borderRadius: 4,
                padding: '2px 5px', textTransform: 'uppercase',
              }}>Avg</span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '16px 14px', textAlign: 'center', color: 'var(--mute)', fontSize: '0.8rem' }}>
          Loading…
        </div>
      ) : !data ? (
        <div style={{ padding: '10px 14px', color: 'var(--mute)', fontSize: '0.8rem' }}>Unavailable</div>
      ) : (
        <>
          {data.source === 'historical' && (
            <div style={{
              padding: '5px 14px',
              background: 'rgba(201,162,75,0.07)',
              borderBottom: '1px solid rgba(201,162,75,0.18)',
              fontSize: '0.68rem', color: '#7a5c10',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span>📊</span> Historical September averages
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--cream-dark)', borderBottom: '1px solid var(--border)' }}>
                  {['Time', 'Temp', '', 'Wind', 'Gusts', 'Rain'].map((h, i) => (
                    <th key={i} style={{
                      padding: '5px 8px', fontFamily: 'var(--font-sans)',
                      fontWeight: 600, fontSize: '0.62rem', letterSpacing: '0.07em',
                      textTransform: 'uppercase', color: 'var(--mute)',
                      textAlign: i <= 2 ? 'left' : 'right', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.hours.map((row, i) => {
                  const isHighWind = row.windMph >= 20;
                  const isGust = row.gustMph >= 30;
                  const isRainy = row.precipPct >= 50;
                  return (
                    <tr key={i} style={{ borderBottom: i < data.hours.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                      <td style={{ padding: '7px 8px', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--mute)' }}>{row.hour}</td>
                      <td style={{
                        padding: '7px 8px',
                        fontVariantNumeric: 'tabular-nums', fontWeight: 700,
                        color: row.tempF >= 62 ? '#b84a00' : row.tempF <= 50 ? '#0050a0' : 'var(--ink)',
                        whiteSpace: 'nowrap',
                      }}>{row.tempF}°F</td>
                      <td style={{ padding: '7px 8px', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
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
          <div style={{ padding: '4px 14px 6px', fontSize: '0.62rem', color: 'var(--mute)', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: 10 }}>
            <span>Wind &amp; gusts in mph</span>
            {data.source === 'forecast' && <span>Source: Open-Meteo · updates every 30 min</span>}
          </div>
        </>
      )}
    </div>
  );
}

export default function TripWeatherClient({ days }: Props) {
  return (
    <div className="stack-sm">
      {days.map(day => <DayWeather key={day.date} day={day} />)}
    </div>
  );
}
