'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Printer, Check, Download, Loader2, FileDown } from 'lucide-react';
import type { CourseGuide, GuideHole } from '@/lib/guides';
import GuideOffline from '@/components/GuideOffline';

const SECTION_ORDER: Record<string, number> = { TEE: 1, CLUB: 1, LINE: 2, BUNKERS: 3, WATCH: 4, IN: 5, JOE: 6, NOTE: 7 };

function HoleCard({ hole, slug }: { hole: GuideHole; slug: string }) {
  const sections = [...hole.sections].sort(
    (a, b) => (SECTION_ORDER[a.label] ?? 9) - (SECTION_ORDER[b.label] ?? 9),
  );

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s-3)', padding: 'var(--s-4) var(--s-4) var(--s-2)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2.6rem', lineHeight: 0.9, color: 'var(--green)' }}>
          {hole.n}
        </span>
        <div style={{ flex: 1 }}>
          <div className="small" style={{ fontWeight: 700, letterSpacing: '0.06em' }}>
            PAR {hole.par} · {hole.yards} YDS · SI {hole.si}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
            {hole.tags.map(t => (
              <span key={t} style={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em',
                border: '1px solid var(--green)', color: 'var(--green)',
                borderRadius: 3, padding: '2px 6px', whiteSpace: 'nowrap',
              }}>{t}</span>
            ))}
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em',
              borderRadius: 3, padding: '2px 6px',
              background: hole.source === 'joe' ? 'var(--green)' : 'var(--cream-dark)',
              color: hole.source === 'joe' ? '#fff' : 'var(--mute)',
            }}>{hole.source === 'joe' ? 'JOE' : 'GUIDE'}</span>
          </div>
        </div>
      </div>

      {/* Aerial — tee at the bottom, green at the top */}
      <div style={{ padding: '0 var(--s-4)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/guides/${slug}/hole-${hole.n}.jpg`}
          alt={`Hole ${hole.n} from the air`}
          loading={hole.n <= 2 ? 'eager' : 'lazy'}
          style={{
            width: '100%', maxWidth: 300, margin: '0 auto', display: 'block',
            borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
          }}
        />
      </div>

      <div className="stack-sm" style={{ padding: 'var(--s-4)' }}>
        {sections.map((s, i) => (
          <p key={i} style={{ fontSize: '0.92rem', lineHeight: 1.55, margin: 0 }}>
            <span style={{
              fontWeight: 700, letterSpacing: '0.05em', fontSize: '0.72rem',
              color: s.label === 'JOE' ? 'var(--gilt)' : 'var(--green)', marginRight: 6,
            }}>{s.label}</span>
            <span style={{ fontWeight: s.joe ? 600 : 400 }}>{s.text}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export default function GuideClient({ guide }: { guide: CourseGuide }) {
  const [hole, setHole] = useState(1);
  const [tab, setTab] = useState<'holes' | 'rules' | 'quick' | 'card'>('holes');
  const [offline, setOffline] = useState<'idle' | 'saving' | 'saved'>('idle');
  const chipRow = useRef<HTMLDivElement>(null);

  // Pull every aerial into the cache so the guide works in a dead zone
  useEffect(() => {
    if (!('caches' in window)) return;
    caches.open('hodus-guides-v1').then(async cache => {
      const urls = guide.holes.map(h => `/guides/${guide.slug}/hole-${h.n}.jpg`);
      const hit = await cache.match(urls[urls.length - 1]);
      if (hit) setOffline('saved');
    }).catch(() => {});
  }, [guide]);

  async function saveOffline() {
    if (!('caches' in window)) return;
    setOffline('saving');
    try {
      const cache = await caches.open('hodus-guides-v1');
      await cache.addAll([
        ...guide.holes.map(h => `/guides/${guide.slug}/hole-${h.n}.jpg`),
        guide.cover,
        `/courses/${guide.slug}/guide`,
      ]);
      setOffline('saved');
    } catch {
      setOffline('idle');
    }
  }

  function goTo(n: number) {
    const next = Math.min(18, Math.max(1, n));
    setHole(next);
    chipRow.current?.querySelector(`[data-hole="${next}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const current = guide.holes[hole - 1];

  return (
    <div>
      <GuideOffline />
      {/* Sticky tabs + hole chips */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap" style={{ display: 'flex', gap: 4, padding: '8px 16px 6px' }}>
          {([['holes', 'Holes'], ['rules', "Joe's Rules"], ['quick', 'Quick Look'], ['card', 'Card']] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`btn btn-sm ${tab === k ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, minWidth: 0, padding: '6px 4px', fontSize: '0.72rem' }}
            >{label}</button>
          ))}
        </div>

        {tab === 'holes' && (
          <div ref={chipRow} style={{ display: 'flex', gap: 5, overflowX: 'auto', padding: '2px 16px 8px', scrollbarWidth: 'none' }}>
            {guide.holes.map(h => (
              <button
                key={h.n}
                data-hole={h.n}
                onClick={() => goTo(h.n)}
                style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                  border: h.n === hole ? '2px solid var(--green)' : '1px solid var(--border)',
                  background: h.n === hole ? 'var(--green)' : 'var(--surface)',
                  color: h.n === hole ? '#fff' : 'var(--ink)',
                  fontWeight: 700, fontSize: '0.8rem', fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                }}
              >{h.n}</button>
            ))}
          </div>
        )}
      </div>

      <div className="wrap stack" style={{ paddingTop: 'var(--s-4)', paddingBottom: 'var(--s-8)' }}>

        {tab === 'holes' && (
          <>
            <HoleCard hole={current} slug={guide.slug} />
            <div className="row-between">
              <button className="btn btn-secondary btn-sm" onClick={() => goTo(hole - 1)} disabled={hole === 1}>
                <ChevronLeft size={16} /> {hole > 1 ? `Hole ${hole - 1}` : ''}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => goTo(hole + 1)} disabled={hole === 18}>
                {hole < 18 ? `Hole ${hole + 1}` : ''} <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}

        {tab === 'rules' && (
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>{guide.rulesTitle}</h3>
            <p className="small muted" style={{ marginBottom: 'var(--s-4)' }}>
              {guide.rulesIntro} Bold means Joe said it.
            </p>
            <div className="stack">
              {guide.rules.map((r, i) => (
                <div key={i}>
                  <p style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.92rem' }}>{i + 1}. {r.title}</p>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.55, marginTop: 2 }}>{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'quick' && (
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Quick Look</h3>
            <p className="small muted" style={{ marginBottom: 'var(--s-4)' }}>The holes that need a decision before you pull a club.</p>
            <div className="stack">
              {guide.quickLook.map((q, i) => (
                <div key={i}>
                  <p style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.92rem' }}>{q.title}</p>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.55, marginTop: 2, fontWeight: q.joe ? 600 : 400 }}>{q.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'card' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 'var(--s-4) var(--s-4) var(--s-2)' }}>
              <h3>The Card</h3>
              <p className="small muted" style={{ marginTop: 2 }}>
                {guide.tees}, club scorecard. Last column is the call off the tee; bold is Joe&rsquo;s.
              </p>
            </div>
            <table className="ht">
              <thead>
                <tr><th>#</th><th className="num">Par</th><th className="num">Yds</th><th className="num">SI</th><th>Off the tee</th></tr>
              </thead>
              <tbody>
                {guide.holes.map(h => (
                  <tr key={h.n} onClick={() => { setTab('holes'); goTo(h.n); }} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 700 }}>{h.n}</td>
                    <td className="num">{h.par}</td>
                    <td className="num">{h.yards}</td>
                    <td className="num">{h.si}</td>
                    <td className="small" style={{ fontWeight: h.teeIsJoe ? 600 : 400 }}>{h.offTheTee}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--cream-dark)' }}>
                  <td style={{ fontWeight: 700 }}>TOT</td>
                  <td className="num" style={{ fontWeight: 700 }}>{guide.par}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{guide.yards.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Offline + print */}
        <div className="card" style={{ background: 'rgba(201,162,75,.08)', borderColor: 'var(--gilt)' }}>
          <p className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
            {offline === 'saved' ? '✓ Saved for offline' : 'No signal in the dunes?'}
          </p>
          <p className="small muted" style={{ marginBottom: 'var(--s-3)' }}>
            {offline === 'saved'
              ? 'All 18 aerials are on your phone. The guide opens with no bars.'
              : 'Tap once on hotel wifi and the whole guide, aerials included, is stored on your phone.'}
          </p>
          <div className="row" style={{ gap: 'var(--s-2)' }}>
            <button className="btn btn-secondary btn-sm" onClick={saveOffline} disabled={offline !== 'idle'} style={{ flex: 1 }}>
              {offline === 'saving' ? <><Loader2 size={14} /> Saving…</> : offline === 'saved' ? <><Check size={14} /> Saved</> : <><Download size={14} /> Save offline</>}
            </button>
            <Link href={`/courses/${guide.slug}/guide/print`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Printer size={14} /> Print
            </Link>
            <a href={`/guides/${guide.slug}/field-guide-flipbook.pdf`} className="btn btn-secondary btn-sm" style={{ flex: 1 }} download>
              <FileDown size={14} /> Flip book PDF
            </a>
          </div>
        </div>

        <Link href={`/courses/${guide.slug}`} className="small" style={{ color: 'var(--mute)' }}>
          ← Back to {guide.name}
        </Link>
      </div>
    </div>
  );
}
