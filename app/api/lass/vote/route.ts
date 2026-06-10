import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { lass_id, vote } = await request.json() as { lass_id: string; vote: 1 | -1 };
  if (!lass_id || (vote !== 1 && vote !== -1)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Check existing vote — once cast, locked in, no flipping or toggling
  const { data: existing } = await supabase
    .from('lass_votes')
    .select('id, vote')
    .eq('lass_id', lass_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    // Already voted — return current state, no change
    const { data: votes } = await supabase
      .from('lass_votes').select('vote, user_id').eq('lass_id', lass_id);
    return NextResponse.json({
      upvotes:   (votes ?? []).filter(v => v.vote ===  1).length,
      downvotes: (votes ?? []).filter(v => v.vote === -1).length,
      userVote:  existing.vote,
      locked:    true,
    });
  }

  await supabase.from('lass_votes').insert({ lass_id, user_id: user.id, vote });

  const { data: votes } = await supabase
    .from('lass_votes').select('vote, user_id').eq('lass_id', lass_id);

  return NextResponse.json({
    upvotes:   (votes ?? []).filter(v => v.vote ===  1).length,
    downvotes: (votes ?? []).filter(v => v.vote === -1).length,
    userVote:  vote,
    locked:    true,
  });
}
