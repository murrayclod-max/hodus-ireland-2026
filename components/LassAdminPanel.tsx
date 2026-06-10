'use client';

import { useState } from 'react';
import { LASS_QUEUE } from '@/lib/lass-queue';

interface Props {
  currentDayNumber?: number;
}

export default function LassAdminPanel({ currentDayNumber }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(currentDayNumber ?? LASS_QUEUE[0].day_number);

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

  return (
    <div className="card" style={{ borderColor: 'var(--gilt)', background: 'rgba(201,162,75,0.05)' }}>
      <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>⚙️ Lass of the Day — Admin</p>
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
          {status === 'loading' ? 'Generating…' : '🎨 Generate / Regenerate'}
        </button>
      </div>
      {message && (
        <p style={{ marginTop: 'var(--s-2)', fontSize: '0.82rem', color: status === 'error' ? '#c84545' : 'var(--green)' }}>
          {message}
        </p>
      )}
      <p className="small muted" style={{ marginTop: 'var(--s-2)' }}>
        Generation takes ~15–30 s. Refresh the Lass page after it completes.
      </p>
    </div>
  );
}
