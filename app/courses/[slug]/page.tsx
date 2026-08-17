import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import type { Course, Round, SignatureHole } from '@/lib/types';
import CourseEditPanel from './CourseEditPanel';
import CourseWeather from '@/components/CourseWeather';

export const revalidate = 3600;

// Official website links and notable review excerpts for each course
const COURSE_LINKS: Record<string, {
  website: string;
  reviews: { source: string; quote: string }[];
}> = {
  portmarnock: {
    website: 'https://portmarnock.com',
    reviews: [
      { source: 'Golf Digest (Ireland Top 100)', quote: 'One of the finest links courses in the Republic, with stunning estuary views and a routing that demands every club in the bag.' },
      { source: 'Top 100 Golf Courses', quote: 'The Jameson Links is the perfect warm-up — a demanding pure links that puts you in the right Ireland mindset before the big stages.' },
    ],
  },
  rcd: {
    website: 'https://royalcountydown.org',
    reviews: [
      { source: 'Golf Digest World Top 100', quote: '#3 in the World. The most naturally beautiful golf course on earth, set against the Mountains of Mourne. No course has a more dramatic backdrop.' },
      { source: 'Golf Magazine', quote: 'The bunkers, the gorse, the mountains — Royal County Down is a symphony. It is golf as nature intended it.' },
      { source: 'Tom Watson', quote: 'The greatest natural golf course in the world. Nothing man could create would come close to this.' },
    ],
  },
  portrush: {
    website: 'https://royalportrushgolfclub.com',
    reviews: [
      { source: 'The Open Championship 2019', quote: 'Host of the 148th Open Championship — the first in Northern Ireland since 1951. Shane Lowry won here in a glorious, rain-soaked homecoming.' },
      { source: 'Golf Digest World Top 100', quote: '#9 in the World. Dunluce is a wild, windswept masterpiece — holes like Calamity Corner and White Rocks are burned into the memory of anyone who plays them.' },
      { source: 'Golf World (UK)', quote: 'The Dunluce Course is as good as links golf gets. If you only ever play one course in the British Isles, make it this one.' },
    ],
  },
  portstewart: {
    website: 'https://www.portstewartgc.co.uk',
    reviews: [
      { source: 'Golf World UK', quote: 'An unsung gem — the Strand Course opens with one of the most spectacular par-5s in links golf, tumbling through towering sandhills above the sea.' },
      { source: 'Top 100 Golf Courses', quote: 'Ranked #67 in Britain & Ireland, Portstewart punches well above its weight. The front nine through the dunes is as good as anything in the north.' },
    ],
  },
  stpats: {
    website: 'https://rosapenna.ie/golf/st-patricks-links',
    reviews: [
      { source: 'Golf Digest World Top 50', quote: 'Pat Ruddy\'s masterpiece opened in 2003 and quickly became one of the best links courses in the world. Donegal\'s raw beauty makes every hole feel cinematic.' },
      { source: 'Links Magazine', quote: 'St Patrick\'s plays along the wild Atlantic Way with a ferocity and freedom that few modern courses can match. Ranked #37 in the World.' },
      { source: 'Golf World', quote: 'The kind of course that makes you want to turn around and play again the moment you finish the 18th.' },
    ],
  },
  otm: {
    website: 'https://rosapenna.ie/golf/old-tom-morris-links',
    reviews: [
      { source: 'Rosapenna Golf Resort', quote: 'Laid out by Old Tom Morris in 1893 and extended by Harry Vardon, this historic links follows the natural contours of Sheephaven Bay. A living piece of golf history.' },
      { source: 'Golf Monthly', quote: 'One of Ireland\'s oldest links courses, recently restored and rerouted. The original routing through the dunes is pure 19th-century golf architecture at its finest.' },
    ],
  },
};

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: player } = await supabase
    .from('players').select('is_admin').eq('auth_user_id', user.id).maybeSingle();
  const isAdmin = !!player?.is_admin;
  const db = player ? supabase : createServiceClient();

  const { data: course } = await db
    .from('courses').select('*').eq('slug', slug).maybeSingle() as { data: Course | null };
  if (!course) notFound();

  const { data: rounds } = await db
    .from('rounds').select('*').eq('course_id', course.id).order('round_no') as { data: Round[] | null };

  const sigHoles: SignatureHole[] = Array.isArray(course.signature_holes) ? course.signature_holes : [];

  const bannerPath = `/banners/${slug}.png`;

  return (
    <div>
      {/* Hero banner */}
      <div style={{ position: 'relative', height: 200, background: course.rail_color, overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerPath} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${course.rail_color}88, ${course.rail_color})` }} />
        <div style={{ position: 'absolute', bottom: 'var(--s-4)', left: 'var(--s-4)', right: 'var(--s-4)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
            {course.crest_url && (
              <div style={{ width: 60, height: 60, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,.5)', background: '#fff', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={course.crest_url} alt="" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
              </div>
            )}
            <div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.2rem,4vw,1.8rem)' }}>{course.name}</h1>
              <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '0.85rem' }}>{course.location}</p>
              {course.world_rank && (
                <span style={{
                  display: 'inline-block', marginTop: 6,
                  background: 'rgba(201,162,75,0.9)', color: '#1a1200',
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
                  padding: '3px 10px', borderRadius: 'var(--r-pill)',
                }}>
                  {course.world_rank}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>

        {/* Description */}
        {course.description && (
          <div className="card" style={{ borderLeft: `4px solid ${course.rail_color}` }}>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--ink)' }}>{course.description}</p>
          </div>
        )}

        {/* Links & Reviews */}
        {COURSE_LINKS[slug] && (() => {
          const info = COURSE_LINKS[slug];
          return (
            <div>
              {/* Official website button */}
              <a
                href={info.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  textDecoration: 'none',
                  background: course.rail_color,
                  color: '#fff',
                  borderRadius: 'var(--r-md)',
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  marginBottom: 'var(--s-3)',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🌐</span>
                <span style={{ flex: 1 }}>Official Website</span>
                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>↗</span>
              </a>

              {/* Review excerpts */}
              <div className="stack-sm">
                {info.reviews.map((r, i) => (
                  <div key={i} className="card" style={{
                    borderLeft: `3px solid var(--gilt)`,
                    background: 'rgba(201,162,75,.05)',
                  }}>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, fontStyle: 'italic', color: 'var(--ink)', marginBottom: 6 }}>
                      &ldquo;{r.quote}&rdquo;
                    </p>
                    <p className="small" style={{ color: 'var(--gilt)', fontWeight: 600 }}>— {r.source}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Key facts */}
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--s-3)', textAlign: 'center' }}>
            <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem' }}>{course.par}</div><div className="small muted">Par</div></div>
            <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem' }}>{course.yards?.toLocaleString() ?? '—'}</div><div className="small muted">Yards</div></div>
            <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem' }}>{course.founded ?? '—'}</div><div className="small muted">Founded</div></div>
          </div>
          <hr className="rule" style={{ margin: 'var(--s-3) 0' }} />
          <p className="small muted">Designed by <strong>{course.designer}</strong></p>
        </div>

        {/* Tee boxes */}
        {course.tees.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <p className="section-label" style={{ padding: 'var(--s-4) var(--s-4) var(--s-2)' }}>Tee Boxes</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--cream-dark)' }}>
                  {['Tee', 'Yards', 'Par', 'Rating', 'Slope'].map(h => (
                    <th key={h} style={{ padding: '6px 12px', textAlign: h === 'Tee' ? 'left' : 'right', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mute)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {course.tees.map((tee, i) => (
                  <tr key={i} style={{ borderBottom: i < course.tees.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                      {tee.name}
                      {tee.si && <span title="Stroke index data available" style={{ marginLeft: 6, fontSize: 10, color: 'var(--green)' }}>SI ✓</span>}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{tee.yards?.toLocaleString() ?? '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{tee.par ?? course.par}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--gilt)', fontWeight: 600 }}>{tee.rating.toFixed(1)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{tee.slope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tee times this trip */}
        {(rounds ?? []).length > 0 && (
          <div>
            <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Our Tee Times</p>
            <div className="stack-sm">
              {(rounds ?? []).map(r => (
                <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="chip chip-neutral" style={{ marginRight: 6 }}>{r.in_competition ? `Round ${r.round_no}` : 'Appetizer'}</span>
                    <span style={{ fontWeight: 500 }}>{new Date(r.play_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                    <span style={{ fontWeight: 600 }}>{r.tee_time}</span>
                    <a href="#weather" style={{ textDecoration: 'none', fontSize: '1rem', lineHeight: 1 }} title="Weather forecast">⛅</a>
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

        {/* Weather forecast */}
        {(rounds ?? []).length > 0 && (
          <CourseWeather
            slug={slug}
            rounds={(rounds ?? []).map(r => ({
              id: r.id,
              round_no: r.round_no,
              play_date: r.play_date,
              tee_time: r.tee_time,
              in_competition: r.in_competition,
            }))}
          />
        )}

        {isAdmin && <CourseEditPanel course={course} />}
      </div>
    </div>
  );
}
