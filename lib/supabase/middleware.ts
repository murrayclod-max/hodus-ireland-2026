import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/ghin/')   // authenticated via CRON_SECRET bearer token
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (!user) {
    if (authError && authError.status !== 400) return response;
    if (!isPublicPath(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  if (pathname === '/login') {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    homeUrl.search = '';
    return NextResponse.redirect(homeUrl);
  }

  // Force password reset on first login
  if (!pathname.startsWith('/reset-password') && !pathname.startsWith('/auth/') && !pathname.startsWith('/api/')) {
    const { data: player } = await supabase
      .from('players')
      .select('must_reset_password')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    if (player?.must_reset_password) {
      const resetUrl = request.nextUrl.clone();
      resetUrl.pathname = '/reset-password';
      resetUrl.search = '';
      return NextResponse.redirect(resetUrl);
    }
  }

  return response;
}
