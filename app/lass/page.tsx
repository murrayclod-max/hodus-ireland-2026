import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LassAdminPanel from '@/components/LassAdminPanel';

export const revalidate = 300; // re-check every 5 min; cron publishes once daily

interface LassRow {
  id: string;
  day_number: number;
  profession: string;
  county: string;
  image_url: string;
  created_at: string;
}

export default async function LassPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: player } = await supabase
    .from('players').select('is_admin').eq('auth_user_id', user.id).maybeSingle();
  const isAdmin = !!player?.is_admin;
  const db = player ? supabase : createServiceClient();

  const { data: latest } = await db
    .from('lass_of_the_day')
    .select('id, day_number, profession, county, image_url, created_at')
    .eq('status', 'published')
    .order('day_number', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: LassRow | null };

  const { data: archive } = await db
    .from('lass_of_the_day')
    .select('id, day_number, profession, county, image_url')
    .eq('status', 'published')
    .order('day_number', { ascending: false })
    .limit(30) as { data: LassRow[] | null };

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>Lass of the Day</h1>
          <p className="sub">A new Irish woman every day</p>
        </div>
      </div>

      <div style={{ paddingBottom: 'var(--s-6)' }}>

        {!latest ? (
          <div className="wrap" style={{ paddingTop: 'var(--s-6)', textAlign: 'center' }}>
            <p style={{ fontSize: '3rem', marginBottom: 'var(--s-3)' }}>☘️</p>
            <p className="muted">Today's lass hasn't arrived yet — check back after 3 am ET.</p>
            {isAdmin && (
              <div style={{ marginTop: 'var(--s-5)' }}>
                <LassAdminPanel />
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Hero image — full-bleed portrait */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={latest.image_url}
                alt={`${latest.profession} from Co. ${latest.county}`}
                style={{ width: '100%', display: 'block', aspectRatio: '9/16', objectFit: 'cover' }}
              />
              {/* Caption overlay */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                padding: 'var(--s-6) var(--s-4) var(--s-4)',
                color: '#fff',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', textTransform: 'capitalize' }}>
                  {latest.profession}
                </div>
                <div style={{ fontSize: '0.88rem', opacity: 0.85, marginTop: 2 }}>
                  County {latest.county} · Day {latest.day_number}
                </div>
              </div>
            </div>

            {/* Admin panel */}
            {isAdmin && (
              <div className="wrap" style={{ marginTop: 'var(--s-5)' }}>
                <LassAdminPanel currentDayNumber={latest.day_number} />
              </div>
            )}

            {/* Archive grid */}
            {(archive ?? []).length > 1 && (
              <div className="wrap" style={{ marginTop: 'var(--s-5)' }}>
                <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Archive</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--s-2)' }}>
                  {(archive ?? []).slice(1).map(row => (
                    <div key={row.id} style={{ position: 'relative', borderRadius: 'var(--r-md)', overflow: 'hidden', aspectRatio: '9/16' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.image_url}
                        alt={row.profession}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'rgba(0,0,0,0.55)',
                        padding: '4px 6px',
                        fontSize: '0.6rem', color: '#fff', fontWeight: 600,
                        textTransform: 'capitalize',
                      }}>
                        {row.profession}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
