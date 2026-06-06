import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Message, Photo, Player, Round } from '@/lib/types';
import FeedClient from './FeedClient';

export const revalidate = 0;

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('players').select('id, name, is_admin').eq('auth_user_id', user.id).maybeSingle() as { data: Pick<Player, 'id' | 'name' | 'is_admin'> | null };

  const { data: messages } = await supabase
    .from('messages')
    .select('*, players(id, name, first_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(100) as { data: (Message & { players: Player })[] | null };

  const { data: photos } = await supabase
    .from('photos')
    .select('*, players(id, name, first_name, avatar_url), rounds(round_no, courses(name))')
    .order('created_at', { ascending: false })
    .limit(50) as { data: (Photo & { players: Player; rounds: any })[] | null };

  const { data: rounds } = await supabase
    .from('rounds').select('id, round_no, courses(name)').order('round_no') as { data: (Pick<Round, 'id' | 'round_no'> & { courses: any })[] | null };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>Feed</h1>
          <p className="sub">Messages &amp; photos from the lads</p>
        </div>
      </div>
      <FeedClient
        messages={messages ?? []}
        photos={photos ?? []}
        rounds={rounds ?? []}
        myPlayerId={me?.id ?? null}
        myName={me?.name ?? ''}
        isAdmin={!!me?.is_admin}
        supabaseUrl={supabaseUrl}
      />
    </div>
  );
}
