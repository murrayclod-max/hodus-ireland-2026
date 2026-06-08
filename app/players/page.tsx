import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { initials } from '@/lib/utils';
import type { Player } from '@/lib/types';

export const revalidate = 300;

export default async function PlayersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('id').eq('auth_user_id', user.id).maybeSingle();
  const db = me ? supabase : createServiceClient();

  const { data: players } = await db
    .from('players').select('*').order('team').order('handicap_index') as { data: Player[] | null };

  const murray = (players ?? []).filter(p => p.team === 'murray');
  const harris = (players ?? []).filter(p => p.team === 'harris');

  const murrayIdx = murray.reduce((s, p) => s + (p.handicap_index ?? 0), 0);
  const harrisIdx = harris.reduce((s, p) => s + (p.handicap_index ?? 0), 0);

  function TeamGrid({ team, label, color, totalIdx }: { team: Player[]; label: string; color: string; totalIdx: number }) {
    return (
      <div>
        <div style={{
          background: color, color: '#fff', borderRadius: 'var(--r-md)',
          padding: '8px 14px', marginBottom: 'var(--s-3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>Team {label}</span>
          <span style={{ fontSize: '0.82rem', opacity: 0.8 }}>Σ {totalIdx.toFixed(1)}</span>
        </div>
        <div className="stack-sm">
          {team.map(p => (
            <Link key={p.id} href={`/players/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
                <div className="avatar avatar-md">
                  {p.avatar_url
                    ? <Image src={p.avatar_url} alt={p.name} width={48} height={48} />
                    : <div className="avatar-initials" style={{ fontSize: '0.85rem' }}>{initials(p.name)}</div>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{p.name}{p.is_captain && <span className="chip chip-gilt" style={{ marginLeft: 6 }}>C</span>}</div>
                  {p.nickname && <div className="small muted">&ldquo;{p.nickname}&rdquo;</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>{p.handicap_index ?? '—'}</div>
                  <div className="small muted">index</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>Players</h1>
          <p className="sub">12 men · 2 teams · 6 rounds</p>
        </div>
      </div>

      <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>
        <TeamGrid team={murray} label="Murray" color="var(--green)" totalIdx={murrayIdx} />
        <TeamGrid team={harris} label="Harris" color="var(--rail-portrush)" totalIdx={harrisIdx} />
      </div>
    </div>
  );
}
