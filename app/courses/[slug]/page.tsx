import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import type { Course, Round, SignatureHole } from '@/lib/types';
import CourseEditPanel from './CourseEditPanel';

export const revalidate = 3600;

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: player } = await supabase
    .from('players').select('is_admin').eq('auth_user_id', user.id).maybeSingle();
  const isAdmin = !!player?.is_admin;

  const { data: course } = await supabase
    .from('courses').select('*').eq('slug', slug).maybeSingle() as { data: Course | null };
  if (!course) notFound();

  const { data: rounds } = await supabase
    .from('rounds').select('*').eq('course_id', course.id).order('round_no') as { data: Round[] | null };

  const sigHoles: SignatureHole[] = Array.isArray(course.signature_holes) ? course.signature_holes : [];

  const bannerPath = `/banners/${slug}.png`;

  return (
    <div>
      {/* Hero banner */}
      <div style={{ position: 'relative', height: 200, background: course.rail_color, overflow: 'hidden' }}>
        <Image src={bannerPath} alt={course.name} fill style={{ objectFit: 'cover', opacity: 0.7 }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${course.rail_color}88, ${course.rail_color})` }} />
        <div style={{ position: 'absolute', bottom: 'var(--s-4)', left: 'var(--s-4)', right: 'var(--s-4)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
            {course.crest_url && (
              <Image src={course.crest_url} alt="" width={56} height={56} style={{ borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)' }} />
            )}
            <div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.2rem,4vw,1.8rem)' }}>{course.name}</h1>
              <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '0.85rem' }}>{course.location}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>

        {/* Key facts */}
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--s-3)', textAlign: 'center' }}>
            <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem' }}>{course.par}</div><div className="small muted">Par</div></div>
            <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem' }}>{course.yards.toLocaleString()}</div><div className="small muted">Yards</div></div>
            <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem' }}>{course.founded ?? '—'}</div><div className="small muted">Founded</div></div>
          </div>
          <hr className="rule" style={{ margin: 'var(--s-3) 0' }} />
          <p className="small muted">Designed by <strong>{course.designer}</strong></p>
        </div>

        {/* Tee times this trip */}
        {(rounds ?? []).length > 0 && (
          <div>
            <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Our Tee Times</p>
            <div className="stack-sm">
              {(rounds ?? []).map(r => (
                <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="chip chip-neutral" style={{ marginRight: 6 }}>Round {r.round_no}</span>
                    <span style={{ fontWeight: 500 }}>{new Date(r.play_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                    <span style={{ fontWeight: 600 }}>{r.tee_time}</span>
                    {r.is_altshot && <span className="chip chip-gilt">Alt Shot</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature holes */}
        {sigHoles.length > 0 && (
          <div>
            <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Signature Holes</p>
            <div className="stack-sm">
              {sigHoles.map(h => (
                <div key={h.hole} className="card" style={{ borderLeft: `3px solid ${course.rail_color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                      {h.name ? `Hole ${h.hole} — ${h.name}` : `Hole ${h.hole}`}
                    </span>
                    <span className="chip chip-neutral">Par {h.par} · {h.yards} yds</span>
                  </div>
                  <p className="small muted">{h.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {course.notes_md && (
          <div className="card">
            <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Notes</p>
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{course.notes_md}</p>
          </div>
        )}

        {isAdmin && <CourseEditPanel course={course} />}
      </div>
    </div>
  );
}
