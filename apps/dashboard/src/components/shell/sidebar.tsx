'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FolderOpen,
  Target,
  GitBranch,
  Play,
  BarChart2,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Zap,
  Folder,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearAuth, getUser } from '@/lib/auth';
import { useScenarios } from '@/hooks/use-api';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  connected: boolean;
  isSimulating: boolean;
}

interface CollectionItem {
  id: string;
  name: string;
  scenarios: { id: string; name: string; status: string }[];
}

// Mock collections — will be replaced with real data
const MOCK_COLLECTIONS: CollectionItem[] = [
  {
    id: 'ecommerce',
    name: 'E-commerce Suite',
    scenarios: [
      { id: '51d95b38-dc5a-461d-bbf8-0cf8025d7e26', name: 'Basic ramp test', status: 'published' },
    ],
  },
];

export function Sidebar({ collapsed, onToggle, connected, isSimulating }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set(['ecommerce']),
  );

  function toggleCollection(id: string) {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[#1a1a1a] border-r border-zinc-800/60 transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-12' : 'w-56',
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="h-11 flex items-center justify-between px-3 border-b border-zinc-800/60 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">SimForge</span>
          </div>
        )}
        {collapsed && (
          <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center mx-auto">
            <Zap size={12} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="flex items-center justify-center h-8 text-zinc-600 hover:text-zinc-400 transition-colors border-b border-zinc-800/60"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1.5">
        {/* Dashboard */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-all group',
            isActive('/workspace') || pathname === '/'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
          title={collapsed ? 'Dashboard' : undefined}
        >
          <LayoutDashboard size={13} className="flex-shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {/* Runs */}
        <Link
          href="/runs"
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-all',
            isActive('/runs')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
          title={collapsed ? 'Runs' : undefined}
        >
          <Play size={13} className="flex-shrink-0" />
          {!collapsed && <span>Runs</span>}
          {!collapsed && isSimulating && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          )}
        </Link>

        {/* Reports */}
        <Link
          href="/reports"
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-all',
            isActive('/reports')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
          title={collapsed ? 'Reports' : undefined}
        >
          <BarChart2 size={13} className="flex-shrink-0" />
          {!collapsed && <span>Reports</span>}
        </Link>

        {!collapsed && (
          <div className="pt-3 pb-1">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                Collections
              </span>
              <button className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <Plus size={11} />
              </button>
            </div>

            {/* Collections folder tree */}
            <div className="space-y-0.5">
              {MOCK_COLLECTIONS.map((collection) => (
                <div key={collection.id}>
                  {/* Collection header */}
                  <button
                    onClick={() => toggleCollection(collection.id)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
                  >
                    {expandedCollections.has(collection.id) ? (
                      <ChevronDown size={11} className="flex-shrink-0 text-zinc-600" />
                    ) : (
                      <ChevronRightIcon size={11} className="flex-shrink-0 text-zinc-600" />
                    )}
                    <Folder size={11} className="flex-shrink-0 text-blue-400/70" />
                    <span className="truncate text-left">{collection.name}</span>
                  </button>

                  {/* Scenarios inside collection */}
                  {expandedCollections.has(collection.id) && (
                    <div className="ml-3 pl-2 border-l border-zinc-800 space-y-0.5 mt-0.5">
                      {collection.scenarios.map((scenario) => (
                        <Link
                          key={scenario.id}
                          href={`/scenarios/${scenario.id}`}
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all',
                            isActive(`/scenarios/${scenario.id}`)
                              ? 'bg-zinc-800 text-white'
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
                          )}
                        >
                          <Activity size={10} className="flex-shrink-0 text-zinc-600" />
                          <span className="truncate">{scenario.name}</span>
                          {scenario.status === 'published' && (
                            <span className="ml-auto w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                          )}
                        </Link>
                      ))}
                      <button className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
                        <Plus size={9} />
                        <span>New scenario</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                <Plus size={11} />
                <span>New collection</span>
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        {!collapsed && <div className="h-px bg-zinc-800/60 mx-2 my-2" />}

        {/* Targets */}
        <Link
          href="/targets"
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-all',
            isActive('/targets')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
          title={collapsed ? 'Targets' : undefined}
        >
          <Target size={13} className="flex-shrink-0" />
          {!collapsed && <span>Targets</span>}
        </Link>

        {/* Behaviors */}
        <Link
          href="/behaviors"
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-all',
            isActive('/behaviors')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
          title={collapsed ? 'Behaviors' : undefined}
        >
          <GitBranch size={13} className="flex-shrink-0" />
          {!collapsed && <span>Behaviors</span>}
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-all',
            isActive('/settings')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={13} className="flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Connection status */}
      {!collapsed && (
        <div className="px-3 py-2 border-t border-zinc-800/60">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                connected ? 'bg-green-400' : 'bg-zinc-600',
              )}
            />
            <span className="text-[10px] text-zinc-600">{connected ? 'Connected' : 'Offline'}</span>
            {isSimulating && (
              <span className="ml-auto text-[10px] text-blue-400 animate-pulse">Simulating</span>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-semibold text-blue-400">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-zinc-400 truncate">{user?.name}</p>
            </div>
            <button
              onClick={() => {
                clearAuth();
                router.push('/login');
              }}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <LogOut size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
