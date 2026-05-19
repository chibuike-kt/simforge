'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/runs': 'Simulation Runs',
  '/scenarios': 'Scenarios',
  '/scenarios/new': 'New Scenario',
  '/targets': 'Target Systems',
  '/behaviors': 'Behavior Models',
  '/settings': 'Settings',
};

export function TopBar() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? 'SimForge';

  return (
    <header className="h-14 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-30">
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 gap-2 text-xs"
        >
          <Search size={13} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-flex h-4 items-center gap-0.5 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-[10px] text-zinc-500">
            ⌘K
          </kbd>
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 relative"
        >
          <Bell size={14} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
        </Button>
      </div>
    </header>
  );
}
