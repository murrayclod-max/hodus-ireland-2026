'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Flag } from 'lucide-react';
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
        <p className="alert alert-error" role="alert">{error}</p>
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
        <Suspense fallback={<div className="skeleton" style={{ height: 200 }} />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
