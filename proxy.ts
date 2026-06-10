import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // api/cron/ routes use CRON_SECRET bearer auth — never run session middleware on them
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|crests|medallions|banners|map|og|api/cron/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
