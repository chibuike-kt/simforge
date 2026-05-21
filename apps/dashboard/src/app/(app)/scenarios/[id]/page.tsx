'use client';

import { use, useState } from 'react';
import {
  Play,
  Square,
  Settings,
  Globe,
  GitBranch,
  ChevronDown,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Activity,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorldMap } from '@/components/simulation/world-map';
import { RpsChart } from '@/components/charts/rps-chart';
import { LatencyChart } from '@/components/charts/latency-chart';
import { useScenario, useSubmitRun } from '@/hooks/use-api';
import { useRealtime } from '@/hooks/use-realtime';
import { formatNumber, formatMs, formatDate } from '@/lib/utils';
import { MetricPoint } from '@/types';
import { toast } from 'sonner';

const TABS = ['Overview', 'Traffic', 'Regions', 'Behavior', 'Headers'] as const;
type Tab = (typeof TABS)[number];

const REGION_PROFILES = [
  { code: 'EU_WEST',      label: 'Western Europe',    pct: 22, p50: 18,  mobile: 45, flag: '🇪🇺' },
  { code: 'NA_WEST',      label: 'N. America West',   pct: 18, p50: 25,  mobile: 38, flag: '🇺🇸' },
  { code: 'NA_EAST',      label: 'N. America East',   pct: 15, p50: 20,  mobile: 40, flag: '🇺🇸' },
  { code: 'ASIA_EAST',    label: 'East Asia',          pct: 12, p50: 15,  mobile: 55, flag: '🌏' },
  { code: 'ASIA_SOUTH',   label: 'South Asia',         pct: 10, p50: 80,  mobile: 78, flag: '🇮🇳' },
  { code: 'EU_EAST',      label: 'Eastern Europe',     pct: 8,  p50: 35,  mobile: 52, flag: '🇵🇱' },
  { code: 'ASIA_SE',      label: 'Southeast Asia',     pct: 9,  p50: 65,  mobile: 72, flag: '🌏' },
  { code: 'LATAM',        label: 'Latin America',      pct: 6,  p50: 70,  mobile: 68, flag: '🌎' },
  { code: 'ASIA_CENTRAL', label: 'Middle East',        pct: 5,  p50: 55,  mobile: 65, flag: '🌍' },
  { code: 'AFRICA',       label: 'Africa',             pct: 4,  p50: 120, mobile: 82, flag: '🌍' },
  { code: 'OCEANIA',      label: 'Oceania',            pct: 3,  p50: 30,  mobile: 48, flag: '🇦🇺' },
];

function generateEmpty(n: number): MetricPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    time: new Date(Date.now() - (n - i) * 5_000).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
    rps: 0, p50: 0, p95: 0, p99: 0, agents: 0, errors: 0,
  }));
}

export default function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [runMode, setRunMode] = useState<'idle' | 'running' | 'done'>('idle');
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>(() => generateEmpty(40));

  const { data: scenario, isLoading } = useScenario(id);
  const submitRun = useSubmitRun();

  const { metrics, resetMetrics } = useRealtime({
    enabled: runMode === 'running',
    onEvent: (event) => {
      if (event.eventType === 'response.received') {
        setMetricsHistory((prev) => {
          const now = new Date();
          return [
            ...prev.slice(1),
            {
              time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              rps: metrics.rps,
              p50: metrics.p50,
              p95: metrics.p95,
              p99: event.latencyMs ?? 0,
              agents: metrics.activeAgents,
              errors: 0,
            },
          ];
        });
      }
      if (event.eventType === 'shard.completed') {
        setRunMode('done');
      }
    },
  });

  const regionDistribution = Object.entries(metrics.regionBreakdown).map(([regionCode, count]) => {
    const total = Object.values(metrics.regionBreakdown).reduce((s, v) => s + v, 0);
    return { regionCode, agentPct: total > 0 ? count / total : 0 };
  });

  async function handleRun() {
    try {
      resetMetrics();
      setMetricsHistory(generateEmpty(40));
      await submitRun.mutateAsync(id);
      setRunMode('running');
      toast.success('Simulation started');
    } catch (err) {
      toast.error('Failed to start', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  function handleStop() {
    setRunMode('done');
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={20} className="text-zinc-600 animate-spin" />
      </div>
    );
  }

  const sc = scenario as Record<string, unknown> | null;

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── LEFT PANEL — config ──────────────────────────────── */}
      <div className="w-80 flex-shrink-0 border-r border-zinc-800/60 flex flex-col overflow-hidden">
        {/* Scenario header */}
        <div className="px-4 py-3 border-b border-zinc-800/60">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-white truncate">
              {(sc?.name as string) ?? 'Loading...'}
            </h2>
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded border flex-shrink-0',
              sc?.status === 'published'
                ? 'bg-green-400/10 text-green-400 border-green-400/20'
                : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20',
            )}>
              {(sc?.status as string) ?? 'draft'}
            </span>
          </div>
          {sc?.description && (
            <p className="text-[11px] text-zinc-500 truncate">{sc.description as string}</p>
          )}
        </div>

        {/* Run button */}
        <div className="px-4 py-3 border-b border-zinc-800/60">
          {runMode === 'idle' && (
            <button
              onClick={handleRun}
              disabled={submitRun.isPending || sc?.status !== 'published'}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {submitRun.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              {submitRun.isPending ? 'Starting...' : 'Run Simulation'}
            </button>
          )}
          {runMode === 'running' && (
            <button
              onClick={handleStop}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-medium transition-colors"
            >
              <Square size={14} />
              Stop Simulation
            </button>
          )}
          {runMode === 'done' && (
            <button
              onClick={() => { setRunMode('idle'); resetMetrics(); setMetricsHistory(generateEmpty(40)); }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
            >
              <Play size={14} />
              Run Again
            </button>
          )}

          {/* Status indicator */}
          {runMode === 'running' && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] text-green-400">Simulation running</span>
            </div>
          )}
          {runMode === 'done' && (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 size={12} className="text-green-400" />
              <span className="text-[11px] text-green-400">Completed</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800/60 flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 text-[11px] font-medium transition-colors border-b-2',
                activeTab === tab
                  ? 'text-blue-400 border-blue-500'
                  : 'text-zinc-600 border-transparent hover:text-zinc-400',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'Overview' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                  Configuration
                </p>
                {[
                  { label: 'Target', value: (sc?.targetSystemId as string)?.slice(0, 16) + '...' ?? '—', icon: <Globe size={11} /> },
                  { label: 'Behavior', value: (sc?.behaviorModelId as string)?.slice(0, 16) + '...' ?? '—', icon: <GitBranch size={11} /> },
                  { label: 'Pattern', value: (sc?.trafficPattern as Record<string, unknown>)?.type as string ?? '—', icon: <Activity size={11} /> },
                  { label: 'Version', value: `v${sc?.version ?? 1}`, icon: <Settings size={11} /> },
                  { label: 'Created', value: sc?.createdAt ? formatDate(sc.createdAt as string) : '—', icon: <Clock size={11} /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-zinc-800/40">
                    <div className="flex items-center gap-1.5 text-zinc-600">
                      {icon}
                      <span className="text-[11px]">{label}</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">{value}</span>
                  </div>
                ))}
              </div>

              {/* Live metrics during run */}
              {runMode !== 'idle' && (
                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                    Live Metrics
                  </p>
                  {[
                    { label: 'Active Agents', value: formatNumber(metrics.activeAgents), icon: <Users size={11} />, color: 'text-blue-400' },
                    { label: 'Requests/sec', value: formatNumber(metrics.rps), icon: <Zap size={11} />, color: 'text-yellow-400' },
                    { label: 'P95 Latency', value: metrics.p95 > 0 ? formatMs(metrics.p95) : '—', icon: <Activity size={11} />, color: 'text-zinc-300' },
                    { label: 'Total Requests', value: formatNumber(metrics.totalRequests), icon: <CheckCircle2 size={11} />, color: 'text-green-400' },
                    { label: 'Errors', value: formatNumber(metrics.totalErrors), icon: <XCircle size={11} />, color: metrics.totalErrors > 0 ? 'text-red-400' : 'text-zinc-600' },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-zinc-800/40">
                      <div className={cn('flex items-center gap-1.5', color)}>
                        {icon}
                        <span className="text-[11px]">{label}</span>
                      </div>
                      <span className={cn('text-[11px] font-semibold tabular-nums', color)}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Regions' && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-3">
                Traffic Source Regions
              </p>
              {REGION_PROFILES.map((region) => (
                <div key={region.code} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{region.flag}</span>
                      <span className="text-xs font-medium text-zinc-300">{region.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-blue-400">{region.pct}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1 mb-2">
                    <div
                      className="bg-blue-500 h-1 rounded-full"
                      style={{ width: `${region.pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-600">
                    <span>P50: {region.p50}ms</span>
                    <span>Mobile: {region.mobile}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Traffic' && (
            <div className="space-y-4">
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                Traffic Pattern
              </p>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-xs font-medium text-zinc-300 capitalize mb-1">
                  {((sc?.trafficPattern as Record<string, unknown>)?.type as string) ?? 'steady'}
                </p>
                <p className="text-[11px] text-zinc-600">
                  {((sc?.trafficPattern as Record<string, unknown>)?.steadyAgents as number)
                    ? `${(sc?.trafficPattern as Record<string, unknown>).steadyAgents} concurrent agents`
                    : 'Custom pattern'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'Behavior' && (
            <div className="space-y-3">
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                User Behavior Model
              </p>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-[11px] text-zinc-500">
                  Behavior model defines how virtual users navigate your application — HTTP sequences, wait times, retries, and state transitions.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'Headers' && (
            <div className="space-y-3">
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                Region-specific Headers
              </p>
              <div className="space-y-2">
                {[
                  { region: 'EU West', header: 'Accept-Language', value: 'en-GB,en;q=0.9' },
                  { region: 'EU West', header: 'DNT', value: '1' },
                  { region: 'South Asia', header: 'Accept-Language', value: 'hi-IN,hi;q=0.9' },
                  { region: 'Middle East', header: 'Accept-Language', value: 'ar-SA,ar;q=0.9' },
                ].map((h, i) => (
                  <div key={i} className="rounded border border-zinc-800 bg-zinc-900/30 p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] text-zinc-600 uppercase">{h.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-blue-400 font-mono">{h.header}:</span>
                      <span className="text-[11px] text-zinc-400 font-mono truncate">{h.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL — war room / map ─────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* World map */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {runMode === 'idle' ? 'Traffic Origin Preview' : runMode === 'running' ? 'Live Traffic Origins' : 'Completed — Traffic Summary'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {runMode === 'idle'
                    ? 'Default global distribution · Run to see live traffic'
                    : runMode === 'running'
                    ? `${formatNumber(metrics.activeAgents)} agents active · ${formatNumber(metrics.totalRequests)} requests sent`
                    : `Run complete · ${formatNumber(metrics.totalRequests)} total requests · ${formatNumber(metrics.totalErrors)} errors`}
                </p>
              </div>
              {runMode === 'running' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-400/10 border border-green-400/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-400 font-medium">LIVE</span>
