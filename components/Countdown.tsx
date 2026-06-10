'use client';

import { useEffect, useState } from 'react';

interface Props {
  targetDate: string;
  endDate: string;
}

interface TimeLeft {
  days: number;
  hrs: number;
  mins: number;
  state: 'countdown' | 'live' | 'over';
}

function compute(targetDate: string, endDate: string): TimeLeft {
  const now = new Date();
  const start = new Date(targetDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  if (now >= end) return { days: 0, hrs: 0, mins: 0, state: 'over' };
  if (now >= start) return { days: 0, hrs: 0, mins: 0, state: 'live' };
  const diff = start.getTime() - now.getTime();
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hrs:  Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    state: 'countdown',
  };
}

export default function Countdown({ targetDate, endDate }: Props) {
  const [t, setT] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setT(compute(targetDate, endDate));
    const id = setInterval(() => setT(compute(targetDate, endDate)), 30000);
    return () => clearInterval(id);
  }, [targetDate, endDate]);

  if (!t) return null;

  if (t.state === 'over') {
    return (
      <div style={{ textAlign: 'center', color: '#fff', padding: '20px 0' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>The trip is over. What a week. ☘️</div>
      </div>
    );
  }

  if (t.state === 'live') {
    return (
      <div style={{ textAlign: 'center', color: '#fff', padding: '20px 0' }}>
        <div style={{ fontSize: '2rem' }}>🏌️</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: 4 }}>
          We&apos;re in Ireland!
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
      {/* Label */}
      <div style={{
        color: 'rgba(255,255,255,0.65)',
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        Ireland · Sep 13, 2026
      </div>

      {/* Big number blocks */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {[
          { value: t.days,  label: 'days'  },
          { value: t.hrs,   label: 'hrs'   },
          { value: t.mins,  label: 'mins'  },
        ].map(({ value, label }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
            borderRadius: 10,
            padding: '10px 16px',
            minWidth: 64,
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.4rem',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1,
            }}>
              {String(value).padStart(2, '0')}
            </div>
            <div style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
              marginTop: 4,
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 12,
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.72rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        to tee time
      </div>
    </div>
  );
}
