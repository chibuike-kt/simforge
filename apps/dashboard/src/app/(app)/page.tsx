'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, ArrowRight, Activity, Users, Zap, AlertTriangle, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/simulation/metric-card';
import { WorldMap } from '@/components/simulation/world-map';
import { RunStatusBadge } from '@/components/simulation/run-status-badge';
import { RpsChart } from '@/components/charts/rps-chart';
import { formatNumber, formatDate } from '@/lib/utils';
import { MetricPoint, SimulationRun } from '@/types';

// Generate mock metric history
function generateMetricHistory(points: number): MetricPoint[] {
  return Array.from({ length: points }, (_, i) => {
    const t = new Date(Date.now() - (points - i) * 10_000);
    const rps = 120 + Math.sin(i * 0.3) * 40 + Math.random() * 20;
    return {
      time: t.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      rps: Math.round(rps),
      p50: 45 + Math.random() * 20,
      p95: 120 + Math.random() * 40,
      p99: 280 + Math.random() * 80,
      agents: Math.round(800 + Math.sin(i * 0.2) * 200 + Math.random() * 100),
      errors: Math.round(Math.random() * 5),
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
  {
    id: 'eab78fc9-d231-4220-920e-41855ea3242a',
    scenarioId: '51d95b38-dc5a-461d-bbf8-0cf8025d7e26',
    scenarioVersion: 1,
    status: 'approved',
    approvedBy: null,
    approvedAt: new Date(Date.now() - 7200_000).toISOString(),
    startedAt: null,
    completedAt: null,
    createdAt: new Date(Date.now() - 7300_000).toISOString(),
  },
];

export default function OverviewPage() {
  const [metrics, setMetrics] = useState(() => generateMetricHistory(30));
  const [activeAgents, setActiveAgents] = useState(0);
  const [isSimulating] = useState(false);

  // Simulate live metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        const last = prev[prev.length - 1];
        const rps = Math.max(0, last.rps + (Math.random() - 0.5) * 30);
        const agents = Math.max(0, last.agents + (Math.random() - 0.5) * 50);
        setActiveAgents(Math.round(agents));
        const now = new Date();
        return [
          ...prev.slice(1),
          {
            time: now.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            rps: Math.round(rps),
            p50: 45 + Math.random() * 20,
            p95: 120 + Math.random() * 40,
            p99: 280 + Math.random() * 80,
            agents: Math.round(agents),
            errors: Math.round(Math.random() * 5),
          },
        ];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const currentMetric = metrics[metrics.length - 1];

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Platform Overview</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Monitor active simulations and system health
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
          value={formatNumber(activeAgents)}
          subValue="across 1 worker"
          trend="up"
          trendValue="+12%"
          accent
          live={isSimulating}
          icon={<Users size={14} />}
        />
        <MetricCard
          label="Requests / sec"
          value={formatNumber(currentMetric.rps)}
          subValue="current RPS"
          trend="neutral"
          trendValue="stable"
          icon={<Zap size={14} />}
        />
        <MetricCard
          label="P95 Latency"
          value={`${Math.round(currentMetric.p95)}ms`}
          subValue="last 30s"
          trend={currentMetric.p95 > 150 ? 'down' : 'up'}
          trendValue={currentMetric.p95 > 150 ? 'Elevated' : 'Healthy'}
          icon={<Activity size={14} />}
        />
        <MetricCard
          label="Error Rate"
          value={`${((currentMetric.errors / Math.max(currentMetric.rps, 1)) * 100).toFixed(1)}%`}
          subValue="last 30s"
          trend={currentMetric.errors > 3 ? 'down' : 'up'}
          trendValue={currentMetric.errors > 3 ? 'Elevated' : 'Healthy'}
          icon={<AlertTriangle size={14} />}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* World map */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Agent Distribution</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Real-time spawn activity across regions
              </p>
            </div>
            <span className="text-[10px] font-medium text-zinc-600 border border-zinc-800 rounded px-2 py-0.5">
              SIMULATION VIEW
            </span>
          </div>
          <div className="h-80">
            <WorldMap active={isSimulating} agentCount={activeAgents} />
          </div>
        </div>

        {/* RPS chart */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Requests / sec</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Last 5 minutes</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-medium text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Live
            </span>
          </div>
          <div className="h-52">
            <RpsChart data={metrics} />
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

        {MOCK_RECENT_RUNS.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-zinc-600">No runs yet</p>
            <p className="text-xs text-zinc-700 mt-1">
              Create a scenario and submit a run to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
