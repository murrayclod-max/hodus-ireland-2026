'use client';

import { useState } from 'react';
import { LASS_QUEUE } from '@/lib/lass-queue';

interface Props {
  currentDayNumber?: number;
}

type Status = 'idle' | 'loading' | 'ok' | 'error';

interface BackfillResult {
  day: number;
  ok: boolean;
  error?: string;
}

export default function LassAdminPanel({ currentDayNumber }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(currentDayNumber ?? LASS_QUEUE[0].day_number);

  const [bfStatus, setBfStatus] = useState<Status>('idle');
  const [bfResults, setBfResults] = useState<BackfillResult[]>([]);

  async function regenerate() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/admin/regenerate-lass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber: selectedDay }),
      });
      const json = await res.json() as { ok?: boolean; error?: string; imageUrl?: string };
      if (!res.ok) throw new Error(json.error ?? 'Generation failed');
      setStatus('ok');
      setMessage(`Day ${selectedDay} generated successfully.`);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function backfill() {
    setBfStatus('loading');
    setBfResults([]);
    try {
      const res = await fetch('/api/admin/backfill-lass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 }),
      });
      const json = await res.json() as { ok?: boolean; generated?: number; total?: number; results?: BackfillResult[]; message?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Backfill failed');
      setBfStatus('ok');
      setBfResults(json.results ?? []);
    } catch (err) {
      setBfStatus('error');
      setBfResults([{ day: 0, ok: false, error: err instanceof Error ? err.message : 'Unknown error' }]);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
      {/* Single-day regenerate */}
      <div className="card" style={{ borderColor: 'var(--gilt)', background: 'rgba(201,162,75,0.05)' }}>
        <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>⚙️ Generate / Regenerate Single Day</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
          <select
            value={selectedDay}
            onChange={e => setSelectedDay(Number(e.target.value))}
            style={{ fontSize: 13, padding: '6px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}
          >
            {LASS_QUEUE.map(s => (
              <option key={s.day_number} value={s.day_number}>
                Day {s.day_number} — {s.profession}, Co. {s.county}
              </option>
            ))}
          </select>
          <button
            onClick={regenerate}
            disabled={status === 'loading'}
            className="btn btn-secondary btn-sm"
          >
            {status === 'loading' ? 'Generating…' : '🎨 Generate'}
          </button>
        </div>
        {message && (
          <p style={{ marginTop: 'var(--s-2)', fontSize: '0.82rem', color: status === 'error' ? '#c84545' : 'var(--green)' }}>
            {message}
          </p>
        )}
        <p className="small muted" style={{ marginTop: 'var(--s-2)' }}>
          ~15–30 s per image. Refresh the Lass page after it completes.
        </p>
      </div>

      {/* Bulk backfill */}
      <div className="card" style={{ borderColor: 'var(--gilt)', background: 'rgba(201,162,75,0.05)' }}>
        <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>🔁 Bulk Backfill (5 at a time)</p>
        <p className="small muted" style={{ marginBottom: 'var(--s-3)' }}>
          Auto-detects missing + failed days, generates the next 5. Run repeatedly until caught up.
        </p>
        <button
          onClick={backfill}
          disabled={bfStatus === 'loading'}
          className="btn btn-secondary btn-sm"
        >
          {bfStatus === 'loading' ? 'Generating 5 days… (~2 min)' : '🚀 Backfill Next 5 Missing Days'}
        </button>
        {bfResults.length > 0 && (
          <div style={{ marginTop: 'var(--s-3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {bfResults.map(r => (
              <p key={r.day} style={{ fontSize: '0.8rem', color: r.ok ? 'var(--green)' : '#c84545', margin: 0 }}>
                {r.ok ? '✓' : '✗'} Day {r.day || '?'}{r.error ? ` — ${r.error}` : ''}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
