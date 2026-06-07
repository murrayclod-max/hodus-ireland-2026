import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TabBar from '@/components/TabBar';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hodus 2026 — Ireland',
  description: 'Golf trip to Northern Ireland & Donegal, Sept 13–20, 2026',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://hodus-ireland-2026.vercel.app' : 'http://localhost:3000'),
  openGraph: {
    images: ['/og/share-1200x630.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hodus 2026',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0E3B2E',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') ?? '';
    const isPublic = pathname.startsWith('/reset-password') || pathname.startsWith('/login') || pathname.startsWith('/api/') || pathname.startsWith('/auth/');
    if (!isPublic) {
      const { data: player } = await supabase.from('players').select('must_reset_password').eq('auth_user_id', user.id).maybeSingle();
      if (player?.must_reset_password) redirect('/reset-password');
    }
  }

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/favicon-32.png" sizes="32x32" />
      </head>
      <body>
        {children}
        {user && <TabBar />}
      </body>
    </html>
  );
}
