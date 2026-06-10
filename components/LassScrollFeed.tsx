'use client';

import { useRef, useState, useEffect } from 'react';
import LassVoting from './LassVoting';

const TRIP_DATE = new Date('2026-09-13T00:00:00Z');

function daysLeft(createdAt: string): number {
  const posted = new Date(createdAt);
  posted.setUTCHours(0, 0, 0, 0);
  const trip = new Date(TRIP_DATE);
  trip.setUTCHours(0, 0, 0, 0);
  return Math.max(0, Math.round((trip.getTime() - posted.getTime()) / 86_400_000));
}

function formatPosted(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

export interface LassFeedItem {
  id: string;
  day_number: number;
  profession: string;
  county: string;
  image_url: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  userVote: 1 | -1 | null;
  roundsThatDay?: string[];
  fun_fact?: string | null;
  famous_irish?: string | null;
}

// Frosted card popup — reused for both fun fact and famous Irish
function InfoCard({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 30,
        display: 'flex', alignItems: 'flex-end',
        padding: '0 16px 100px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'rgba(10,10,10,0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 16,
          padding: '16px 18px 18px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{
          fontSize: '0.6rem',
          fontWeight: 800,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          marginBottom: 8,
        }}>
          {title}
        </div>
        <p style={{
          margin: 0,
          fontSize: '0.85rem',
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.9)',
        }}>
          {body}
        </p>
        <button
          onClick={onClose}
          style={{
            marginTop: 12,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.68rem',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          tap to close
        </button>
      </div>
    </div>
  );
}

// Individual slide with its own popup state
function LassSlide({
  item,
  index,
  total,
  activeIndex,
}: {
  item: LassFeedItem;
  index: number;
  total: number;
  activeIndex: number;
}) {
  const [popup, setPopup] = useState<'fact' | 'famous' | null>(null);
  const days = daysLeft(item.created_at);

  return (
    <div
      data-slide={index}
      style={{
        height: 'calc(100dvh - var(--tab-h) - env(safe-area-inset-bottom))',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* Full-bleed image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt={`${item.profession} from Co. ${item.county}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          display: 'block',
        }}
      />

      {/* Top-left: rounds played that day */}
      {item.roundsThatDay && item.roundsThatDay.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          borderRadius: 20,
          padding: '6px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          maxWidth: 'calc(100% - 100px)',
        }}>
          {item.roundsThatDay.map((r, i) => (
            <div key={i} style={{
              color: '#fff',
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              ⛳ {r}
            </div>
          ))}
        </div>
      )}

      {/* Top-right: slide counter */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        borderRadius: 20,
        padding: '4px 12px',
        color: '#fff',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
      }}>
        {index + 1} / {total}
      </div>

      {/* Bottom gradient + caption + voting */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
        padding: '60px 20px 24px',
      }}>
        {/* Caption */}
        <div style={{ color: '#fff', marginBottom: 14 }}>
          {/* Days left badge */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 'var(--r-pill)',
            padding: '2px 10px',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            {days === 0 ? "We're in Ireland! ☘️" : `${days} Days Left`}
          </div>

          {/* Profession — tappable for famous Irish */}
          <button
            onClick={() => item.famous_irish && setPopup(p => p === 'famous' ? null : 'famous')}
            style={{
              display: 'block',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: item.famous_irish ? 'pointer' : 'default',
              textAlign: 'left',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.4rem',
              textTransform: 'capitalize',
              lineHeight: 1.2,
              color: '#fff',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}>
              {item.profession}
              {item.famous_irish && (
                <span style={{ fontSize: '0.75rem', opacity: 0.55, marginLeft: 6, fontFamily: 'var(--font-sans)', fontWeight: 400 }}>
                  ☘
                </span>
              )}
            </div>
          </button>

          <div style={{ fontSize: '0.82rem', opacity: 0.75, marginTop: 3 }}>
            Co. {item.county} · {formatPosted(item.created_at)}
          </div>
        </div>

        {/* Voting + fun fact button row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
          <LassVoting
            lassId={item.id}
            initialUpvotes={item.upvotes}
            initialDownvotes={item.downvotes}
            userVote={item.userVote}
            size="lg"
          />

          {/* Fun fact button — bottom right */}
          {item.fun_fact && (
            <button
              onClick={() => setPopup(p => p === 'fact' ? null : 'fact')}
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 20,
                padding: '7px 14px',
                color: popup === 'fact' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'color 0.15s',
              }}
            >
              Fun Fact
            </button>
          )}
        </div>
      </div>

      {/* Popups */}
      {popup === 'fact' && item.fun_fact && (
        <InfoCard
          title="Fun Fact"
          body={item.fun_fact}
          onClose={() => setPopup(null)}
        />
      )}
      {popup === 'famous' && item.famous_irish && (
        <InfoCard
          title={`Famous Irish ${item.profession}`}
          body={item.famous_irish}
          onClose={() => setPopup(null)}
        />
      )}

      {/* Scroll hint on first slide */}
      {index === 0 && activeIndex === 0 && (
        <div style={{
          position: 'absolute',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          animation: 'pulse 2s infinite',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '1.2rem' }}>↑</span>
          swipe for more
        </div>
      )}
    </div>
  );
}

export default function LassScrollFeed({ items, isAdmin, adminPanel }: {
  items: LassFeedItem[];
  isAdmin: boolean;
  adminPanel?: React.ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slides = containerRef.current?.querySelectorAll('[data-slide]');
    if (!slides) return;
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setActiveIndex(Number((e.target as HTMLElement).dataset.slide));
          }
        });
      },
      { threshold: 0.6 }
    );
    slides.forEach(s => obs.observe(s));
    return () => obs.disconnect();
  }, [items]);

  if (!items.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: '3rem' }}>☘️</p>
        <p className="muted">Today&apos;s lass hasn&apos;t arrived yet — check back after 3 am ET.</p>
        {isAdmin && adminPanel && <div style={{ marginTop: 16 }}>{adminPanel}</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {/* Scroll container */}
      <div
        ref={containerRef}
        style={{
          height: 'calc(100dvh - var(--tab-h) - env(safe-area-inset-bottom))',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {items.map((item, i) => (
          <LassSlide
            key={item.id}
            item={item}
            index={i}
            total={items.length}
            activeIndex={activeIndex}
          />
        ))}

        {/* Admin panel appended at end of feed */}
        {isAdmin && adminPanel && (
          <div style={{
            minHeight: 'calc(100dvh - var(--tab-h) - env(safe-area-inset-bottom))',
            scrollSnapAlign: 'start',
            background: 'var(--bg)',
            padding: '32px 20px',
          }}>
            <p className="section-label" style={{ marginBottom: 16 }}>Admin</p>
            {adminPanel}
          </div>
        )}
      </div>

      {/* Pip indicator — right side */}
      {items.length > 1 && (
        <div style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          zIndex: 20,
          pointerEvents: 'none',
        }}>
          {items.map((_, i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: i === activeIndex ? 20 : 6,
                borderRadius: 4,
                background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
