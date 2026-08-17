'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { initials } from '@/lib/utils';
import type { Player } from '@/lib/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// What each player is doing in their cartoon — shown in the popup caption
const CARTOON_CAPTIONS: Record<string, string> = {
  'Dan Murray':      'Ballet recital',
  'Matt Hodus':      'Competitive cheerleading',
  'Galen Archibald': 'Ice fishing (world record)',
  'Jim Mitchell':    'Juggalo concert',
  'Eric Strong':     'Karate demonstration',
  'Jeff Pinksa':     'Pottery wheel (Ghost style)',
  'Joe Gulash':      'Burlesque performer',
  'Jim Hughes':      'Speed-knitting championship',
  'Lee Einhorn':     'Professional beekeeper',
  'Dave Harris':     'Ferret racing enthusiast',
  'Todd Moutafian':  'Hot dog eating champion',
  'Matt Burns':      'Competitive cheese roller',
  'Rob Cohen':       'Competitive caber tosser',
};

function cartoonUrl(playerId: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/photos/avatars/cartoon_${playerId}.jpg`;
}

type PopupMode = { kind: 'photo'; player: Player } | { kind: 'cartoon'; player: Player };

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
  const [popup, setPopup] = useState<PopupMode | null>(null);

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
              {/* Real photo avatar */}
              <button
                onClick={() => p.avatar_url && setPopup({ kind: 'photo', player: p })}
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

              {/* Name + nickname */}
              <Link href={`/players/${p.id}`} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {p.name}
                  {p.is_captain && <span className="chip chip-gilt">C</span>}
                </div>
                {p.nickname && <div className="small muted">&ldquo;{p.nickname}&rdquo;</div>}
              </Link>

              {/* Cartoon avatar button */}
              <button
                onClick={() => setPopup({ kind: 'cartoon', player: p })}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  cursor: 'pointer', flexShrink: 0,
                  position: 'relative',
                }}
                aria-label={`See ${p.first_name}'s alter ego`}
                title={CARTOON_CAPTIONS[p.name] ?? ''}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid var(--gilt)',
                  background: 'var(--surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cartoonUrl(p.id)}
                    alt=""
                    width={40}
                    height={40}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) parent.textContent = '🎭';
                    }}
                  />
                </div>
              </button>

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

      {/* Photo popup */}
      {popup?.kind === 'photo' && popup.player.avatar_url && (
        <div
          onClick={() => setPopup(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 24, cursor: 'pointer',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            borderRadius: 'var(--r-lg)', overflow: 'hidden',
            maxWidth: 360, width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}>
            <Image
              src={popup.player.avatar_url}
              alt={popup.player.name}
              width={360} height={360}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          <div style={{ marginTop: 16, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', textAlign: 'center' }}>
            {popup.player.name}
          </div>
          {popup.player.nickname && (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: 4 }}>
              &ldquo;{popup.player.nickname}&rdquo;
            </div>
          )}
          <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>tap to close</div>
        </div>
      )}

      {/* Cartoon popup */}
      {popup?.kind === 'cartoon' && (
        <div
          onClick={() => setPopup(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 24, cursor: 'pointer',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            borderRadius: 'var(--r-lg)', overflow: 'hidden',
            maxWidth: 380, width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            border: '3px solid var(--gilt)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cartoonUrl(popup.player.id)}
              alt={popup.player.name}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          <div style={{ marginTop: 16, color: 'var(--gilt)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', textAlign: 'center' }}>
            {popup.player.first_name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginTop: 6, textAlign: 'center', fontStyle: 'italic' }}>
            {CARTOON_CAPTIONS[popup.player.name] ?? ''}
          </div>
          <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>tap to close</div>
        </div>
      )}
    </>
  );
}
