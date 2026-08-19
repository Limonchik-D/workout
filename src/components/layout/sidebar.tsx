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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border bg-sidebar h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Dumbbell className="h-6 w-6 text-primary" strokeWidth={2.5} />
        <span className="text-lg font-bold tracking-tight">Workout</span>
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon
                className="h-4.5 w-4.5"
                strokeWidth={active ? 2.5 : 2}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
