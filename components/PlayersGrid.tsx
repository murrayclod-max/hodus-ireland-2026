'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { initials } from '@/lib/utils';
import type { Player } from '@/lib/types';

export default function PlayersGrid({
  murray,
  harris,
  murrayIdx,
  harrisIdx,
}: {
  murray: Player[];
  harris: Player[];
  murrayIdx: number;
  harrisIdx: number;
}) {
  const [popup, setPopup] = useState<Player | null>(null);

  function TeamSection({ team, label, color, totalIdx }: { team: Player[]; label: string; color: string; totalIdx: number }) {
    return (
      <div>
        <div style={{
          background: color, color: '#fff', borderRadius: 'var(--r-md)',
          padding: '8px 14px', marginBottom: 'var(--s-3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>Team {label}</span>
          <span style={{ fontSize: '0.82rem', opacity: 0.8 }}>Σ {totalIdx.toFixed(1)}</span>
        </div>
        <div className="stack-sm">
          {team.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
              {/* Avatar — tap opens popup if there's a photo */}
              <button
                onClick={() => p.avatar_url && setPopup(p)}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  cursor: p.avatar_url ? 'pointer' : 'default',
                  flexShrink: 0,
                }}
                aria-label={p.avatar_url ? `View photo of ${p.name}` : undefined}
              >
                <div className="avatar avatar-md">
                  {p.avatar_url
                    ? <Image src={p.avatar_url} alt={p.name} width={48} height={48} />
                    : <div className="avatar-initials" style={{ fontSize: '0.85rem' }}>{initials(p.name)}</div>
                  }
                </div>
              </button>

              {/* Name + nickname — tap navigates to profile */}
              <Link href={`/players/${p.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {p.name}{p.is_captain && <span className="chip chip-gilt" style={{ marginLeft: 6 }}>C</span>}
                </div>
                {p.nickname && <div className="small muted">&ldquo;{p.nickname}&rdquo;</div>}
              </Link>

              <Link href={`/players/${p.id}`} style={{ textDecoration: 'none', textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>{p.handicap_index ?? '—'}</div>
                <div className="small muted">index</div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>
        <TeamSection team={murray} label="Murray" color="var(--green)" totalIdx={murrayIdx} />
        <TeamSection team={harris} label="Harris" color="var(--rail-portrush)" totalIdx={harrisIdx} />
      </div>

      {/* Avatar popup modal */}
      {popup && popup.avatar_url && (
        <div
          onClick={() => setPopup(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 24,
            cursor: 'pointer',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              borderRadius: 'var(--r-lg)',
              overflow: 'hidden',
              maxWidth: 360,
              width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            <Image
              src={popup.avatar_url}
              alt={popup.name}
              width={360}
              height={360}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          <div style={{
            marginTop: 16,
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.2rem',
            textAlign: 'center',
          }}>
            {popup.name}
          </div>
          {popup.nickname && (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: 4 }}>
              &ldquo;{popup.nickname}&rdquo;
            </div>
          )}
          <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>tap to close</div>
        </div>
      )}
    </>
  );
}
