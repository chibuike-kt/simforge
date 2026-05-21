'use client';

import { use, useState } from 'react';
import {
  Play, Square, Loader2, CheckCircle2, XCircle,
  Clock, Zap, Activity, Users, ChevronDown,
  Code, Globe, GitBranch, Settings2,
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

type Tab = 'config' | 'regions' | 'headers' | 'body';
type ResultTab = 'map' | 'metrics' | 'latency';

const REGION_PROFILES = [
  { code: 'EU_WEST',      label: 'Western Europe',   pct: 22, p50: 18,  mobile: 45 },
  { code: 'NA_WEST',      label: 'N. America West',  pct: 18, p50: 25,  mobile: 38 },
  { code: 'NA_EAST',      label: 'N. America East',  pct: 15, p50: 20,  mobile: 40 },
  { code: 'ASIA_EAST',    label: 'East Asia',         pct: 12, p50: 15,  mobile: 55 },
  { code: 'ASIA_SOUTH',   label: 'South Asia',        pct: 10, p50: 80,  mobile: 78 },
  { code: 'EU_EAST',      label: 'Eastern Europe',    pct: 8,  p50: 35,  mobile: 52 },
  { code: 'ASIA_SE',      label: 'Southeast Asia',    pct: 9,  p50: 65,  mobile: 72 },
  { code: 'LATAM',        label: 'Latin America',     pct: 6,  p50: 70,  mobile: 68 },
  { code: 'ASIA_CENTRAL', label: 'Middle East',       pct: 5,  p50: 55,  mobile: 65 },
  { code: 'AFRICA',       label: 'Africa',            pct: 4,  p50: 120, mobile: 82 },
  { code: 'OCEANIA',      label: 'Oceania',           pct: 3,  p50: 30,  mobile: 48 },
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
  const [tab, setTab] = useState<Tab>('config');
  const [resultTab, setResultTab] = useState<ResultTab>('map');
  const [runMode, setRunMode] = useState<'idle' | 'running' | 'done'>('idle');
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>(() => generateEmpty(40));

  const { data: scenario, isLoading } = useScenario(id);
  const submitRun = useSubmitRun();
  const sc = scenario as Record<string, unknown> | null;

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
      setRunMode('running');
      setResultTab('map');
      await submitRun.mutateAsync(id);
      toast.success('Simulation started');
    } catch (err) {
      setRunMode('idle');
      toast.error('Failed to start', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={20} className="text-zinc-600 animate-spin" />
      </div>
    );
  }

  const trafficPattern = sc?.trafficPattern as Record<string, unknown> | undefined;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0f0f0f]">

      {/* ── POSTMAN-STYLE URL BAR ─────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/60 bg-[#1a1a1a] flex-shrink-0">
        {/* Method badge */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-xs font-semibold text-orange-400 flex-shrink-0">
          SIM
          <ChevronDown size={10} className="text-zinc-500 ml-1" />
        </div>

        {/* "URL" — scenario target */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-colors">
          <Globe size={11} className="text-zinc-500 flex-shrink-0" />
          <span className="text-sm text-zinc-300 font-mono truncate">
            {(sc?.name as string) ?? 'Loading scenario...'}
          </span>
          <span className={cn(
            'ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded border flex-shrink-0',
            sc?.status === 'published'
              ? 'bg-green-400/10 text-green-400 border-green-400/20'
              : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20',
          )}>
            {(sc?.status as string) ?? 'draft'}
          </span>
        </div>

        {/* Run / Stop button */}
        {runMode === 'idle' && (
          <button
            onClick={handleRun}
            disabled={submitRun.isPending || sc?.status !== 'published'}
            className="flex items-center gap-2 px-4 py-1.5 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex-shrink-0"
          >
            {submitRun.isPending
              ? <Loader2 size={13} className="animate-spin" />
              : <Play size={13} />}
            Run
          </button>
        )}
        {runMode === 'running' && (
          <button
            onClick={() => setRunMode('done')}
            className="flex items-center gap-2 px-4 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-medium transition-colors flex-shrink-0"
          >
            <Square size={13} />
            Stop
          </button>
        )}
        {runMode === 'done' && (
          <button
            onClick={() => { setRunMode('idle'); resetMetrics(); setMetricsHistory(generateEmpty(40)); }}
            className="flex items-center gap-2 px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors flex-shrink-0"
          >
            <Play size={13} />
            Run Again
          </button>
        )}
      </div>

      {/* ── SPLIT CONTENT ────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT — request config (like Postman request panel) */}
        <div className="w-[420px] flex-shrink-0 flex flex-col border-r border-zinc-800/60 overflow-hidden">

          {/* Tabs — like Postman's Params/Auth/Headers/Body tabs */}
          <div className="flex border-b border-zinc-800/60 bg-[#1a1a1a] flex-shrink-0">
            {([
              { key: 'config',  label: 'Config',   icon: <Settings2 size={11} /> },
              { key: 'regions', label: 'Regions',   icon: <Globe size={11} /> },
              { key: 'headers', label: 'Headers',   icon: <Code size={11} /> },
              { key: 'body',    label: 'Behavior',  icon: <GitBranch size={11} /> },
            ] as { key: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs transition-colors border-b-2 whitespace-nowrap',
                  tab === t.key
                    ? 'text-white border-blue-500 bg-[#0f0f0f]'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/30',
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab body — scrollable */}
          <div className="flex-1 overflow-y-auto">

            {/* CONFIG TAB */}
            {tab === 'config' && (
              <div className="p-4 space-y-4 font-mono text-xs">
                <div className="text-zinc-600 text-[10px] uppercase tracking-wider mb-3">
                  Scenario Configuration
                </div>
                {/* JSON-like config viewer */}
                <div className="rounded-lg border border-zinc-800 bg-[#111] p-4 space-y-1.5">
                  <div className="text-zinc-500"><span className="text-zinc-600">{'{'}</span></div>
                  <div className="pl-4 space-y-1">
                    <div>
                      <span className="text-blue-400">&quot;name&quot;</span>
                      <span className="text-zinc-600">: </span>
                      <span className="text-green-400">&quot;{(sc?.name as string) ?? '...'}&quot;</span>
                      <span className="text-zinc-600">,</span>
                    </div>
                    <div>
                      <span className="text-blue-400">&quot;status&quot;</span>
                      <span className="text-zinc-600">: </span>
                      <span className="text-yellow-400">&quot;{(sc?.status as string) ?? '...'}&quot;</span>
                      <span className="text-zinc-600">,</span>
                    </div>
                    <div>
                      <span className="text-blue-400">&quot;version&quot;</span>
                      <span className="text-zinc-600">: </span>
                      <span className="text-orange-400">{(sc?.version as number) ?? 1}</span>
                      <span className="text-zinc-600">,</span>
                    </div>
                    <div>
                      <span className="text-blue-400">&quot;trafficPattern&quot;</span>
                      <span className="text-zinc-600">: {'{'}</span>
                    </div>
                    <div className="pl-4 space-y-1">
                      <div>
                        <span className="text-blue-400">&quot;type&quot;</span>
                        <span className="text-zinc-600">: </span>
                        <span className="text-green-400">&quot;{(trafficPattern?.type as string) ?? 'steady'}&quot;</span>
                        <span className="text-zinc-600">,</span>
                      </div>
                      {trafficPattern?.steadyAgents && (
                        <div>
                          <span className="text-blue-400">&quot;steadyAgents&quot;</span>
                          <span className="text-zinc-600">: </span>
                          <span className="text-orange-400">{trafficPattern.steadyAgents as number}</span>
                        </div>
                      )}
                      {trafficPattern?.startAgents && (
                        <div>
                          <span className="text-blue-400">&quot;startAgents&quot;</span>
                          <span className="text-zinc-600">: </span>
                          <span className="text-orange-400">{trafficPattern.startAgents as number}</span>
                          <span className="text-zinc-600">,</span>
                        </div>
                      )}
                      {trafficPattern?.endAgents && (
                        <div>
                          <span className="text-blue-400">&quot;endAgents&quot;</span>
                          <span className="text-zinc-600">: </span>
                          <span className="text-orange-400">{trafficPattern.endAgents as number}</span>
                        </div>
                      )}
                    </div>
                    <div><span className="text-zinc-600">{'}'}</span><span className="text-zinc-600">,</span></div>
                    <div>
                      <span className="text-blue-400">&quot;createdAt&quot;</span>
                      <span className="text-zinc-600">: </span>
                      <span className="text-green-400">&quot;{sc?.createdAt ? formatDate(sc.createdAt as string) : '...'}&quot;</span>
                    </div>
                  </div>
                  <div className="text-zinc-500"><span className="text-zinc-600">{'}'}</span></div>
                </div>
              </div>
            )}

            {/* REGIONS TAB */}
            {tab === 'regions' && (
              <div className="p-4 space-y-2">
                <div className="text-zinc-600 text-[10px] uppercase tracking-wider mb-3 font-mono">
                  Traffic Source Distribution
                </div>
                {REGION_PROFILES.map((r) => (
                  <div key={r.code} className="flex items-center gap-3 py-2 border-b border-zinc-800/40">
                    <div className="w-28 text-[11px] text-zinc-400 truncate">{r.label}</div>
                    <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${r.pct}%` }}
                      />
                    </div>
                    <div className="w-8 text-[11px] text-blue-400 font-mono text-right">{r.pct}%</div>
                    <div className="w-14 text-[11px] text-zinc-600 font-mono text-right">{r.p50}ms</div>
                    <div className="w-12 text-[11px] text-zinc-600 font-mono text-right">{r.mobile}%📱</div>
                  </div>
                ))}
              </div>
            )}

            {/* HEADERS TAB */}
            {tab === 'headers' && (
              <div className="p-4 font-mono text-xs">
                <div className="text-zinc-600 text-[10px] uppercase tracking-wider mb-3">
                  Region-specific Request Headers
                </div>
                <div className="space-y-3">
                  {[
                    { region: 'EU_WEST',      headers: { 'Accept-Language': 'en-GB,en;q=0.9,fr;q=0.8', 'Accept-Encoding': 'gzip, deflate, br', 'DNT': '1' } },
                    { region: 'ASIA_SOUTH',   headers: { 'Accept-Language': 'hi-IN,hi;q=0.9,en;q=0.7', 'Accept-Encoding': 'gzip, deflate' } },
                    { region: 'ASIA_CENTRAL', headers: { 'Accept-Language': 'ar-SA,ar;q=0.9,en;q=0.8', 'Accept-Encoding': 'gzip, deflate' } },
                    { region: 'LATAM',        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9,es;q=0.8', 'Accept-Encoding': 'gzip, deflate' } },
                  ].map((entry) => (
                    <div key={entry.region} className="rounded border border-zinc-800 bg-[#111] overflow-hidden">
                      <div className="px-3 py-1.5 bg-zinc-800/50 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                        {entry.region}
                      </div>
                      <div className="p-3 space-y-1.5">
                        {Object.entries(entry.headers).map(([k, v]) => (
                          <div key={k} className="flex items-start gap-2">
                            <span className="text-blue-400 flex-shrink-0">{k}:</span>
                            <span className="text-green-400 break-all">&quot;{v}&quot;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BEHAVIOR TAB */}
            {tab === 'body' && (
              <div className="p-4 font-mono text-xs">
                <div className="text-zinc-600 text-[10px] uppercase tracking-wider mb-3">
                  Behavior Model — State Machine
                </div>
                <div className="rounded-lg border border-zinc-800 bg-[#111] p-4 space-y-1.5">
                  <div className="text-zinc-600">{'{'}</div>
                  <div className="pl-4 space-y-1">
                    <div>
                      <span className="text-blue-400">&quot;behaviorModelId&quot;</span>
                      <span className="text-zinc-600">: </span>
                      <span className="text-green-400">&quot;{(sc?.behaviorModelId as string)?.slice(0, 20) ?? '...'}&quot;</span>
                      <span className="text-zinc-600">,</span>
                    </div>
                    <div>
                      <span className="text-blue-400">&quot;entryNode&quot;</span>
                      <span className="text-zinc-600">: </span>
                      <span className="text-green-400">&quot;fetch_user&quot;</span>
                      <span className="text-zinc-600">,</span>
                    </div>
                    <div>
                      <span className="text-blue-400">&quot;nodes&quot;</span>
                      <span className="text-zinc-600">: {'['}</span>
                    </div>
                    <div className="pl-4">
                      <div className="text-zinc-600">{'{'}</div>
                      <div className="pl-4 space-y-1">
                        <div><span className="text-blue-400">&quot;id&quot;</span><span className="text-zinc-600">: </span><span className="text-green-400">&quot;fetch_user&quot;</span><span className="text-zinc-600">,</span></div>
                        <div><span className="text-blue-400">&quot;type&quot;</span><span className="text-zinc-600">: </span><span className="text-yellow-400">&quot;http&quot;</span><span className="text-zinc-600">,</span></div>
                        <div><span className="text-blue-400">&quot;method&quot;</span><span className="text-zinc-600">: </span><span className="text-green-400">&quot;GET&quot;</span></div>
                      </div>
                      <div className="text-zinc-600">{'}'}</div>
                    </div>
                    <div><span className="text-zinc-600">{']'}</span></div>
                  </div>
                  <div className="text-zinc-600">{'}'}</div>
                </div>
              </div>
            )}
          </div>

          {/* ── STATUS BAR — like Postman's response status ── */}
          {runMode !== 'idle' && (
            <div className="border-t border-zinc-800/60 px-4 py-2 bg-[#111] flex items-center gap-4 flex-shrink-0">
              {runMode === 'running' ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[11px] text-green-400 font-medium">RUNNING</span>
                  </div>
                  <span className="text-[11px] text-zinc-600">|</span>
                  <span className="text-[11px] text-zinc-400 font-mono">{formatNumber(metrics.activeAgents)} agents</span>
                  <span className="text-[11px] text-zinc-600">|</span>
                  <span className="text-[11px] text-zinc-400 font-mono">{formatNumber(metrics.rps)} rps</span>
                  <span className="text-[11px] text-zinc-600">|</span>
                  <span className="text-[11px] text-zinc-400 font-mono">{metrics.p95 > 0 ? formatMs(metrics.p95) : '—'} p95</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={11} className="text-green-400" />
                    <span className="text-[11px] text-green-400 font-medium">COMPLETED</span>
                  </div>
                  <span className="text-[11px] text-zinc-600">|</span>
                  <span className="text-[11px] text-zinc-400 font-mono">{formatNumber(metrics.totalRequests)} requests</span>
                  <span className="text-[11px] text-zinc-600">|</span>
                  <span className={cn('text-[11px] font-mono', metrics.totalErrors > 0 ? 'text-red-400' : 'text-green-400')}>
                    {metrics.totalErrors} errors
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT — response/results panel (like Postman response panel) */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Result tabs — like Postman's Body/Headers/Tests result tabs */}
          <div className="flex items-center border-b border-zinc-800/60 bg-[#1a1a1a] flex-shrink-0 px-2">
            {([
              { key: 'map',     label: 'World Map' },
              { key: 'metrics', label: 'RPS' },
              { key: 'latency', label: 'Latency' },
            ] as { key: ResultTab; label: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setResultTab(t.key)}
                className={cn(
                  'px-3 py-2.5 text-xs transition-colors border-b-2 whitespace-nowrap',
                  resultTab === t.key
                    ? 'text-white border-blue-500'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300',
                )}
              >
                {t.label}
              </button>
            ))}

            {/* Live indicator */}
            {runMode === 'running' && (
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1 mr-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-400">LIVE</span>
              </div>
            )}
          </div>

          {/* Result content */}
          <div className="flex-1 overflow-hidden">
            {resultTab === 'map' && (
              <div className="h-full p-4">
                <WorldMap
                  active={runMode === 'running'}
                  agentCount={metrics.activeAgents}
                  regions={regionDistribution.length > 0 ? regionDistribution : undefined}
                />
              </div>
            )}

            {resultTab === 'metrics' && (
              <div className="h-full p-4 flex flex-col">
                <div className="grid grid-cols-4 gap-3 mb-4 flex-shrink-0">
                  {[
                    { label: 'Active Agents', value: formatNumber(metrics.activeAgents), icon: <Users size={12} />, color: 'text-blue-400' },
                    { label: 'Requests/sec',  value: formatNumber(metrics.rps),          icon: <Zap size={12} />,   color: 'text-yellow-400' },
                    { label: 'Total Requests',value: formatNumber(metrics.totalRequests), icon: <Activity size={12} />, color: 'text-green-400' },
                    { label: 'Errors',        value: formatNumber(metrics.totalErrors),   icon: <XCircle size={12} />, color: metrics.totalErrors > 0 ? 'text-red-400' : 'text-zinc-600' },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label} className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3">
                      <div className={cn('flex items-center gap-1.5 mb-1', color)}>
                        {icon}
                        <span className="text-[10px]">{label}</span>
                      </div>
                      <span className={cn('text-xl font-semibold tabular-nums', color)}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex-1 rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3">
                  <RpsChart data={metricsHistory} />
                </div>
              </div>
            )}

            {resultTab === 'latency' && (
              <div className="h-full p-4 flex flex-col">
                <div className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0">
                  {[
                    { label: 'P50', value: metrics.p50 > 0 ? formatMs(metrics.p50) : '—', color: 'text-green-400' },
                    { label: 'P95', value: metrics.p95 > 0 ? formatMs(metrics.p95) : '—', color: 'text-yellow-400' },
                    { label: 'Regions', value: `${Object.keys(metrics.regionBreakdown).length}`, color: 'text-blue-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3">
                      <span className="text-[10px] text-zinc-600 block mb-1">{label}</span>
                      <span className={cn('text-xl font-semibold tabular-nums font-mono', color)}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex-1 rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3">
                  <LatencyChart data={metricsHistory} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
