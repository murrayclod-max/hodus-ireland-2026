import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate, kindIcon } from '@/lib/utils';
import type { ItineraryItem, Player } from '@/lib/types';
import EditItineraryItem from './EditItineraryItem';

export const revalidate = 60;

function groupByDate(items: ItineraryItem[]) {
  const map = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    const list = map.get(item.day_date) ?? [];
    list.push(item);
    map.set(item.day_date, list);
  }
  return map;
}

export default async function TripPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: player } = await supabase
    .from('players').select('is_admin').eq('auth_user_id', user.id).maybeSingle() as { data: Pick<Player, 'is_admin'> | null };
  const isAdmin = !!player?.is_admin;
  const db = player ? supabase : createServiceClient();

  const [{ data: items }, { data: rounds }] = await Promise.all([
    db.from('itinerary_items').select('*').order('day_date').order('sort'),
    db.from('rounds').select('play_date, courses(slug)').order('play_date'),
  ]);

  // Build date → course slug for weather links
  const slugByDate = new Map<string, string>();
  for (const r of (rounds ?? []) as unknown as { play_date: string; courses: { slug: string } | null }[]) {
    const slug = Array.isArray(r.courses) ? r.courses[0]?.slug : r.courses?.slug;
    if (slug && !slugByDate.has(r.play_date)) slugByDate.set(r.play_date, slug);
  }

  const grouped = groupByDate((items as ItineraryItem[]) ?? []);
  const dates = Array.from(grouped.keys()).sort();

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>The Trip</h1>
          <p className="sub">Sept 13–20, 2026 · Northern Ireland &amp; Donegal</p>
        </div>
      </div>

      <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>

        {/* Trip summary */}
        <div className="card">
          <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Hotels</p>
          <div className="stack-sm">
            <div className="row"><span style={{ fontSize: '1.1rem' }}>🏨</span><div><div style={{ fontWeight: 500 }}>Slieve Donard Resort</div><div className="small muted">Newcastle — Sun/Mon nights</div></div></div>
            <div className="row"><span style={{ fontSize: '1.1rem' }}>🏨</span><div><div style={{ fontWeight: 500 }}>Golflinks Hotel Portrush</div><div className="small muted">Portrush — Tue/Wed nights</div></div></div>
            <div className="row"><span style={{ fontSize: '1.1rem' }}>🏨</span><div><div style={{ fontWeight: 500 }}>Rosapenna (self-arranged)</div><div className="small muted">Donegal — Thu/Fri/Sat nights</div></div></div>
            <div className="row"><span style={{ fontSize: '1.1rem' }}>🏨</span><div><div style={{ fontWeight: 500 }}>Radisson Blu Dublin Airport</div><div className="small muted">Sat night (last night)</div></div></div>
          </div>
        </div>

        {/* Day-by-day itinerary */}
        {dates.map(date => {
          const dayItems = grouped.get(date)!;
          return (
            <div key={date}>
              <div style={{
                background: 'var(--green)', color: '#fff',
                borderRadius: 'var(--r-md)', padding: '6px 12px',
                fontFamily: 'var(--font-display)', fontWeight: 600,
                marginBottom: 'var(--s-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{formatDate(date)}</span>
                <Link
                  href={slugByDate.has(date) ? `/courses/${slugByDate.get(date)}#weather` : '/weather'}
                  style={{ textDecoration: 'none', fontSize: '1rem', opacity: 0.85, lineHeight: 1 }}
                  title="Weather forecast"
                >⛅</Link>
              </div>
              <div className="stack-sm">
                {dayItems.map(item => (
                  <div key={item.id} className="card" style={{ position: 'relative' }}>
                    <div className="row-between">
                      <div className="row" style={{ gap: 'var(--s-2)', flex: 1 }}>
                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{kindIcon(item.kind)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{item.title}</div>
                          {item.detail && <p className="small muted" style={{ marginTop: 2 }}>{item.detail}</p>}
                        </div>
                      </div>
                      {isAdmin && <EditItineraryItem item={item} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {isAdmin && (
          <Link href="/trip/new" className="btn btn-secondary btn-block">+ Add itinerary item</Link>
        )}

        <div className="card" style={{ background: 'rgba(201,162,75,.08)', borderColor: 'var(--gilt)' }}>
          <p style={{ fontWeight: 500 }}>📞 Booked through <strong>Hidden Links</strong></p>
          <p className="small muted" style={{ marginTop: 4 }}>Rosapenna (Rounds 4–6) is self-arranged through the hotel directly.</p>
        </div>
      </div>
    </div>
  );
}
