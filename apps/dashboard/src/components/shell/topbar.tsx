'use client';

import { usePathname } from 'next/navigation';
import { Terminal, Wifi, WifiOff, Activity, Zap, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface TopbarProps {
  connected: boolean;
  isSimulating: boolean;
  activeAgents: number;
  rps: number;
  onToggleEventStream: () => void;
  eventStreamOpen: boolean;
}

function getBreadcrumb(pathname: string): { label: string; href?: string }[] {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [{ label: 'SimForge', href: '/' }];

  const labelMap: Record<string, string> = {
    scenarios: 'Scenarios',
    collections: 'Collections',
    targets: 'Targets',
    behaviors: 'Behaviors',
    runs: 'Runs',
    reports: 'Reports',
    settings: 'Settings',
    workspace: 'Workspace',
    new: 'New',
  };

  parts.forEach((part, i) => {
    const href = '/' + parts.slice(0, i + 1).join('/');
    const label = labelMap[part] ?? part.slice(0, 8) + '...';
    crumbs.push({ label, href });
  });

  return crumbs;
}

export function Topbar({
  connected,
  isSimulating,
  activeAgents,
  rps,
  onToggleEventStream,
  eventStreamOpen,
}: TopbarProps) {
  const pathname = usePathname();
  const crumbs = getBreadcrumb(pathname);

  return (
    <div className="h-11 flex items-center justify-between px-3 border-b border-zinc-800/60 bg-[#1a1a1a] flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-zinc-600">
        {crumbs.map((crumb, i) => (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={10} className="text-zinc-700" />}
            <span className={i === crumbs.length - 1 ? 'text-zinc-400' : 'text-zinc-600'}>
              {crumb.label}
            </span>
          </div>
        ))}
      </div>

      {/* Right side — live indicators */}
      <div className="flex items-center gap-3">
        {/* Live metrics when simulating */}
        {isSimulating && (
          <>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">
              <Activity size={10} className="text-blue-400 animate-pulse" />
              <span className="text-[10px] font-medium text-blue-400">
                {formatNumber(activeAgents)} agents
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
              <Zap size={10} className="text-yellow-400" />
              <span className="text-[10px] font-medium text-zinc-300">{formatNumber(rps)} rps</span>
            </div>
          </>
        )}

        {/* Event stream toggle */}
        <button
          onClick={onToggleEventStream}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition-all border ${
            eventStreamOpen
              ? 'bg-zinc-700 text-white border-zinc-600'
              : 'text-zinc-500 hover:text-zinc-300 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <Terminal size={10} />
          <span>Events</span>
        </button>

        {/* Connection badge */}
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-medium ${
            connected
              ? 'bg-green-400/10 text-green-400 border-green-400/20'
              : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20'
          }`}
        >
          {connected ? <Wifi size={9} /> : <WifiOff size={9} />}
          {connected ? 'Live' : 'Offline'}
        </div>
      </div>
    </div>
  );
}
