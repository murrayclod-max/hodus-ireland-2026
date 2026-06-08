import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface UpdateBody {
  playerId: string;
  name?: string;
  ghin?: string;
  homeClub?: string;
  bio?: string;
  nickname?: string;
  phone?: string;
  team?: string;
  email?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: me } = await supabase
    .from('players').select('is_admin').eq('auth_user_id', user.id).maybeSingle();
  if (!me?.is_admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = (await req.json()) as UpdateBody;
  const service = createServiceClient();

  const { data: player } = await service
    .from('players').select('id, auth_user_id').eq('id', body.playerId).maybeSingle();
  if (!player) return NextResponse.json({ error: 'player not found' }, { status: 404 });

  // Update players table
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name.trim();
  if (body.ghin !== undefined) patch.ghin = body.ghin.trim() || null;
  if (body.homeClub !== undefined) patch.home_club = body.homeClub.trim() || null;
  if (body.bio !== undefined) patch.bio = body.bio.trim() || null;
  if (body.nickname !== undefined) patch.nickname = body.nickname.trim() || null;
  if (body.phone !== undefined) patch.phone = body.phone.trim() || null;
  if (body.team !== undefined) patch.team = body.team;

  if (Object.keys(patch).length > 0) {
    const { error } = await service.from('players').update(patch).eq('id', body.playerId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update auth.users (email / password) — requires service role
  if (player.auth_user_id && (body.email || body.password)) {
    const authPatch: { email?: string; password?: string } = {};
    if (body.email?.trim()) authPatch.email = body.email.trim();
    if (body.password?.trim()) authPatch.password = body.password.trim();
    const { error } = await service.auth.admin.updateUserById(player.auth_user_id, authPatch);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
