'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setStatus('saving');
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setStatus('error');
      setError(err.message);
      return;
    }
    setStatus('done');
    setTimeout(() => router.replace('/'), 2000);
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--green)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--s-4)',
    }}>
      <div className="card card-lg" style={{ width: '100%', maxWidth: 400 }}>
        <div className="center" style={{ marginBottom: 'var(--s-5)' }}>
          <Lock size={36} color="var(--gilt)" style={{ marginBottom: 'var(--s-3)' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>Set new password</h1>
          <p className="muted small" style={{ marginTop: 4 }}>Hodus 2026</p>
        </div>

        {status === 'done' ? (
          <div style={{ textAlign: 'center', padding: 'var(--s-5)' }}>
            <Check size={40} color="#1a6b3a" style={{ marginBottom: 'var(--s-3)' }} />
            <p style={{ fontWeight: 600, color: '#1a6b3a' }}>Password updated!</p>
            <p className="muted small" style={{ marginTop: 4 }}>Taking you to the app…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="stack">
            <label className="field">
              New password
              <input
                className="input"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </label>
            <label className="field">
              Confirm password
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
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: 'var(--s-2)' }}
            >
              <Lock size={18} aria-hidden />
              {status === 'saving' ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
