import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Course } from '@/lib/types';

export const revalidate = 3600;

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: courses } = await supabase
    .from('courses').select('*').order('sort') as { data: Course[] | null };

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>Courses</h1>
          <p className="sub">6 rounds · 5 courses · 2 countries</p>
        </div>
      </div>

      <div className="wrap stack" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>
        {(courses ?? []).map((course, i) => (
          <Link key={course.id} href={`/courses/${course.slug}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ overflow: 'hidden', borderLeft: `4px solid ${course.rail_color}` }}>
              <div style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'center' }}>
                {course.crest_url && (
                  <Image
                    src={course.crest_url}
                    alt={course.name}
                    width={52}
                    height={52}
                    style={{ borderRadius: '50%', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                    <span className="chip chip-neutral" style={{ fontSize: '0.7rem' }}>R{i + 1}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginTop: 2 }}>{course.name}</div>
                  <div className="small muted">{course.location}</div>
                  <div className="small muted">{course.designer} · Par {course.par} · {course.yards.toLocaleString()} yds</div>
                </div>
                <div style={{ color: 'var(--mute)', flexShrink: 0, fontSize: '1.2rem' }}>›</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
