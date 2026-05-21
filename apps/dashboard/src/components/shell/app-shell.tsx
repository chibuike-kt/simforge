'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { BottomPanel } from './bottom-panel';
import { useRealtime } from '@/hooks/use-realtime';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(280);

  const { connected, metrics } = useRealtime({ enabled: true });
  const isSimulating = metrics.activeAgents > 0;

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0f0f0f] text-zinc-300">
      {/* Left sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
        connected={connected}
        isSimulating={isSimulating}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          connected={connected}
          isSimulating={isSimulating}
          activeAgents={metrics.activeAgents}
          rps={metrics.rps}
          onToggleEventStream={() => setBottomPanelOpen((p) => !p)}
          eventStreamOpen={bottomPanelOpen}
        />

        {/* Page content */}
        <div
          className="flex-1 overflow-hidden"
          style={{ paddingBottom: bottomPanelOpen ? bottomPanelHeight : 0 }}
        >
          {children}
        </div>

        {/* Bottom event stream panel */}
        <BottomPanel
          open={bottomPanelOpen}
          height={bottomPanelHeight}
          onHeightChange={setBottomPanelHeight}
          onClose={() => setBottomPanelOpen(false)}
          isSimulating={isSimulating}
        />
      </div>
    </div>
  );
}
