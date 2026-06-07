'use client';

import { useState } from 'react';
import { Lock, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ChangePasswordForm({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { setError('New passwords do not match.'); return; }
    if (next.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setStatus('saving');
    setError(null);
    const supabase = createClient();

    // Verify current password first
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (authErr) {
      setStatus('error');
      setError('Current password is incorrect.');
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: next });
    if (updateErr) {
      setStatus('error');
      setError(updateErr.message);
      return;
    }

    setStatus('done');
    setCurrent(''); setNext(''); setConfirm('');
    setTimeout(() => { setStatus('idle'); setOpen(false); }, 2500);
  }

  return (
    <div className="card">
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
          <Lock size={16} style={{ color: 'var(--mute)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Change Password</span>
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'var(--mute)' }} /> : <ChevronDown size={16} style={{ color: 'var(--mute)' }} />}
      </button>

      {open && (
        <div style={{ marginTop: 'var(--s-4)' }}>
          {status === 'done' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', color: '#1a6b3a', padding: 'var(--s-3)', background: '#e6f5ee', borderRadius: 'var(--r-md)' }}>
              <Check size={18} />
              <span style={{ fontWeight: 600 }}>Password updated successfully.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="stack">
              <label className="field">
                Current password
                <input
                  className="input"
                  type="password"
                  required
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Your current password"
                />
              </label>
              <label className="field">
                New password
                <input
                  className="input"
                  type="password"
                  required
                  value={next}
                  onChange={e => setNext(e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
              </label>
              <label className="field">
                Confirm new password
                <input
                  className="input"
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Same again"
                />
              </label>
              {error && (
                <p style={{ color: '#c0392b', fontSize: '0.85rem', background: '#fde8e6', padding: '10px 12px', borderRadius: 'var(--r-md)' }} role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'saving'}
                className="btn btn-primary btn-block"
              >
                <Lock size={15} aria-hidden />
                {status === 'saving' ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
