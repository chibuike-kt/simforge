'use client';

import { useState } from 'react';
import {
  BarChart2,
  CheckCircle2,
  XCircle,
  Zap,
  Activity,
  Users,
  Clock,
  ChevronRight,
  Globe,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { useScenarios } from '@/hooks/use-api';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { formatNumber, formatMs, formatDate } from '@/lib/utils';
import { RpsChart } from '@/components/charts/rps-chart';
import { LatencyChart } from '@/components/charts/latency-chart';
import { cn } from '@/lib/utils';
import { Scenario } from '@/types';

interface RunSummary {
  runId: string;
  createdAt: string;
  status: string;
  totalRequests: number;
  totalErrors: number;
  peakRps: number;
  avgP95Ms: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface RunMetrics {
  runId: string;
  shards: number;
  totalRequests: number;
  totalErrors: number;
  totalAgents: number;
  completedAgents: number;
  failedAgents: number;
  durationMs: number;
  peakRps: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  successRate: number;
  errorRate: number;
  regionBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  errorSamples: { error: string; count: number; regionCode?: string }[];
  startedAt: string | null;
  completedAt: string | null;
}

const REGION_LABELS: Record<string, string> = {
  NA_WEST: 'N. America West',
  NA_EAST: 'N. America East',
  EU_WEST: 'Western Europe',
  EU_EAST: 'Eastern Europe',
  ASIA_EAST: 'East Asia',
  ASIA_SE: 'Southeast Asia',
  ASIA_SOUTH: 'South Asia',
  ASIA_CENTRAL: 'Middle East',
  AFRICA: 'Africa',
  LATAM: 'Latin America',
  OCEANIA: 'Oceania',
};

export default function ReportsPage() {
  const { data: scenarios } = useScenarios();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const scenarioList = (scenarios as Scenario[]) ?? [];

  const { data: runSummaries, isLoading: summariesLoading } = useQuery({
    queryKey: ['run-summaries', selectedScenarioId],
    queryFn: () => api.getScenarioRunMetrics(selectedScenarioId!) as Promise<RunSummary[]>,
    enabled: !!selectedScenarioId,
  });

  const { data: runMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['run-metrics', selectedRunId],
    queryFn: () => api.getRunMetrics(selectedRunId!) as Promise<RunMetrics>,
    enabled: !!selectedRunId,
  });

  const summaries = (runSummaries as RunSummary[]) ?? [];
  const metrics = runMetrics as RunMetrics | null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0f0f0f]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/60 bg-[#1a1a1a] flex-shrink-0">
        <span className="text-sm font-medium text-zinc-300">Reports</span>
        {/* Scenario selector */}
        <select
          value={selectedScenarioId ?? ''}
          onChange={(e) => {
            setSelectedScenarioId(e.target.value || null);
            setSelectedRunId(null);
          }}
          className="ml-2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50"
        >
          <option value="">Select scenario...</option>
          {scenarioList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left — run list */}
        <div className="w-64 border-r border-zinc-800/60 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-3 py-2 border-b border-zinc-800/40">
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              {summaries.length} run{summaries.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedScenarioId && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <BarChart2 size={20} className="text-zinc-700 mb-3" />
                <p className="text-xs text-zinc-600">Select a scenario</p>
              </div>
            )}
            {summariesLoading && selectedScenarioId && (
              <div className="flex items-center justify-center py-12">
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}
            {summaries.map((run) => (
              <button
                key={run.runId}
                onClick={() => setSelectedRunId(run.runId)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 border-b border-zinc-800/40 transition-colors text-left',
                  selectedRunId === run.runId
                    ? 'bg-zinc-800/60 border-l-2 border-l-blue-500'
                    : 'hover:bg-zinc-800/30',
                )}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    run.totalRequests > 0 ? 'bg-green-400' : 'bg-zinc-600',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono text-zinc-400 truncate">
                    {run.runId.slice(0, 16)}...
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-600">{formatDate(run.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-blue-400 tabular-nums">
                      {formatNumber(run.totalRequests)} req
                    </span>
                    {run.totalErrors > 0 && (
                      <span className="text-[10px] text-red-400">{run.totalErrors} err</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={11} className="text-zinc-700 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Right — run detail */}
        <div className="flex-1 overflow-y-auto">
          {!selectedRunId && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">
                  <BarChart2 size={24} className="text-zinc-600" />
                </div>
                <p className="text-sm font-medium text-zinc-400 mb-1">Select a run</p>
                <p className="text-xs text-zinc-600">
                  Choose a run from the list to view its report
                </p>
              </div>
            </div>
          )}

          {metricsLoading && selectedRunId && (
            <div className="h-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {metrics && (
            <div className="p-6 space-y-6 max-w-4xl">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-base font-semibold text-white">Run Report</h2>
                  <span className="text-[10px] font-mono text-zinc-600">
                    {metrics.runId.slice(0, 20)}...
                  </span>
                </div>
                {metrics.startedAt && (
                  <p className="text-xs text-zinc-500">
                    {formatDate(metrics.startedAt)}
                    {metrics.completedAt && ` → ${formatDate(metrics.completedAt)}`}
                    {metrics.durationMs > 0 && ` · ${(metrics.durationMs / 1000).toFixed(1)}s`}
                  </p>
                )}
              </div>

              {/* Summary metrics */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    label: 'Total Requests',
                    value: formatNumber(metrics.totalRequests),
                    icon: <Activity size={13} />,
                    color: 'text-blue-400',
                    sub: `${metrics.totalAgents} agents`,
                  },
                  {
                    label: 'Success Rate',
                    value: `${metrics.successRate.toFixed(1)}%`,
                    icon: <CheckCircle2 size={13} />,
                    color:
                      metrics.successRate > 99
                        ? 'text-green-400'
                        : metrics.successRate > 95
                          ? 'text-yellow-400'
                          : 'text-red-400',
                    sub: `${metrics.totalErrors} errors`,
                  },
                  {
                    label: 'Peak RPS',
                    value: formatNumber(metrics.peakRps),
                    icon: <Zap size={13} />,
                    color: 'text-yellow-400',
                    sub: `${metrics.shards} shard${metrics.shards !== 1 ? 's' : ''}`,
                  },
                  {
                    label: 'P95 Latency',
                    value: metrics.p95Ms > 0 ? formatMs(metrics.p95Ms) : '—',
                    icon: <TrendingUp size={13} />,
                    color:
                      metrics.p95Ms < 200
                        ? 'text-green-400'
                        : metrics.p95Ms < 500
                          ? 'text-yellow-400'
                          : 'text-red-400',
                    sub: `P50: ${formatMs(metrics.p50Ms)}`,
                  },
                ].map(({ label, value, icon, color, sub }) => (
                  <div key={label} className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-4">
                    <div className={cn('flex items-center gap-1.5 mb-2', color)}>
                      {icon}
                      <span className="text-[10px] text-zinc-500">{label}</span>
                    </div>
                    <p className={cn('text-2xl font-semibold tabular-nums', color)}>{value}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Latency percentiles */}
              <div className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-4">
                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-4">
                  Latency Percentiles
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'P50', value: metrics.p50Ms, color: 'bg-green-400' },
                    { label: 'P95', value: metrics.p95Ms, color: 'bg-yellow-400' },
                    { label: 'P99', value: metrics.p99Ms, color: 'bg-red-400' },
                  ].map(({ label, value, color }) => {
                    const maxMs = Math.max(metrics.p99Ms, 1);
                    const pct = Math.min((value / maxMs) * 100, 100);
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-zinc-500">{label}</span>
                          <span className="text-sm font-semibold text-zinc-200 tabular-nums font-mono">
                            {value > 0 ? formatMs(value) : '—'}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5">
                          <div
                            className={cn('h-1.5 rounded-full transition-all', color)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Region breakdown */}
              {Object.keys(metrics.regionBreakdown).length > 0 && (
                <div className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-4">
                  <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-4">
                    Traffic by Region
                  </p>
                  <div className="space-y-3">
                    {Object.entries(metrics.regionBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([region, count]) => {
                        const total = Object.values(metrics.regionBreakdown).reduce(
                          (s, v) => s + v,
                          0,
                        );
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div key={region} className="flex items-center gap-3">
                            <div className="w-32 text-[11px] text-zinc-400 truncate">
                              {REGION_LABELS[region] ?? region}
                            </div>
                            <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="w-12 text-[11px] text-zinc-400 tabular-nums text-right">
                              {pct.toFixed(1)}%
                            </div>
                            <div className="w-16 text-[11px] text-zinc-600 tabular-nums text-right">
                              {formatNumber(count)} req
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Status code breakdown */}
              {Object.keys(metrics.statusBreakdown).length > 0 && (
                <div className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-4">
                  <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-4">
                    Response Status Codes
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(metrics.statusBreakdown)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([code, count]) => {
                        const c = Number(code);
                        const color =
                          c >= 500
                            ? 'text-red-400 bg-red-400/10 border-red-400/20'
                            : c >= 400
                              ? 'text-orange-400 bg-orange-400/10 border-orange-400/20'
                              : c >= 300
                                ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                                : 'text-green-400 bg-green-400/10 border-green-400/20';
                        return (
                          <div
                            key={code}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg border',
                              color,
                            )}
                          >
                            <span className="text-sm font-bold font-mono">{code}</span>
                            <span className="text-xs tabular-nums">{formatNumber(count)}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Country breakdown */}
              {Object.keys(metrics.countryBreakdown).length > 0 && (
                <div className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-4">
                  <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-4">
                    Top Countries
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(metrics.countryBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([country, count]) => {
                        const total = Object.values(metrics.countryBreakdown).reduce(
                          (s, v) => s + v,
                          0,
                        );
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div key={country} className="flex items-center gap-2 py-1">
                            <span className="text-xs font-mono font-bold text-zinc-500 w-8">
                              {country}
                            </span>
                            <div className="flex-1 bg-zinc-800 rounded-full h-1">
                              <div
                                className="bg-blue-400 h-1 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-zinc-600 tabular-nums w-8 text-right">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Error samples */}
              {metrics.errorSamples.length > 0 && (
                <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-4">
                  <p className="text-[10px] font-medium text-red-400 uppercase tracking-wider mb-4">
                    Error Samples
                  </p>
                  <div className="space-y-2">
                    {metrics.errorSamples.map((sample, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1.5 border-b border-red-400/10"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={11} className="text-red-400 flex-shrink-0" />
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {sample.error}
                          </span>
                          {sample.regionCode && (
                            <span className="text-[10px] text-zinc-600">{sample.regionCode}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-red-400 tabular-nums">
                          {sample.count}×
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No metrics yet */}
              {metrics.totalRequests === 0 && (
                <div className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-8 text-center">
                  <AlertTriangle size={20} className="text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No request data for this run</p>
                  <p className="text-xs text-zinc-700 mt-1">
                    The run may have failed before any requests were made
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
