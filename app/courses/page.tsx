import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Course } from '@/lib/types';

export const revalidate = 3600;

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: courses } = await supabase
    .from('courses').select('*').order('sort') as { data: Course[] | null };

  const ROUND_LABELS: Record<string, string> = {
    portmarnock: 'Preview',
    rcd: 'R1',
    portrush: 'R2',
    portstewart: 'R3',
    stpats: 'R4–5',
    otm: 'R6',
  };

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>Courses</h1>
          <p className="sub">6 rounds · 5 courses · 2 countries</p>
        </div>
      </div>

      <div className="wrap stack" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>
        {(courses ?? []).map((course) => (
          <Link key={course.id} href={`/courses/${course.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="card" style={{ overflow: 'hidden', padding: 0, borderColor: course.rail_color + '44' }}>

              {/* Banner photo */}
              <div style={{ position: 'relative', height: 170, background: course.rail_color, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/banners/${course.slug}.png`}
                  alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                />
                {/* Dark gradient for text legibility */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)`,
                }} />

                {/* Round badge — top left */}
                <span style={{
                  position: 'absolute', top: 12, left: 12,
                  background: course.rail_color, color: '#fff',
                  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
                  padding: '4px 9px', borderRadius: 'var(--r-pill)',
                  border: '1.5px solid rgba(255,255,255,.3)',
                }}>
                  {ROUND_LABELS[course.slug] ?? ''}
                </span>

                {/* World rank badge — bottom right */}
                {course.world_rank && (
                  <span style={{
                    position: 'absolute', bottom: 12, right: 12,
                    background: 'rgba(201,162,75,0.92)', color: '#1a1200',
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em',
                    padding: '4px 9px', borderRadius: 'var(--r-pill)',
                    backdropFilter: 'blur(4px)',
                  }}>
                    {course.world_rank}
                  </span>
                )}

                {/* Course crest — bottom left, overlapping content area */}
                {course.crest_url && (
                  <div style={{
                    position: 'absolute', bottom: -20, left: 16,
                    width: 44, height: 44, borderRadius: '50%',
                    border: '2.5px solid #fff',
                    background: '#fff',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,.2)',
                    zIndex: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={course.crest_url} alt="" style={{ width: '88%', height: '88%', objectFit: 'contain' }} />
                  </div>
                )}
              </div>

              {/* Text content */}
              <div style={{ padding: 'var(--s-4)', paddingTop: course.crest_url ? 'calc(var(--s-4) + 20px)' : 'var(--s-4)' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: '1.15rem', color: 'var(--ink)', lineHeight: 1.2,
                }}>
                  {course.name}
                </div>
                <div className="small muted" style={{ marginTop: 3 }}>
                  {course.location} · {course.designer} · Est. {course.founded}
                </div>
                {course.description && (
                  <p style={{
                    marginTop: 'var(--s-3)', fontSize: '0.85rem', lineHeight: 1.55,
                    color: 'var(--ink)', opacity: 0.8,
                    display: '-webkit-box', WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {course.description}
                  </p>
                )}
                <div style={{ marginTop: 'var(--s-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="small muted">Par {course.par}{course.yards ? ` · ${course.yards.toLocaleString()} yds` : ''}</div>
                  <span style={{ color: course.rail_color, fontWeight: 600, fontSize: '0.85rem' }}>View →</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
