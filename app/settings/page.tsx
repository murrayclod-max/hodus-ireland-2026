import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Player } from '@/lib/types';
import ProfileEditor from './ProfileEditor';

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: player } = await supabase
    .from('players').select('*').eq('auth_user_id', user.id).maybeSingle() as { data: Player | null };

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>My Profile</h1>
          <p className="sub">{user.email}</p>
        </div>
      </div>
      <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>
        {player ? (
          <ProfileEditor player={player} userId={user.id} />
        ) : (
          <div className="card">
            <p>Your account is not linked to a player yet. Contact Dan Murray.</p>
          </div>
        )}

        {/* Sign out */}
        <form action="/api/auth/sign-out" method="post">
          <button type="submit" className="btn btn-ghost btn-block" style={{ color: 'var(--mute)' }}>
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
