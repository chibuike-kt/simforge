'use client';

import { BarChart2, Clock, CheckCircle2, XCircle, Zap, Users, Activity } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0f0f0f]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/60 bg-[#1a1a1a] flex-shrink-0">
        <span className="text-sm font-medium text-zinc-300">Reports</span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">
            <BarChart2 size={24} className="text-zinc-600" />
          </div>
          <p className="text-sm font-medium text-zinc-400 mb-1">Reports coming soon</p>
          <p className="text-xs text-zinc-600 mb-6">
            Post-run analysis with region breakdown, SLO tracking, and run comparisons will appear
            here after you complete a simulation.
          </p>
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              {
                label: 'Region Breakdown',
                desc: 'Latency & errors by region',
                icon: <Activity size={13} className="text-blue-400" />,
              },
              {
                label: 'SLO Report',
                desc: 'Track your thresholds',
                icon: <CheckCircle2 size={13} className="text-green-400" />,
              },
              {
                label: 'Run Comparison',
                desc: 'Before vs after deploys',
                icon: <BarChart2 size={13} className="text-purple-400" />,
              },
              {
                label: 'Peak Analysis',
                desc: 'Identify bottlenecks',
                icon: <Zap size={13} className="text-yellow-400" />,
              },
            ].map(({ label, desc, icon }) => (
              <div key={label} className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3">
                <div className="flex items-center gap-2 mb-1">
                  {icon}
                  <span className="text-[11px] font-medium text-zinc-400">{label}</span>
                </div>
                <p className="text-[10px] text-zinc-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
