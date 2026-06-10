'use client';

import { useState } from 'react';

interface Props {
  lassId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  userVote: 1 | -1 | null;
  size?: 'lg' | 'sm';
}

export default function LassVoting({ lassId, initialUpvotes, initialDownvotes, userVote: initialUserVote, size = 'lg' }: Props) {
  const [upvotes, setUpvotes]     = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote]   = useState<1 | -1 | null>(initialUserVote);
  const [locked, setLocked]       = useState(initialUserVote !== null); // already voted = locked
  const [loading, setLoading]     = useState(false);
  const [reveal, setReveal]       = useState(false);
  const [voters, setVoters]       = useState<{ upvoters: string[]; downvoters: string[] } | null>(null);
  const [loadingVoters, setLoadingVoters] = useState(false);

  async function vote(v: 1 | -1) {
    if (loading || locked) return;
    setLoading(true);

    // Optimistic
    setUserVote(v);
    if (v === 1) setUpvotes(u => u + 1);
    else setDownvotes(d => d + 1);

    try {
      const res = await fetch('/api/lass/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lass_id: lassId, vote: v }),
      });
      if (res.ok) {
        const data = await res.json();
        setUpvotes(data.upvotes);
        setDownvotes(data.downvotes);
        setUserVote(data.userVote);
        setLocked(true);
      } else {
        // Rollback
        setUserVote(null);
        if (v === 1) setUpvotes(u => u - 1);
        else setDownvotes(d => d - 1);
      }
    } catch {
      setUserVote(null);
      if (v === 1) setUpvotes(u => u - 1);
      else setDownvotes(d => d - 1);
    } finally {
      setLoading(false);
    }
  }

  async function toggleReveal() {
    if (!voters && !loadingVoters) {
      setLoadingVoters(true);
      try {
        const res = await fetch(`/api/lass/voters?lass_id=${lassId}`);
        if (res.ok) setVoters(await res.json());
      } finally {
        setLoadingVoters(false);
      }
    }
    setReveal(r => !r);
  }

  const isLg = size === 'lg';
  const btnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: isLg ? 6 : 4,
    border: 'none',
    borderRadius: 'var(--r-pill)',
    fontWeight: 700,
    transition: 'all 0.15s',
    padding: isLg ? '10px 20px' : '5px 10px',
    fontSize: isLg ? '1.1rem' : '0.75rem',
  };

  const totalVotes = upvotes + downvotes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isLg ? 8 : 4 }}>
      {/* Vote buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isLg ? 16 : 8 }}>
        <button
          onClick={() => vote(1)}
          disabled={locked || loading}
          style={{
            ...btnBase,
            cursor: locked ? 'default' : 'pointer',
            background: userVote === 1 ? 'var(--green)' : locked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
            color: userVote === 1 ? '#fff' : locked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
            transform: userVote === 1 ? 'scale(1.08)' : 'scale(1)',
            opacity: locked && userVote !== 1 ? 0.4 : 1,
          }}
        >
          <span style={{ fontSize: isLg ? '1.4rem' : '1rem' }}>👍</span>
          <span>{upvotes}</span>
        </button>

        <button
          onClick={() => vote(-1)}
          disabled={locked || loading}
          style={{
            ...btnBase,
            cursor: locked ? 'default' : 'pointer',
            background: userVote === -1 ? '#c0392b' : locked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
            color: userVote === -1 ? '#fff' : locked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
            transform: userVote === -1 ? 'scale(1.08)' : 'scale(1)',
            opacity: locked && userVote !== -1 ? 0.4 : 1,
          }}
        >
          <span style={{ fontSize: isLg ? '1.4rem' : '1rem' }}>👎</span>
          <span>{downvotes}</span>
        </button>
      </div>

      {/* Invisible reveal tap target — subtle underline hint when there are votes */}
      {totalVotes > 0 && (
        <button
          onClick={toggleReveal}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 12px',
            fontSize: isLg ? '0.7rem' : '0.6rem',
            color: reveal ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
            letterSpacing: '0.05em',
            transition: 'color 0.2s',
          }}
        >
          {loadingVoters ? '...' : reveal ? 'hide' : `${totalVotes} vote${totalVotes !== 1 ? 's' : ''}`}
        </button>
      )}

      {/* Voter reveal panel */}
      {reveal && voters && (
        <div style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          borderRadius: 'var(--r-md)',
          padding: '8px 14px',
          fontSize: isLg ? '0.8rem' : '0.65rem',
          color: '#fff',
          display: 'flex',
          gap: 16,
          minWidth: 140,
          justifyContent: 'center',
        }}>
          {voters.upvoters.length > 0 && (
            <div>
              <span style={{ opacity: 0.6, fontSize: '0.7em', display: 'block', marginBottom: 2 }}>👍</span>
              {voters.upvoters.join(', ')}
            </div>
          )}
          {voters.downvoters.length > 0 && (
            <div>
              <span style={{ opacity: 0.6, fontSize: '0.7em', display: 'block', marginBottom: 2 }}>👎</span>
              {voters.downvoters.join(', ')}
            </div>
          )}
          {voters.upvoters.length === 0 && voters.downvoters.length === 0 && (
            <span style={{ opacity: 0.5 }}>No votes yet</span>
          )}
        </div>
      )}
    </div>
  );
}
