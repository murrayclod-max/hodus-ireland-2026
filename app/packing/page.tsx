import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { PackingCategory, PackingItem, Player } from '@/lib/types';
import PackingClient from './PackingClient';

export const revalidate = 0;

export default async function PackingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('id, first_name').eq('auth_user_id', user.id).maybeSingle() as { data: Pick<Player, 'id' | 'first_name'> | null };

  const db = me ? supabase : createServiceClient();

  const [{ data: categories }, { data: items }, checkRes] = await Promise.all([
    db.from('packing_categories').select('*').order('sort'),
    db.from('packing_items').select('*').order('sort'),
    me
      ? db.from('packing_checks').select('item_id').eq('player_id', me.id)
      : Promise.resolve({ data: [] as { item_id: string }[] }),
  ]);

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>Packing</h1>
          <p className="sub">Shared list — anyone can edit it. The ticks are yours alone.</p>
        </div>
      </div>

      <PackingClient
        playerId={me?.id ?? null}
        categories={(categories as PackingCategory[]) ?? []}
        items={(items as PackingItem[]) ?? []}
        checkedIds={((checkRes.data as { item_id: string }[] | null) ?? []).map(c => c.item_id)}
      />
    </div>
  );
}
