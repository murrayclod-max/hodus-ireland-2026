'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Map, Flag, Trophy, Plane, MessageCircle, Users, TrendingUp, Settings, Cloud, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const tabs = [
  { href: '/',         label: 'Home',    icon: Home },
  { href: '/trip',     label: 'Trip',    icon: Map },
  { href: '/courses',  label: 'Courses', icon: Flag },
  { href: '/match',    label: 'Match',   icon: Trophy },
  { href: '/lass',     label: 'Lass',    icon: Sparkles },
  { href: '/weather',  label: 'Weather', icon: Cloud },
  { href: '/flights',  label: 'Flights', icon: Plane },
  { href: '/feed',     label: 'Feed',    icon: MessageCircle },
  { href: '/players',  label: 'Players', icon: Users },
  { href: '/trends',   label: 'Trends',  icon: TrendingUp },
  { href: '/settings', label: 'Me',      icon: Settings },
];

const FEED_KEY = 'feedLastRead';

export default function TabBar() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const onFeed = pathname.startsWith('/feed');

  // Clear badge and record read-time whenever user is on the feed
  useEffect(() => {
    if (onFeed) {
      setUnread(0);
      localStorage.setItem(FEED_KEY, new Date().toISOString());
    }
  }, [onFeed]);

  // On mount: fetch accumulated unread count + subscribe for live inserts
  useEffect(() => {
    const supabase = createClient();

    async function fetchUnread() {
      const lastRead = localStorage.getItem(FEED_KEY) ?? '2000-01-01T00:00:00Z';
      const [{ count: msgs }, { count: photos }] = await Promise.all([
        supabase.from('messages').select('id', { count: 'exact', head: true }).gt('created_at', lastRead),
        supabase.from('photos').select('id', { count: 'exact', head: true }).gt('created_at', lastRead),
      ]);
      if (!window.location.pathname.startsWith('/feed')) {
        setUnread((msgs ?? 0) + (photos ?? 0));
      }
    }
    fetchUnread();

    const channel = supabase.channel('tab-feed-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        if (!window.location.pathname.startsWith('/feed')) setUnread(n => n + 1);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos' }, () => {
        if (!window.location.pathname.startsWith('/feed')) setUnread(n => n + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <nav className="tab-bar" aria-label="Main navigation">
      <div className="tab-bar-inner">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          const badge = href === '/feed' && unread > 0;
          return (
            <Link key={href} href={href} className={`tab-link${active ? ' active' : ''}`}>
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {badge && (
                  <span style={{
                    position: 'absolute',
                    top: -4,
                    right: -7,
                    background: '#e53e3e',
                    color: '#fff',
                    borderRadius: 99,
                    minWidth: 15,
                    height: 15,
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
