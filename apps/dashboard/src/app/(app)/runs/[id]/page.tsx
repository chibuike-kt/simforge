'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  Users,
  Zap,
  AlertTriangle,
  Server,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard } from '@/components/simulation/metric-card';
import { RunStatusBadge } from '@/components/simulation/run-status-badge';
import { WorldMap } from '@/components/simulation/world-map';
import { LatencyChart } from '@/components/charts/latency-chart';
import { RpsChart } from '@/components/charts/rps-chart';
import { AgentChart } from '@/components/charts/agent-chart';
import { formatNumber, formatMs, formatPercent } from '@/lib/utils';
import { MetricPoint, RunStatus } from '@/types';

function generateHistory(points: number): MetricPoint[] {
  return Array.from({ length: points }, (_, i) => {
    const t = new Date(Date.now() - (points - i) * 5_000);
    const progress = i / points;
    const agents = Math.round(progress * 5);
    const rps = agents * 8 + Math.random() * 10;
    return {
      time: t.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      rps: Math.round(rps),
      p50: 38 + Math.random() * 15,
      p95: 95 + Math.random() * 40,
      p99: 200 + Math.random() * 100,
      agents,
      errors: Math.round(Math.random() * 2),
    };
  });
}

const MOCK_WORKERS = [{ id: 'worker-1', region: 'local', agents: 5, status: 'active' as const }];

export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [metrics, setMetrics] = useState(() => generateHistory(40));
  const [status] = useState<RunStatus>('completed');
  const [tab, setTab] = useState('overview');

  const current = metrics[metrics.length - 1];
  const totalRequests = metrics.reduce((s, m) => s + m.rps, 0);
  const totalErrors = metrics.reduce((s, m) => s + m.errors, 0);
  const avgP95 = metrics.reduce((s, m) => s + m.p95, 0) / metrics.length;
  const peakAgents = Math.max(...metrics.map((m) => m.agents));

  // Simulate live updates if running
  useEffect(() => {
    if (status !== 'running') return;
    const interval = setInterval(() => {
      setMetrics((prev) => {
        const last = prev[prev.length - 1];
        const now = new Date();
        return [
          ...prev.slice(1),
          {
            time: now.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            rps: Math.max(0, last.rps + (Math.random() - 0.5) * 20),
            p50: 38 + Math.random() * 15,
            p95: 95 + Math.random() * 40,
            p99: 200 + Math.random() * 100,
            agents: last.agents,
            errors: Math.round(Math.random() * 2),
          },
        ];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="space-y-5 animate-slide-in-up">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/runs">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 mt-0.5"
          >
            <ArrowLeft size={14} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white font-mono">{id.slice(0, 8)}...</h2>
            <RunStatusBadge status={status} />
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">Basic ramp test · v1 · 5 agents</p>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Peak Agents"
          value={formatNumber(peakAgents)}
          subValue="max concurrent"
          icon={<Users size={14} />}
          accent
        />
        <MetricCard
          label="Total Requests"
          value={formatNumber(totalRequests)}
          subValue="across all agents"
          icon={<Zap size={14} />}
        />
        <MetricCard
          label="Avg P95 Latency"
          value={formatMs(avgP95)}
          subValue="over run duration"
          icon={<Activity size={14} />}
        />
        <MetricCard
          label="Error Rate"
          value={formatPercent(totalErrors / Math.max(totalRequests, 1))}
          subValue={`${totalErrors} total errors`}
          icon={<AlertTriangle size={14} />}
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-zinc-900 border border-zinc-800 h-8 p-0.5">
          {['overview', 'latency', 'agents', 'workers'].map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="text-xs h-7 px-3 data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-500 capitalize"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Requests / sec</h3>
              </div>
              <div className="h-48">
                <RpsChart data={metrics} />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Agent Distribution</h3>
              </div>
              <div className="h-48">
                <WorldMap active={status === 'running'} agentCount={current.agents} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Latency tab */}
        <TabsContent value="latency" className="mt-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Latency Distribution</h3>
                <p className="text-xs text-zinc-500 mt-0.5">P50 / P95 / P99</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {[
                  { label: 'P50', color: 'bg-green-400' },
                  { label: 'P95', color: 'bg-yellow-400' },
                  { label: 'P99', color: 'bg-red-400' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="text-zinc-500">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-64">
              <LatencyChart data={metrics} />
            </div>
          </div>
        </TabsContent>

        {/* Agents tab */}
        <TabsContent value="agents" className="mt-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Agent Spawn Curve</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Concurrent agents over time</p>
              </div>
            </div>
            <div className="h-64">
              <AgentChart data={metrics} />
            </div>
          </div>
        </TabsContent>

        {/* Workers tab */}
        <TabsContent value="workers" className="mt-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-white">Worker Fleet</h3>
            </div>
            <div className="divide-y divide-zinc-800">
              {MOCK_WORKERS.map((worker) => (
                <div key={worker.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Server size={13} className="text-zinc-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-300">{worker.id}</p>
                    <p className="text-xs text-zinc-600">Region: {worker.region}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-zinc-300 tabular-nums">
                      {worker.agents} agents
                    </p>
                    <p className="text-[10px] text-zinc-600">active</p>
                  </div>
                  {worker.status === 'active' ? (
                    <CheckCircle2 size={14} className="text-green-400" />
                  ) : (
                    <XCircle size={14} className="text-red-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
