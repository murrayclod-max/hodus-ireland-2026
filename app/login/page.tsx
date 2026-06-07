'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Flag, Mail, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function safeNext(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));

  const [mode, setMode] = useState<'login' | 'forgot' | 'forgot-sent'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (err) {
      setStatus('error');
      setError(err.message);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );
    if (err) {
      setStatus('error');
      setError(err.message);
      return;
    }
    setStatus('idle');
    setMode('forgot-sent');
  }

  if (mode === 'forgot' || mode === 'forgot-sent') {
    return (
      <div className="stack" style={{ marginTop: 'var(--s-6)' }}>
        <button
          onClick={() => { setMode('login'); setStatus('idle'); setError(null); }}
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: 'flex-start', padding: '4px 0', minHeight: 'auto' }}
        >
          <ArrowLeft size={14} /> Back to sign in
        </button>

        {mode === 'forgot-sent' ? (
          <div style={{ textAlign: 'center', padding: 'var(--s-4)', background: '#e6f5ee', borderRadius: 'var(--r-lg)' }}>
            <Mail size={32} color="#1a6b3a" style={{ marginBottom: 'var(--s-2)' }} />
            <p style={{ fontWeight: 600, color: '#1a6b3a' }}>Check your email</p>
            <p className="muted small" style={{ marginTop: 4 }}>
              Sent a reset link to <strong>{email}</strong>.<br />
              Click the link in the email to set a new password.
            </p>
          </div>
        ) : (
          <form onSubmit={sendReset} className="stack">
            <p className="muted small">Enter your email and we&apos;ll send you a link to reset your password.</p>
            <label className="field">
              Your email
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
                inputMode="email"
                placeholder="you@example.com"
                autoFocus
              />
            </label>
            {error && (
              <p style={{ color: '#c0392b', fontSize: '0.85rem', background: '#fde8e6', padding: '10px 12px', borderRadius: 'var(--r-md)' }} role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="btn btn-primary btn-block"
            >
              <Mail size={16} aria-hidden />
              {status === 'sending' ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={signIn} className="stack" style={{ marginTop: 'var(--s-6)' }}>
      <label className="field">
        Your email
        <input
          className="input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          inputMode="email"
          placeholder="you@example.com"
        />
      </label>
      <label className="field">
        Password
        <input
          className="input"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Trip password"
        />
      </label>
      <div style={{ textAlign: 'right', marginTop: -4 }}>
        <button
          type="button"
          onClick={() => { setMode('forgot'); setStatus('idle'); setError(null); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', fontSize: '0.82rem', padding: 0 }}
        >
          Forgot password?
        </button>
      </div>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="btn btn-primary btn-block btn-lg"
        style={{ marginTop: 'var(--s-2)' }}
      >
        <LogIn size={18} aria-hidden />
        {status === 'sending' ? 'Signing in…' : 'Sign in'}
      </button>
      {error && (
        <p style={{ color: '#c0392b', fontSize: '0.85rem', background: '#fde8e6', padding: '10px 12px', borderRadius: 'var(--r-md)' }} role="alert">
          {error}
        </p>
      )}
      <p className="center muted small" style={{ marginTop: 'var(--s-2)' }}>
        Private trip app for the 12 lads. Contact Dan if you need access.
      </p>
    </form>
  );
}

export default function LoginPage() {
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
        <div className="center stack-sm" style={{ marginBottom: 'var(--s-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--s-3)' }}>
            <Flag size={40} color="var(--gilt)" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)' }}>
            Hodus 2026
          </h1>
          <p className="muted small">Northern Ireland &amp; Donegal · Sept 13–20</p>
        </div>
        <Suspense fallback={<div style={{ height: 200 }} />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
