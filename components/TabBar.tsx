'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Flag, Trophy, Plane, MessageCircle, Users, TrendingUp, Settings, Cloud } from 'lucide-react';

const tabs = [
  { href: '/',         label: 'Home',    icon: Home },
  { href: '/trip',     label: 'Trip',    icon: Map },
  { href: '/courses',  label: 'Courses', icon: Flag },
  { href: '/match',    label: 'Match',   icon: Trophy },
  { href: '/weather',  label: 'Weather', icon: Cloud },
  { href: '/flights',  label: 'Flights', icon: Plane },
  { href: '/feed',     label: 'Feed',    icon: MessageCircle },
  { href: '/players',  label: 'Players', icon: Users },
  { href: '/trends',   label: 'Trends',  icon: TrendingUp },
  { href: '/settings', label: 'Me',      icon: Settings },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tab-bar" aria-label="Main navigation">
      <div className="tab-bar-inner">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`tab-link${active ? ' active' : ''}`}>
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
