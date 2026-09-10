import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { formatInZone, isGuest } from '@/lib/utils';
import type { Player } from '@/lib/types';

export const revalidate = 0;

function since(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return `${Math.round(days / 30)} mo ago`;
}

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('is_admin').eq('auth_user_id', user.id).maybeSingle() as { data: Pick<Player, 'is_admin'> | null };

  // Admins only — anyone else gets a 404 rather than a locked door
  if (!me?.is_admin) notFound();

  const admin = createServiceClient();
  const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const { data: players } = await admin
    .from('players').select('*').order('name') as { data: Player[] | null };

  const rows = (players ?? []).map(p => {
    const account = authList.users.find(u => u.id === p.auth_user_id);
    return {
      name: p.name,
      team: p.team,
      isAdmin: p.is_admin,
      guest: isGuest(p),
      email: account?.email ?? null,
      lastSignIn: account?.last_sign_in_at ?? null,
      created: account?.created_at ?? null,
      mustReset: p.must_reset_password,
      hasAccount: !!account,
    };
  });

  // Any login with no player row attached — shouldn't happen, but worth seeing
  const orphans = authList.users.filter(u => !(players ?? []).some(p => p.auth_user_id === u.id));

  const signedIn = rows.filter(r => r.lastSignIn)
    .sort((a, b) => new Date(b.lastSignIn!).getTime() - new Date(a.lastSignIn!).getTime());
  const never = rows.filter(r => !r.lastSignIn);
  const activeWeek = signedIn.filter(r => Date.now() - new Date(r.lastSignIn!).getTime() < 7 * 86400000).length;

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>Who has logged in</h1>
          <p className="sub">Admin only · times are Irish (IST)</p>
        </div>
      </div>

      <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>

        <div className="card">
          <div style={{ display: 'flex', gap: 'var(--s-6)', flexWrap: 'wrap' }}>
            <div className="stat-block">
              <div className="stat-label">Have signed in</div>
              <div className="stat-value">{signedIn.length}<span style={{ fontSize: '1rem', color: 'var(--mute)' }}>/{rows.length}</span></div>
            </div>
            <div className="stat-block">
              <div className="stat-label">This week</div>
              <div className="stat-value">{activeWeek}</div>
            </div>
            <div className="stat-block">
              <div className="stat-label">Never</div>
              <div className="stat-value">{never.length}</div>
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 'var(--s-3)' }}>
            Supabase records the most recent sign-in per account, not every visit — so this is who has been in and when
            they were last here, not a full history.
          </p>
        </div>

        <div>
          <p className="section-label" style={{ marginBottom: 'var(--s-2)' }}>Signed in</p>
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="ht">
              <thead>
                <tr><th>Who</th><th>Last seen</th><th>When</th></tr>
              </thead>
              <tbody>
                {signedIn.map(r => (
                  <tr key={r.name}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {r.name}
                        {r.isAdmin && <span className="chip chip-gilt" style={{ marginLeft: 6 }}>admin</span>}
                        {r.guest && <span className="chip chip-neutral" style={{ marginLeft: 6 }}>guest</span>}
                        {r.mustReset && <span className="chip chip-danger" style={{ marginLeft: 6 }}>reset pending</span>}
                      </div>
                      <div className="small muted">{r.email}</div>
                    </td>
                    <td className="small">{since(r.lastSignIn!)}</td>
                    <td className="small muted" style={{ whiteSpace: 'nowrap' }}>{formatInZone(r.lastSignIn!, 'Europe/Dublin')}</td>
                  </tr>
                ))}
                {signedIn.length === 0 && (
                  <tr><td colSpan={3} className="small muted" style={{ padding: 'var(--s-4)' }}>Nobody yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <p className="section-label" style={{ marginBottom: 'var(--s-2)' }}>Never signed in</p>
          {never.length === 0 ? (
            <div className="card"><p className="small muted">Everyone has been in.</p></div>
          ) : (
            <div className="card">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
                {never.map(r => (
                  <span key={r.name} className="chip chip-neutral" title={r.email ?? 'no account'}>
                    {r.name}{!r.hasAccount && ' · no login'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {orphans.length > 0 && (
          <div>
            <p className="section-label" style={{ marginBottom: 'var(--s-2)' }}>Logins with no player row</p>
            <div className="card">
              <div className="stack-sm">
                {orphans.map(u => (
                  <div key={u.id} className="row-between small">
                    <span>{u.email}</span>
                    <span className="muted">{u.last_sign_in_at ? formatInZone(u.last_sign_in_at, 'Europe/Dublin') : 'never signed in'}</span>
                  </div>
                ))}
              </div>
              <p className="small muted" style={{ marginTop: 'var(--s-3)' }}>
                These accounts can sign in but see nothing — every table is gated behind having a player row.
              </p>
            </div>
          </div>
        )}

        <Link href="/admin" className="btn btn-secondary btn-block">← Admin</Link>
      </div>
    </div>
  );
}
