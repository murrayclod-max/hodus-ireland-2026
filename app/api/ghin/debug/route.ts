/**
 * GET /api/ghin/debug?ghin=444527
 * Admin-only: returns the raw GHIN scores API response for a given GHIN number.
 * Used to diagnose why rounds aren't saving.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginGhin } from '@/lib/ghin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const GHIN_API = 'https://api2.ghin.com/api/v1';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: me } = await supabase
    .from('players').select('is_admin').eq('auth_user_id', user.id).maybeSingle();
  if (!me?.is_admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ghin = req.nextUrl.searchParams.get('ghin');
  if (!ghin) return NextResponse.json({ error: 'ghin param required' }, { status: 400 });

  const token = await loginGhin();
  const res = await fetch(
    `${GHIN_API}/golfers/${encodeURIComponent(ghin)}/scores.json?per_page=5&page=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    }
  );
  const raw = await res.json();
  return NextResponse.json(raw);
}
