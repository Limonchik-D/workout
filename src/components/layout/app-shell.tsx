'use client';

import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {children}
      </main>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
