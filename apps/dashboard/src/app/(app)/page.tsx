'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/simulation/metric-card';
import { WorldMap } from '@/components/simulation/world-map';
import { RunStatusBadge } from '@/components/simulation/run-status-badge';
import { RpsChart } from '@/components/charts/rps-chart';
import { formatNumber, formatDate } from '@/lib/utils';
import { MetricPoint, SimulationRun } from '@/types';
import { useRealtime } from '@/hooks/use-realtime';
import { usePendingRuns } from '@/hooks/use-api';

function generateMetricHistory(points: number): MetricPoint[] {
  return Array.from({ length: points }, (_, i) => {
    const t = new Date(Date.now() - (points - i) * 10_000);
    return {
      time: t.toLocaleTimeString('en-US', {
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
    };
  });
}

const MOCK_RECENT_RUNS: SimulationRun[] = [
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
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>(() =>
    generateMetricHistory(30),
  );
  const { data: pendingRuns } = usePendingRuns();

  const { connected, metrics, resetMetrics } = useRealtime({
    enabled: true,
    onEvent: (event) => {
      // Update metrics history chart on every response
      if (event.eventType === 'response.received') {
        setMetricsHistory((prev) => {
          const now = new Date();
          const last = prev[prev.length - 1];
          return [
            ...prev.slice(1),
            {
              time: now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
              rps: metrics.rps,
              p50: metrics.p50,
              p95: metrics.p95,
              p99: event.latencyMs ?? 0,
              agents: metrics.activeAgents,
              errors: metrics.totalErrors - (last?.errors ?? 0),
            },
          ];
        });
      }
    },
  });

  // Build region distribution for world map from real-time data
  const regionDistribution = Object.entries(metrics.regionBreakdown).map(([regionCode, count]) => {
    const total = Object.values(metrics.regionBreakdown).reduce((s, v) => s + v, 0);
    return { regionCode, agentPct: total > 0 ? count / total : 0 };
  });

  const isSimulating = metrics.activeAgents > 0;
  const currentMetric = metricsHistory[metricsHistory.length - 1];
  const pendingCount = (pendingRuns as SimulationRun[] | undefined)?.length ?? 0;

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-white">Platform Overview</h2>
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                connected
                  ? 'bg-green-400/10 text-green-400 border-green-400/20'
                  : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20'
              }`}
            >
              {connected ? <Wifi size={9} /> : <WifiOff size={9} />}
              {connected ? 'Live' : 'Offline'}
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            Monitor active simulations and system health
            {pendingCount > 0 && (
              <span className="ml-2 text-yellow-400">
                · {pendingCount} run{pendingCount > 1 ? 's' : ''} pending approval
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/scenarios">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 gap-1.5"
            >
              <Plus size={12} />
              New Scenario
            </Button>
          </Link>
          <Link href="/runs">
            <Button
              size="sm"
              className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
            >
              <Play size={12} />
              Start Run
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Active Agents"
          value={formatNumber(metrics.activeAgents)}
          subValue={isSimulating ? 'simulation running' : 'no active simulation'}
          accent
          live={isSimulating}
          icon={<Users size={14} />}
        />
        <MetricCard
          label="Requests / sec"
          value={formatNumber(metrics.rps)}
          subValue="current RPS"
          icon={<Zap size={14} />}
        />
        <MetricCard
          label="P95 Latency"
          value={metrics.p95 > 0 ? `${Math.round(metrics.p95)}ms` : '—'}
          subValue="rolling window"
          icon={<Activity size={14} />}
        />
        <MetricCard
          label="Total Requests"
          value={formatNumber(metrics.totalRequests)}
          subValue={`${metrics.totalErrors} errors`}
          icon={<AlertTriangle size={14} />}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* World map — full width, driven by real region data */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Agent Distribution</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isSimulating
                  ? `Live traffic from ${Object.keys(metrics.regionBreakdown).length} regions`
                  : 'Waiting for simulation — showing default distribution'}
              </p>
            </div>
            <span className="text-[10px] font-medium text-zinc-600 border border-zinc-800 rounded px-2 py-0.5">
              SIMULATION VIEW
            </span>
          </div>
          <div className="h-[500px]">
            <WorldMap
              active={isSimulating}
              agentCount={metrics.activeAgents}
              regions={regionDistribution.length > 0 ? regionDistribution : undefined}
            />
          </div>
        </div>

        {/* RPS chart */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Requests / sec</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Live stream</p>
            </div>
            <div className="flex items-center gap-2">
              {isSimulating && (
                <button
                  onClick={resetMetrics}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded px-2 py-0.5 transition-colors"
                >
                  Reset
                </button>
              )}
              <span className="flex items-center gap-1 text-[10px] font-medium text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="h-48">
            <RpsChart data={metricsHistory} />
          </div>
        </div>
      </div>

      {/* Recent runs */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Runs</h3>
          <Link href="/runs">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-zinc-500 hover:text-zinc-300 gap-1"
            >
              View all
              <ArrowRight size={11} />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-zinc-800">
          {MOCK_RECENT_RUNS.map((run) => (
            <Link
              key={run.id}
              href={`/runs/${run.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <Play size={12} className="text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-300 truncate group-hover:text-white transition-colors">
                  Run {run.id.slice(0, 8)}...
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock size={10} className="text-zinc-600" />
                  <span className="text-xs text-zinc-600">{formatDate(run.createdAt)}</span>
                </div>
              </div>
              <RunStatusBadge status={run.status} />
              <ArrowRight
                size={13}
                className="text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
