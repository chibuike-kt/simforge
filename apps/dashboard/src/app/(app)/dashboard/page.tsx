'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Play,
  ArrowRight,
  Activity,
  Users,
  Zap,
  AlertTriangle,
  Clock,
  Plus,
  FolderOpen,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorldMap } from '@/components/simulation/world-map';
import { RpsChart } from '@/components/charts/rps-chart';
import { RunStatusBadge } from '@/components/simulation/run-status-badge';
import { formatNumber, formatDate, formatMs } from '@/lib/utils';
import { MetricPoint, SimulationRun } from '@/types';
import { useRealtime } from '@/hooks/use-realtime';
import { usePendingRuns } from '@/hooks/use-api';

function generateEmpty(points: number): MetricPoint[] {
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(Date.now() - (points - i) * 10_000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    rps: 0,
    p50: 0,
    p95: 0,
    p99: 0,
    agents: 0,
    errors: 0,
  }));
}

const MOCK_RUNS: SimulationRun[] = [
  {
    id: 'd7ac74fd-ae40-41e8-9fb4-b758093a1977',
    scenarioId: '51d95b38-dc5a-461d-bbf8-0cf8025d7e26',
    scenarioVersion: 1,
    status: 'completed',
    approvedBy: null,
    approvedAt: new Date(Date.now() - 3600_000).toISOString(),
    startedAt: new Date(Date.now() - 3600_000).toISOString(),
    completedAt: new Date(Date.now() - 3000_000).toISOString(),
    createdAt: new Date(Date.now() - 3700_000).toISOString(),
  },
];

export default function OverviewPage() {
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>(() => generateEmpty(30));
  const { data: pendingRuns } = usePendingRuns();

  const { metrics, resetMetrics } = useRealtime({
    enabled: true,
    onEvent: useCallback((event: { eventType: string; latencyMs?: number }) => {
      if (event.eventType === 'response.received') {
        setMetricsHistory((prev) => {
          const now = new Date();
          return [
            ...prev.slice(1),
            {
              time: now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
              rps: 0,
              p50: 0,
              p95: 0,
              p99: event.latencyMs ?? 0,
              agents: 0,
              errors: 0,
            },
          ];
        });
      }
    }, []),
  });

  const isSimulating = metrics.activeAgents > 0;
  const pendingCount = (pendingRuns as SimulationRun[] | undefined)?.length ?? 0;

  const regionDistribution = Object.entries(metrics.regionBreakdown).map(([regionCode, count]) => {
    const total = Object.values(metrics.regionBreakdown).reduce((s, v) => s + v, 0);
    return { regionCode, agentPct: total > 0 ? count / total : 0 };
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top metrics bar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800/60 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users size={12} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">Agents</span>
            <span
              className={`text-sm font-semibold ${isSimulating ? 'text-blue-400' : 'text-zinc-500'}`}
            >
              {formatNumber(metrics.activeAgents)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">RPS</span>
            <span className="text-sm font-semibold text-zinc-300">{formatNumber(metrics.rps)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">P95</span>
            <span className="text-sm font-semibold text-zinc-300">
              {metrics.p95 > 0 ? formatMs(metrics.p95) : '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={12} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">Errors</span>
            <span
              className={`text-sm font-semibold ${metrics.totalErrors > 0 ? 'text-red-400' : 'text-zinc-500'}`}
            >
              {formatNumber(metrics.totalErrors)}
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {pendingCount > 0 && (
            <Link href="/runs">
              <span className="text-[10px] text-yellow-400 border border-yellow-400/20 bg-yellow-400/10 rounded px-2 py-1">
                {pendingCount} pending approval
              </span>
            </Link>
          )}
          <Link href="/scenarios/new">
            <Button
              size="sm"
              className="h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1"
            >
              <Plus size={11} />
              New Scenario
            </Button>
          </Link>
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — collections + recent */}
        <div className="w-64 border-r border-zinc-800/60 flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Quick start */}
            <div>
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-2">
                Quick Start
              </p>
              <div className="space-y-1">
                <Link
                  href="/scenarios/new"
                  className="flex items-center gap-2 px-2 py-2 rounded bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-xs text-zinc-400 hover:text-zinc-200"
                >
                  <Plus size={11} />
                  New Scenario
                </Link>
                <Link
                  href="/targets"
                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-zinc-800/50 transition-colors text-xs text-zinc-500 hover:text-zinc-300"
                >
                  <ArrowRight size={11} />
                  Add Target
                </Link>
              </div>
            </div>

            {/* Collections */}
            <div>
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-2">
                Collections
              </p>
              <div className="space-y-1">
                <div className="px-2 py-2 rounded bg-zinc-800/30 border border-zinc-800">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Folder size={11} className="text-blue-400/70" />
                    <span className="text-xs text-zinc-400">E-commerce Suite</span>
                  </div>
                  <Link
                    href="/scenarios/51d95b38-dc5a-461d-bbf8-0cf8025d7e26"
                    className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-zinc-700/50 transition-colors"
                  >
                    <Activity size={9} className="text-zinc-600" />
                    <span className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors truncate">
                      Basic ramp test
                    </span>
                    <span className="ml-auto w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent runs */}
            <div>
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-2">
                Recent Runs
              </p>
              <div className="space-y-1">
                {MOCK_RUNS.map((run) => (
                  <Link
                    key={run.id}
                    href={`/runs`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800/50 transition-colors"
                  >
                    <Play size={9} className="text-zinc-600 flex-shrink-0" />
                    <span className="text-[11px] text-zinc-500 truncate flex-1">
                      {run.id.slice(0, 12)}...
                    </span>
                    <RunStatusBadge status={run.status} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right — world map + chart */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* World map */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Global Agent Distribution</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {isSimulating
                      ? `Live traffic from ${Object.keys(metrics.regionBreakdown).length} regions · ${formatNumber(metrics.totalRequests)} total requests`
                      : 'Start a simulation to see live traffic'}
                  </p>
                </div>
                {isSimulating && (
                  <button
                    onClick={resetMetrics}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded px-2 py-1"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="h-[calc(100%-48px)]">
                <WorldMap
                  active={isSimulating}
                  agentCount={metrics.activeAgents}
                  regions={regionDistribution.length > 0 ? regionDistribution : undefined}
                />
              </div>
            </div>
          </div>

          {/* RPS chart */}
          <div className="h-36 border-t border-zinc-800/60 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Requests / sec
              </span>
              <span className="text-[10px] text-zinc-600">Last 5 min</span>
            </div>
            <div className="h-20">
              <RpsChart data={metricsHistory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
