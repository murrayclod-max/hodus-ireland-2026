import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { Player } from '@/lib/types';
import AdminPlayerList from './AdminPlayerEditor';
import Link from 'next/link';

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('is_admin').eq('auth_user_id', user.id).maybeSingle();
  if (!me?.is_admin) redirect('/settings');

  const service = createServiceClient();

  const { data: players } = await service
    .from('players').select('*').order('team').order('name') as { data: Player[] | null };

  // Fetch auth users to get emails
  const { data: { users } } = await service.auth.admin.listUsers({ perPage: 200 });
  const emailMap = new Map(users.map(u => [u.id, u.email ?? '']));

  const adminPlayers = (players ?? []).map(p => ({
    ...p,
    currentEmail: p.auth_user_id ? (emailMap.get(p.auth_user_id) ?? '') : '',
  }));

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>Player Management</h1>
          <p className="sub">Edit profiles, GHINs, emails &amp; photos</p>
        </div>
      </div>

      <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>
        <AdminPlayerList players={adminPlayers} />

        <Link href="/settings" style={{ color: 'var(--mute)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Back to Settings
        </Link>
      </div>
    </div>
  );
}
