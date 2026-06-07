import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import type { Round, Course, Match } from '@/lib/types';
import Countdown from '@/components/Countdown';

export const revalidate = 60;

const TRIP_START = '2026-09-13';
const TRIP_END = '2026-09-20';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = new Date().toISOString().split('T')[0];
  const { data: rounds } = await supabase
    .from('rounds')
    .select('*, courses(*)')
    .gte('play_date', today)
    .order('play_date')
    .limit(1);
  const nextRound = rounds?.[0] as (Round & { courses: Course }) | undefined;

  const { data: matches } = await supabase
    .from('matches')
    .select('murray_points, harris_points')
    .eq('status', 'final') as { data: Pick<Match, 'murray_points' | 'harris_points'>[] | null };

  const murrayPts = (matches ?? []).reduce((s, m) => s + Number(m.murray_points), 0);
  const harrisPts = (matches ?? []).reduce((s, m) => s + Number(m.harris_points), 0);
  const totalPts = murrayPts + harrisPts || 1;

  return (
    <div>
      {/* ── Splash hero: poster image ── */}
      <div style={{
        background: 'var(--green)',
        paddingTop: 'env(safe-area-inset-top)',
        overflow: 'hidden',
      }}>
        <Image
          src="/hodus-cover.jpg"
          alt="Hodus 5-0 — Northern Ireland &amp; Donegal 2026"
          width={640}
          height={853}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          priority
        />
        <div className="wrap" style={{ paddingTop: 'var(--s-4)', paddingBottom: 'var(--s-5)' }}>
          <Countdown targetDate={TRIP_START} endDate={TRIP_END} />
        </div>
      </div>

      <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>

        {/* Standings strip */}
        {(murrayPts > 0 || harrisPts > 0) && (
          <div className="card">
            <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Live Standings</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 'var(--s-2)' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>{murrayPts}</div>
                <div className="small muted">Murray</div>
              </div>
              <div className="muted small">vs</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--rail-portrush)' }}>{harrisPts}</div>
                <div className="small muted">Harris</div>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 'var(--r-pill)', background: 'var(--cream-dark)', marginTop: 'var(--s-3)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(murrayPts / totalPts) * 100}%`, background: 'var(--green)', borderRadius: 'var(--r-pill)' }} />
            </div>
            <Link href="/match" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 'var(--s-3)' }}>Full standings →</Link>
          </div>
        )}

        {/* Next round */}
        {nextRound && (
          <div className="card" style={{ borderLeft: `4px solid ${nextRound.courses?.rail_color ?? 'var(--gilt)'}` }}>
            <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>
              {nextRound.play_date === today ? '⛳ Today' : 'Next Round'}
            </p>
            <div style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'center' }}>
              {nextRound.courses?.crest_url && (
                <Image src={nextRound.courses.crest_url} alt="" width={48} height={48} style={{ borderRadius: '50%' }} />
              )}
              <div>
                <div style={{ fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{nextRound.courses?.name}</div>
                <div className="small muted">{formatDate(nextRound.play_date)} · {nextRound.tee_time}</div>
                {nextRound.is_altshot && <span className="chip chip-gilt" style={{ marginTop: 4 }}>Alt Shot</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--s-2)', marginTop: 'var(--s-3)' }}>
              <Link href={`/courses/${nextRound.courses?.slug}`} className="btn btn-secondary btn-sm">Course →</Link>
              <Link href="/match" className="btn btn-primary btn-sm">Scoring →</Link>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div>
          <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Quick Links</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-2)' }}>
            {[
              { href: '/trip', label: 'Itinerary', emoji: '🗓' },
              { href: '/flights', label: 'Flights', emoji: '✈' },
              { href: '/players', label: 'Players', emoji: '👥' },
              { href: '/feed', label: 'Feed', emoji: '💬' },
            ].map(({ href, label, emoji }) => (
              <Link key={href} href={href} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', fontWeight: 500, touchAction: 'manipulation' }}>
                <span style={{ fontSize: '1.3rem' }}>{emoji}</span> {label}
              </Link>
            ))}
          </div>
        </div>

        <p className="center muted small italic">Booked through Hidden Links · Rosapenna self-arranged</p>
      </div>
    </div>
  );
}
