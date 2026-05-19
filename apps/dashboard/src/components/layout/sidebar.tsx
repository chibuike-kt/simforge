'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Play,
  Target,
  GitBranch,
  Activity,
  Settings,
  ChevronRight,
  Zap,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearAuth, getUser } from '@/lib/auth';

const navigation = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Runs', href: '/runs', icon: Play },
  { label: 'Scenarios', href: '/scenarios', icon: Activity },
  { label: 'Targets', href: '/targets', icon: Target },
  { label: 'Behaviors', href: '/behaviors', icon: GitBranch },
];

const bottomNavigation = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-zinc-950 border-r border-zinc-800/60 flex flex-col z-40">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-zinc-800/60">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-white">
              <path d="M2 8L8 2L14 8L8 14L2 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8 5L11 8L8 11L5 8L8 5Z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">SimForge</span>
        </Link>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-2 pb-2 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
          Platform
        </p>
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-all group',
                active
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
              )}
            >
              <item.icon
                size={15}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  active ? 'text-blue-400' : 'text-zinc-600 group-hover:text-zinc-400',
                )}
              />
              <span className="font-medium">{item.label}</span>
              {active && <ChevronRight size={12} className="ml-auto text-zinc-600" />}
            </Link>
          );
        })}
      </nav>

      {/* Live indicator */}
      <div className="px-3 py-3 border-t border-zinc-800/60">
        <div className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ripple" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-300">System online</p>
            <p className="text-[10px] text-zinc-600 truncate">All services healthy</p>
          </div>
          <Zap size={12} className="text-green-500 flex-shrink-0" />
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-2 pb-3 space-y-0.5">
        {bottomNavigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-all group',
                active
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
              )}
            >
              <item.icon
                size={15}
                className={cn(
                  'flex-shrink-0',
                  active ? 'text-blue-400' : 'text-zinc-600 group-hover:text-zinc-400',
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User */}
      <div className="px-3 pb-4 border-t border-zinc-800/60 pt-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-semibold text-blue-400">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-300 truncate">
              {user?.name ?? 'User'}
            </p>
            <p className="text-[10px] text-zinc-600 truncate">
              {user?.email ?? ''}
            </p>
          </div>
          <button
            onClick={() => {
              clearAuth();
              router.push('/login');
            }}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
