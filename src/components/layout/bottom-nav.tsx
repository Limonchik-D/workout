'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, Calendar, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/workouts', label: 'Тренировки', icon: Dumbbell },
  { href: '/calendar', label: 'Календарь', icon: Calendar },
  { href: '/statistics', label: 'Статистика', icon: BarChart2 },
  { href: '/settings', label: 'Настройки', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-sidebar/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 min-w-14 py-2 px-3 rounded-xl transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn('h-5 w-5 transition-transform duration-150', active && 'scale-110')}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={cn('text-[11px] font-medium leading-none', active && 'text-primary')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
