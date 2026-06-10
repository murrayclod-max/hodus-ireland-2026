import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lassId = searchParams.get('lass_id');
  if (!lassId) return NextResponse.json({ error: 'Missing lass_id' }, { status: 400 });

  const { data: votes } = await supabase
    .from('lass_votes')
    .select('vote, user_id')
    .eq('lass_id', lassId);

  if (!votes?.length) return NextResponse.json({ upvoters: [], downvoters: [] });

  const userIds = votes.map(v => v.user_id);

  const { data: players } = await supabase
    .from('players')
    .select('auth_user_id, first_name')
    .in('auth_user_id', userIds);

  const nameMap = new Map((players ?? []).map(p => [p.auth_user_id, p.first_name ?? 'Someone']));

  const upvoters   = votes.filter(v => v.vote ===  1).map(v => nameMap.get(v.user_id) ?? 'Someone');
  const downvoters = votes.filter(v => v.vote === -1).map(v => nameMap.get(v.user_id) ?? 'Someone');

  return NextResponse.json({ upvoters, downvoters });
}
