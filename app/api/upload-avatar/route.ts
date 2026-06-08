import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: me } = await supabase
    .from('players').select('id, is_admin').eq('auth_user_id', user.id).maybeSingle();
  if (!me) return NextResponse.json({ error: 'player not found' }, { status: 403 });

  const targetPlayerId = new URL(req.url).searchParams.get('playerId') ?? me.id;
  if (targetPlayerId !== me.id && !me.is_admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const service = createServiceClient();

  const path = `avatars/${targetPlayerId}.jpg`;
  const { error } = await service.storage.from('photos').upload(
    path,
    Buffer.from(bytes),
    { upsert: true, contentType: 'image/jpeg' },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
  await service.from('players').update({ avatar_url: avatarUrl }).eq('id', targetPlayerId);

  return NextResponse.json({ ok: true, avatarUrl });
}
