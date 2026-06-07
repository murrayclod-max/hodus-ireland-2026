'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GhinRefreshButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  async function refresh() {
    setStatus('loading');
    setMsg('');
    const res = await fetch('/api/ghin/refresh', { method: 'POST' });
    const json = await res.json();
    if (res.ok) {
      const count = json.results?.length ?? 0;
      setMsg(`Updated ${count} players`);
      setStatus('done');
      router.refresh();
    } else {
      setMsg(json.error ?? 'Failed');
      setStatus('error');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        onClick={refresh}
        disabled={status === 'loading'}
        className="btn btn-secondary btn-sm"
      >
        <RefreshCw size={14} style={{ animation: status === 'loading' ? 'spin 1s linear infinite' : 'none' }} />
        {status === 'loading' ? 'Refreshing…' : 'Refresh GHIN'}
      </button>
      {msg && (
        <span className={`small ${status === 'error' ? 'alert-error' : ''}`} style={{ color: status === 'error' ? '#c0392b' : 'var(--green)' }}>
          {msg}
        </span>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
