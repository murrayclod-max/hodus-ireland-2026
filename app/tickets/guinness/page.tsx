import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';

export const revalidate = 0;

const TICKET_DIR = 'tickets/guinness';
const TICKET_FILES = Array.from({ length: 9 }, (_, i) => `ticket-${i + 1}.png`);

// Hide tickets whose image hasn't been dropped in yet. If the filesystem isn't
// readable (some serverless runtimes), fall back to showing all nine.
function availableTickets() {
  try {
    const dir = path.join(process.cwd(), 'public', TICKET_DIR);
    const onDisk = new Set(fs.readdirSync(dir));
    return TICKET_FILES.filter(f => onDisk.has(f));
  } catch {
    return TICKET_FILES;
  }
}

export default async function GuinnessTicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const tickets = availableTickets();

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>Guinness Storehouse</h1>
          <p className="sub">Fri 11 Sept 2026 · 2:45 pm · St James&rsquo;s Gate, Dublin 8</p>
        </div>
      </div>

      <div className="wrap stack" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>

        <div className="card">
          <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Booking</p>
          <div className="stack-sm">
            <div className="row-between small"><span className="muted">Reference</span><span style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>904474457</span></div>
            <div className="row-between small"><span className="muted">Experience</span><span>Guinness Storehouse Experience</span></div>
            <div className="row-between small"><span className="muted">Guests</span><span>9 adults</span></div>
            <div className="row-between small"><span className="muted">Booked by</span><span>Matt Hodus</span></div>
            <div className="row-between small"><span className="muted">Duration</span><span>Self-guided, ~90 mins</span></div>
          </div>
          <p className="small muted" style={{ marginTop: 'var(--s-3)' }}>
            Arrive inside your 15-minute slot or the booking rolls to the next available time. Tickets are non-refundable.
            Storehouse: +353 1 408 4800 · info@guinnessstorehouse.com
          </p>
        </div>

        <div>
          <p className="section-label" style={{ marginBottom: 'var(--s-2)' }}>Tickets — show a code at the door</p>
          {tickets.length === 0 ? (
            <div className="card">
              <p className="small muted">
                The nine ticket codes haven&rsquo;t been loaded yet. Until they are, show Matt&rsquo;s confirmation
                email or quote booking reference <strong>904474457</strong> at the door.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--s-3)' }}>
              {tickets.map((file, i) => (
                <div key={file} className="card" style={{ padding: 'var(--s-3)', textAlign: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/${TICKET_DIR}/${file}`}
                    alt={`Guinness Storehouse adult ticket ${i + 1}`}
                    style={{ width: '100%', borderRadius: 'var(--r-md)', display: 'block' }}
                  />
                  <p className="small muted" style={{ marginTop: 'var(--s-2)' }}>Adult ticket {i + 1}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ background: 'rgba(201,162,75,.08)', borderColor: 'var(--gilt)' }}>
          <p style={{ fontWeight: 500 }}>🍺 Day one, nine men</p>
          <p className="small muted" style={{ marginTop: 4 }}>
            Only the nine of us on the ground for the Friday. Storehouse at 2:45, then FIRE Steakhouse at 7:45.
          </p>
        </div>

        <Link href="/trip" className="btn btn-secondary btn-block">← Back to the trip</Link>
      </div>
    </div>
  );
}
