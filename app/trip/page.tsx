import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate, kindIcon } from '@/lib/utils';
import type { ItineraryItem, Player } from '@/lib/types';
import EditItineraryItem from './EditItineraryItem';

export const revalidate = 60;

// Turn URLs and in-app paths inside an itinerary detail into tappable links
const LINK_RE = /(https?:\/\/[^\s]+|(?:^|(?<=\s))\/[a-z][a-z0-9\-/]*)/gi;

function linkify(text: string) {
  return text.split(LINK_RE).map((part, i) => {
    if (!/^(https?:\/\/|\/[a-z])/i.test(part)) return part;
    const href = part.replace(/[.,;:]$/, '');
    const label = href.startsWith('/') ? 'View tickets →' : href;
    return (
      <Link key={i} href={href} style={{ color: 'var(--green)', fontWeight: 600 }}>{label}</Link>
    );
  });
}

const HOTELS = [
  {
    name: 'The Grafton Hotel · Dublin',
    nights: 'Fri 11 & Sat 12 Sept — pre-trip nights',
    address: '31–32 Stephen Street Lower, Dublin 2, D02 WV05',
    phone: '+353 1 255 2700',
    tel: '+35312552700',
    email: 'reservations@thegrafton.ie',
    note: 'Booked by David Harris · check-in 3:00pm',
  },
  {
    name: 'Slieve Donard Resort & Spa',
    nights: 'Sun 13 & Mon 14 Sept',
    address: 'Downs Road, Newcastle, Co. Down, BT33 0AH',
    phone: '+44 28 4372 1066',
    tel: '+442843721066',
    email: 'info@slievedonard.co.uk',
    note: '6 standard Slieve twin rooms · breakfast included',
  },
  {
    name: 'Golflinks Hotel Portrush',
    nights: 'Tue 15 & Wed 16 Sept',
    address: 'Bushmills Road, Portrush, Co. Antrim, BT56 8JQ',
    phone: '+44 28 7082 6611',
    tel: '+442870826611',
    email: 'info@golflinkshotel.com',
    note: '6 standard twin rooms · breakfast included · The White Pheasant is in-house',
  },
  {
    name: 'Rosapenna Hotel & Golf Resort',
    nights: 'Thu 17 & Fri 18 Sept',
    address: 'Downings, Co. Donegal, F92 PN73',
    phone: '+353 74 915 5301',
    tel: '+353749155301',
    email: 'reservations@rosapenna.ie',
    note: 'Self-arranged through the hotel · settle your bill before Saturday golf',
  },
  {
    name: 'Clayton Hotel Dublin Airport Central',
    nights: 'Sat 19 Sept — last night',
    address: 'Corballis, Dublin Airport, Co. Dublin, K67 H5H9',
    phone: '+353 1 844 6000',
    tel: '+35318446000',
    email: 'reservations.dacentral@claytonhotels.com',
    note: 'Formerly the Radisson Blu · complimentary shuttle to the terminal',
  },
];

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
          <p className="sub">Sept 11–20, 2026 · Dublin · Northern Ireland · Donegal</p>
        </div>
      </div>

      <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>

        {/* Who to call — driver + tour operator, kept at the top on purpose */}
        <div className="card" style={{ borderColor: 'var(--green)', borderWidth: 1.5 }}>
          <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Who to Call</p>
          <div className="stack-sm">
            <div className="row">
              <span style={{ fontSize: '1.1rem' }}>🚌</span>
              <div>
                <div style={{ fontWeight: 600 }}>Virginius — coach driver</div>
                <div className="small muted">
                  <a href="tel:+353861795648" style={{ color: 'var(--green)', fontWeight: 600 }}>+353 86 179 5648</a> · with us Sep 13–19
                </div>
              </div>
            </div>
            <div className="row">
              <span style={{ fontSize: '1.1rem' }}>📋</span>
              <div>
                <div style={{ fontWeight: 600 }}>Vari — Hidden Links Ireland</div>
                <div className="small muted">
                  <a href="tel:+3533866933369" style={{ color: 'var(--green)', fontWeight: 600 }}>+353 386 693 3369</a> ·{' '}
                  <a href="mailto:ireland@hiddenlinksgolf.com" style={{ color: 'var(--green)' }}>ireland@hiddenlinksgolf.com</a>
                </div>
              </div>
            </div>
            <div className="row">
              <span style={{ fontSize: '1.1rem' }}>📋</span>
              <div>
                <div style={{ fontWeight: 600 }}>Meredith Emerson — Hidden Links (US)</div>
                <div className="small muted">
                  <a href="tel:+16784444267" style={{ color: 'var(--green)', fontWeight: 600 }}>(678) 444-4267</a> ·{' '}
                  <a href="mailto:memerson@hiddenlinksgolf.com" style={{ color: 'var(--green)' }}>memerson@hiddenlinksgolf.com</a>
                </div>
              </div>
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 'var(--s-3)' }}>
            Bus problem, late tee time, lost bag — Virginius first, Vari second.
          </p>
        </div>

        {/* Hotels — nights, address, and how to reach the front desk */}
        <div className="card">
          <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Hotels</p>
          <div className="stack">
            {HOTELS.map(hotel => (
              <div key={hotel.name} className="row" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1.4 }}>🏨</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{hotel.name}</div>
                  <div className="small muted">{hotel.nights}</div>
                  <div className="small muted" style={{ marginTop: 2 }}>{hotel.address}</div>
                  <div className="small" style={{ marginTop: 2 }}>
                    <a href={`tel:${hotel.tel}`} style={{ color: 'var(--green)', fontWeight: 600 }}>{hotel.phone}</a>
                    {' · '}
                    <a href={`mailto:${hotel.email}`} style={{ color: 'var(--green)', overflowWrap: 'anywhere' }}>{hotel.email}</a>
                  </div>
                  {hotel.note && <div className="small muted" style={{ marginTop: 2 }}>{hotel.note}</div>}
                </div>
              </div>
            ))}
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
                  style={{
                    textDecoration: 'none', fontSize: '1rem', lineHeight: 1,
                    background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--r-pill)',
                    padding: '4px 8px', display: 'inline-flex', alignItems: 'center',
                  }}
                  title="Weather forecast"
                >⛅</Link>
              </div>
              <div className="stack-sm">
                {dayItems.map(item => (
                  <div key={item.id} className="card" style={{ position: 'relative' }}>
                    <div className="row-between">
                      <div className="row" style={{ gap: 'var(--s-2)', flex: 1 }}>
                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{
                          // Detect restaurant/dining notes by title keywords
                          item.kind === 'note' && /guinness|brewery|distillery/i.test(item.title)
                            ? '🍺'
                            : item.kind === 'note' && /dinner|steakhouse|bistro|pub crawl|restaurant|bar(?!\w)/i.test(item.title)
                              ? '🍽️'
                              : kindIcon(item.kind)
                        }</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{item.title}</div>
                          {item.detail && <p className="small muted" style={{ marginTop: 2 }}>{linkify(item.detail)}</p>}
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
          <p className="small muted" style={{ marginTop: 4 }}>Dinner reservations need at least 24 hours&rsquo; notice to cancel — call the restaurant, not Vari.</p>
        </div>

        {/* Cash & Caddies */}
        <div className="card">
          <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Cash — Read This One</p>
          <p className="small" style={{ marginBottom: 'var(--s-3)', fontWeight: 600 }}>Roughly £300 and €500 each covers the week. ATMs are everywhere — ask Virginius to stop and top up rather than carrying the lot from home.</p>
          <p className="small muted" style={{ marginBottom: 'var(--s-3)' }}>Cash is for caddies and the driver&rsquo;s tip; cards are fine for everything else. Caddies are paid directly, in cash, straight after each round. Royal County Down has no ATM on site.</p>

          <p className="small" style={{ fontWeight: 600, marginBottom: 'var(--s-2)' }}>Caddie fees — single bag, per Hidden Links</p>
          <div className="stack-sm">
            <div className="row-between small"><span className="muted">Royal County Down</span><span>£75 + tip</span></div>
            <div className="row-between small"><span className="muted">Royal Portrush</span><span>£80 + tip</span></div>
            <div className="row-between small"><span className="muted">Portstewart</span><span>£70 + tip</span></div>
            <div className="row-between small"><span className="muted">Rosapenna (×3)</span><span>€90/round + tip · self-arranged</span></div>
            <div className="row-between small"><span className="muted">Portmarnock</span><span>no caddies requested</span></div>
          </div>

          <div className="stack-sm small" style={{ marginTop: 'var(--s-3)', paddingTop: 'var(--s-3)', borderTop: '1px solid var(--border)' }}>
            <div><strong>Caddie tip: 25–35% on top of the fee.</strong> <span className="muted">So about £19–26 at County Down, £20–28 at Portrush, £18–25 at Portstewart. Double-check rates with the caddie master on the first tee — they&rsquo;re the last word.</span></div>
            <div><strong>Driver tip: €15–20 per man, per day.</strong> <span className="muted">Virginius is with us Sep 13–19, so budget €105–140 each, handed over at the end of the trip.</span></div>
            <div className="muted">Caddies are requested at every club but never guaranteed. If a club runs short on the day they may send double-bag caddies instead.</div>
          </div>

          <div className="stack-sm" style={{ marginTop: 'var(--s-3)', paddingTop: 'var(--s-3)', borderTop: '1px solid var(--border)' }}>
            <div className="row-between small"><span className="muted">Sat 12</span><span>Portmarnock — euros</span></div>
            <div className="row-between small"><span className="muted">Sun 13 – Wed 16</span><span>Newcastle &amp; Portrush — pounds</span></div>
            <div className="row-between small"><span className="muted">Thu 17 – Sun 20</span><span>Rosapenna &amp; Dublin — euros</span></div>
          </div>
        </div>

        {/* Key Contacts */}
        <div className="card">
          <p className="section-label" style={{ marginBottom: 'var(--s-1)' }}>Key Contacts</p>
          <p className="small muted" style={{ marginBottom: 'var(--s-3)' }}>Driver and Hidden Links are at the top of this page; hotels are in the Hotels card.</p>
          <div className="stack-sm">
            <div className="row"><span style={{ fontSize: '1rem' }}>⛳</span><div><div style={{ fontWeight: 500 }}>Royal County Down</div><div className="small muted">+44 28 4372 3314</div></div></div>
            <div className="row"><span style={{ fontSize: '1rem' }}>⛳</span><div><div style={{ fontWeight: 500 }}>Portstewart Golf Club</div><div className="small muted">+44 28 7083 2015</div></div></div>
            <div className="row"><span style={{ fontSize: '1rem' }}>🍺</span><div><div style={{ fontWeight: 500 }}>Guinness Storehouse</div><div className="small muted">+353 1 408 4800 · Ref 904474457 · <Link href="/tickets/guinness" style={{ color: 'var(--green)', fontWeight: 600 }}>tickets</Link></div></div></div>
            <div className="row"><span style={{ fontSize: '1rem' }}>🍽</span><div><div style={{ fontWeight: 500 }}>The Olde Glen, Carrickart</div><div className="small muted">+353 83 158 5777</div></div></div>
            <div className="row"><span style={{ fontSize: '1rem' }}>🍽</span><div><div style={{ fontWeight: 500 }}>Villa Vinci, Newcastle</div><div className="small muted">+44 28 4372 3080</div></div></div>
            <div className="row"><span style={{ fontSize: '1rem' }}>🍽</span><div><div style={{ fontWeight: 500 }}>The White Pheasant, Portrush</div><div className="small muted">+44 28 7082 6611</div></div></div>
          </div>
        </div>

        {/* UK ETA reminder */}
        <div className="card" style={{ background: 'rgba(201,162,75,.08)', borderColor: 'var(--gilt)' }}>
          <p style={{ fontWeight: 500 }}>🛂 UK ETA Required for Northern Ireland</p>
          <p className="small muted" style={{ marginTop: 4 }}>£20 · "UK ETA" app · Approved in minutes. Get it before you fly — not the morning of.</p>
        </div>
      </div>
    </div>
  );
}
