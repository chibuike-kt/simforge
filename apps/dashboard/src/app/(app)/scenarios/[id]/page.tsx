'use client';

import { use, useState, useCallback, useRef, useEffect } from 'react';
import {
  Play, Square, Loader2, CheckCircle2,
  Plus, Trash2, ChevronDown,
  Globe, Code, Key,
  GripVertical, Copy, Zap, Users,
  ArrowRight, AlertCircle, Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorldMap } from '@/components/simulation/world-map';
import { RpsChart } from '@/components/charts/rps-chart';
import { LatencyChart } from '@/components/charts/latency-chart';
import { useScenario, useSubmitRun } from '@/hooks/use-api';
import { useRealtime } from '@/hooks/use-realtime';
import { formatNumber, formatMs } from '@/lib/utils';
import { MetricPoint } from '@/types';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type StepTab = 'body' | 'headers' | 'auth' | 'extract';
type ResultTab = 'map' | 'rps' | 'latency' | 'response';

interface ExtractRule { varName: string; path: string; }

interface FlowStep {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: { key: string; value: string }[];
  body: string;
  auth: { type: 'none' | 'bearer' | 'apikey' | 'basic'; value: string };
  extractRules: ExtractRule[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_STYLES: Record<HttpMethod, { color: string; bg: string; border: string }> = {
  GET:    { color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30' },
  POST:   { color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/30' },
  PUT:    { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  PATCH:  { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  DELETE: { color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30' },
};

const FAKER_VARS = [
  { group: 'Person', items: [
    { label: 'Full Name',   value: '{{faker.person.fullName}}' },
    { label: 'First Name',  value: '{{faker.person.firstName}}' },
    { label: 'Last Name',   value: '{{faker.person.lastName}}' },
    { label: 'Job Title',   value: '{{faker.person.jobTitle}}' },
  ]},
  { group: 'Internet', items: [
    { label: 'Email',    value: '{{faker.internet.email}}' },
    { label: 'Username', value: '{{faker.internet.username}}' },
    { label: 'Password', value: '{{faker.internet.password}}' },
    { label: 'URL',      value: '{{faker.internet.url}}' },
  ]},
  { group: 'Identity', items: [
    { label: 'UUID',       value: '{{faker.string.uuid}}' },
    { label: 'NanoID',     value: '{{faker.string.nanoid}}' },
    { label: 'MongoDB ID', value: '{{faker.database.mongodbId}}' },
  ]},
  { group: 'Finance', items: [
    { label: 'Amount',      value: '{{faker.finance.amount}}' },
    { label: 'Currency',    value: '{{faker.finance.currency}}' },
    { label: 'Card Number', value: '{{faker.finance.creditCard}}' },
    { label: 'IBAN',        value: '{{faker.finance.iban}}' },
    { label: 'PIN',         value: '{{faker.finance.pin}}' },
  ]},
  { group: 'Location', items: [
    { label: 'City',    value: '{{faker.location.city}}' },
    { label: 'Country', value: '{{faker.location.country}}' },
    { label: 'Address', value: '{{faker.location.streetAddress}}' },
    { label: 'Zip',     value: '{{faker.location.zipCode}}' },
  ]},
  { group: 'Region', items: [
    { label: 'Agent Country', value: '{{region.country}}' },
    { label: 'Agent Locale',  value: '{{region.locale}}' },
    { label: 'Agent Region',  value: '{{region.code}}' },
  ]},
  { group: 'Commerce', items: [
    { label: 'Product', value: '{{faker.commerce.productName}}' },
    { label: 'Price',   value: '{{faker.commerce.price}}' },
    { label: 'Company', value: '{{faker.company.name}}' },
  ]},
  { group: 'Date', items: [
    { label: 'Future Date', value: '{{faker.date.future}}' },
    { label: 'Past Date',   value: '{{faker.date.past}}' },
    { label: 'Birthdate',   value: '{{faker.date.birthdate}}' },
  ]},
  { group: 'Flow', items: [
    { label: 'Step 1 → id',    value: '{{step.1.response.id}}' },
    { label: 'Step 1 → token', value: '{{step.1.response.token}}' },
    { label: 'Step 2 → id',    value: '{{step.2.response.id}}' },
  ]},
];

// ─── Persistence ──────────────────────────────────────────────────────────────

function storageKey(id: string) { return `simforge:flow:${id}`; }

function loadSteps(id: string): FlowStep[] {
  if (typeof window === 'undefined') return [defaultStep()];
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (raw) return JSON.parse(raw) as FlowStep[];
  } catch {}
  return [defaultStep()];
}

function persistSteps(id: string, steps: FlowStep[]) {
  try { localStorage.setItem(storageKey(id), JSON.stringify(steps)); } catch {}
}

function defaultStep(): FlowStep {
  return {
    id: crypto.randomUUID(),
    name: 'New Request',
    method: 'POST',
    url: '',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: '{\n  \n}',
    auth: { type: 'none', value: '' },
    extractRules: [],
  };
}

function generateEmpty(n: number): MetricPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    time: new Date(Date.now() - (n - i) * 5_000).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
    rps: 0, p50: 0, p95: 0, p99: 0, agents: 0, errors: 0,
  }));
}

// ─── Method Dropdown ──────────────────────────────────────────────────────────

function MethodDropdown({ value, onChange }: { value: HttpMethod; onChange: (m: HttpMethod) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = METHOD_STYLES[value];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(p => !p)}
        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-l border text-xs font-bold transition-colors min-w-[80px] justify-between', s.color, s.bg, s.border)}
      >
        {value}
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-28 bg-[#1e1e1e] border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden py-1">
          {HTTP_METHODS.map((m) => {
            const ms = METHOD_STYLES[m];
            return (
              <button key={m} onClick={() => { onChange(m); setOpen(false); }}
                className={cn('w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors hover:bg-zinc-800', ms.color, value === m && 'bg-zinc-800')}>
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', ms.bg, 'border', ms.border)} />
                {m}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Syntax Highlighter ───────────────────────────────────────────────────────

function getFakerColor(variable: string): string {
  const v = variable.replace(/^\{\{|\}\}$/g, '').trim();
  if (v.startsWith('faker.person'))   return 'text-pink-400 bg-pink-400/10';
  if (v.startsWith('faker.internet')) return 'text-blue-400 bg-blue-400/10';
  if (v.startsWith('faker.phone'))    return 'text-cyan-400 bg-cyan-400/10';
  if (v.startsWith('faker.location')) return 'text-green-400 bg-green-400/10';
  if (v.startsWith('faker.finance'))  return 'text-emerald-400 bg-emerald-400/10';
  if (v.startsWith('faker.commerce')) return 'text-teal-400 bg-teal-400/10';
  if (v.startsWith('faker.company'))  return 'text-teal-400 bg-teal-400/10';
  if (v.startsWith('faker.string'))   return 'text-violet-400 bg-violet-400/10';
  if (v.startsWith('faker.database')) return 'text-violet-400 bg-violet-400/10';
  if (v.startsWith('faker.number'))   return 'text-amber-400 bg-amber-400/10';
  if (v.startsWith('faker.date'))     return 'text-orange-400 bg-orange-400/10';
  if (v.startsWith('region.'))        return 'text-yellow-400 bg-yellow-400/10';
  if (v.startsWith('step.'))          return 'text-red-400 bg-red-400/10';
  return 'text-white bg-zinc-700/30';
}

function tokenizeLine(line: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let rem = line;
  let i = 0;

  while (rem.length > 0) {
    const fm = rem.match(/^(\{\{[^}]+\}\})/);
    if (fm) {
      const c = getFakerColor(fm[1]);
      tokens.push(<span key={i++} className={`${c} rounded-sm px-0.5 font-semibold`}>{fm[1]}</span>);
      rem = rem.slice(fm[1].length); continue;
    }
    const km = rem.match(/^("(?:[^"\\]|\\.)*"\s*)(:)/);
    if (km) {
      tokens.push(<span key={i++} className="text-sky-300">{km[1]}</span>, <span key={i++} className="text-zinc-500">{km[2]}</span>);
      rem = rem.slice(km[0].length); continue;
    }
    const sm = rem.match(/^("(?:[^"\\]|\\.)*")/);
    if (sm) {
      const raw = sm[1];
      if (raw.includes('{{')) {
        const inner = raw.slice(1, -1);
        const parts = inner.split(/(\{\{[^}]+\}\})/g);
        tokens.push(<span key={i++} className="text-emerald-400">&quot;</span>);
        parts.forEach(p => {
          if (p.startsWith('{{')) tokens.push(<span key={i++} className={`${getFakerColor(p)} rounded-sm px-0.5 font-semibold`}>{p}</span>);
          else tokens.push(<span key={i++} className="text-emerald-400">{p}</span>);
        });
        tokens.push(<span key={i++} className="text-emerald-400">&quot;</span>);
      } else {
        tokens.push(<span key={i++} className="text-emerald-400">{raw}</span>);
      }
      rem = rem.slice(raw.length); continue;
    }
    const nm = rem.match(/^(-?\d+\.?\d*)/);
    if (nm) { tokens.push(<span key={i++} className="text-amber-400">{nm[1]}</span>); rem = rem.slice(nm[1].length); continue; }
    const bm = rem.match(/^(true|false|null)/);
    if (bm) { tokens.push(<span key={i++} className="text-violet-400">{bm[1]}</span>); rem = rem.slice(bm[1].length); continue; }
    if (rem[0] === '{' || rem[0] === '}') { tokens.push(<span key={i++} className="text-yellow-600">{rem[0]}</span>); rem = rem.slice(1); continue; }
    if (rem[0] === '[' || rem[0] === ']') { tokens.push(<span key={i++} className="text-blue-400">{rem[0]}</span>); rem = rem.slice(1); continue; }
    if (rem[0] === ',') { tokens.push(<span key={i++} className="text-zinc-500">{rem[0]}</span>); rem = rem.slice(1); continue; }
    const sp = rem.match(/^(\s+)/);
    if (sp) { tokens.push(<span key={i++}>{sp[1]}</span>); rem = rem.slice(sp[1].length); continue; }
    tokens.push(<span key={i++} className="text-zinc-300">{rem[0]}</span>);
    rem = rem.slice(1);
  }
  return tokens;
}

// ─── Field name helper ────────────────────────────────────────────────────────

function getFieldName(variable: string): string {
  const v = variable.replace(/^\{\{|\}\}$/g, '').trim();
  const map: Record<string, string> = {
    'faker.person.fullName': 'name', 'faker.person.firstName': 'firstName',
    'faker.person.lastName': 'lastName', 'faker.person.jobTitle': 'jobTitle',
    'faker.internet.email': 'email', 'faker.internet.username': 'username',
    'faker.internet.password': 'password', 'faker.internet.url': 'url',
    'faker.phone.number': 'phone', 'faker.string.uuid': 'id',
    'faker.string.nanoid': 'nanoid', 'faker.database.mongodbId': 'mongoId',
    'faker.finance.amount': 'amount', 'faker.finance.currency': 'currency',
    'faker.finance.creditCard': 'cardNumber', 'faker.finance.iban': 'iban',
    'faker.finance.pin': 'pin', 'faker.location.city': 'city',
    'faker.location.country': 'country', 'faker.location.streetAddress': 'address',
    'faker.location.zipCode': 'zipCode', 'faker.commerce.productName': 'product',
    'faker.commerce.price': 'price', 'faker.company.name': 'company',
    'faker.date.future': 'expiresAt', 'faker.date.past': 'createdAt',
    'faker.date.birthdate': 'dateOfBirth', 'faker.number.int': 'count',
    'faker.number.float': 'value', 'faker.lorem.sentence': 'description',
    'region.country': 'country', 'region.locale': 'locale', 'region.code': 'region',
    'step.1.response.id': 'userId', 'step.1.response.token': 'token',
    'step.2.response.id': 'resourceId',
  };
  return map[v] ?? v.split('.').pop() ?? 'value';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Persist steps per scenario in localStorage
  const [steps, setSteps] = useState<FlowStep[]>(() => loadSteps(id));
  const [activeStepId, setActiveStepId] = useState<string>(() => {
    const s = loadSteps(id);
    return s[0]?.id ?? '';
  });
  const [stepTab, setStepTab] = useState<StepTab>('body');
  const [resultTab, setResultTab] = useState<ResultTab>('map');
  const [showFakerMenu, setShowFakerMenu] = useState(false);
  const [runMode, setRunMode] = useState<'idle' | 'running' | 'done'>('idle');
  const [scale, setScale] = useState(100);
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>(() => generateEmpty(40));
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const fakerMenuRef = useRef<HTMLDivElement>(null);

  const { data: scenario, isLoading } = useScenario(id);
  const submitRun = useSubmitRun();
  const sc = scenario as Record<string, unknown> | null;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (fakerMenuRef.current && !fakerMenuRef.current.contains(e.target as Node)) setShowFakerMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const { metrics, resetMetrics } = useRealtime({
    enabled: runMode === 'running',
    onEvent: useCallback((event: { eventType: string; latencyMs?: number; bodyRaw?: string }) => {
      if (event.eventType === 'response.received') {
        if (event.bodyRaw) setLastResponse(event.bodyRaw);
        setMetricsHistory(prev => {
          const now = new Date();
          return [...prev.slice(1), {
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            rps: 0, p50: 0, p95: 0, p99: event.latencyMs ?? 0, agents: 0, errors: 0,
          }];
        });
      }
      if (event.eventType === 'shard.completed') setRunMode('done');
    }, []),
  });

  const regionDistribution = Object.entries(metrics.regionBreakdown).map(([regionCode, count]) => {
    const total = Object.values(metrics.regionBreakdown).reduce((s, v) => s + v, 0);
    return { regionCode, agentPct: total > 0 ? count / total : 0 };
  });

  const activeStep = steps.find(s => s.id === activeStepId) ?? steps[0];

  function updateStep(sid: string, patch: Partial<FlowStep>) {
    setSteps(prev => {
      const next = prev.map(s => s.id === sid ? { ...s, ...patch } : s);
      persistSteps(id, next);
      return next;
    });
  }

  function addStep() {
    const step = defaultStep();
    step.name = `Request ${steps.length + 1}`;
    setSteps(prev => {
      const next = [...prev, step];
      persistSteps(id, next);
      return next;
    });
    setActiveStepId(step.id);
  }

  function removeStep(sid: string) {
    if (steps.length === 1) return;
    const remaining = steps.filter(s => s.id !== sid);
    setSteps(remaining);
    persistSteps(id, remaining);
    if (activeStepId === sid) setActiveStepId(remaining[0].id);
  }

  function insertFakerVar(variable: string) {
    const body = activeStep.body.trimEnd();
    const fieldName = getFieldName(variable);
    const newPair = `"${fieldName}": "${variable}"`;
    if (body.endsWith('}')) {
      const hasContent = body.replace(/\s/g, '') !== '{}';
      const insertion = hasContent
        ? body.slice(0, body.lastIndexOf('}')) + `,\n  ${newPair}\n}`
        : `{\n  ${newPair}\n}`;
      updateStep(activeStep.id, { body: insertion });
    } else {
      updateStep(activeStep.id, { body: body + newPair });
    }
    setShowFakerMenu(false);
  }

  async function handleRun() {
    try {
      resetMetrics();
      setMetricsHistory(generateEmpty(40));
      setLastResponse(null);
      setRunMode('running');
      setResultTab('map');

      // Build behavior model nodes from flow steps
      const nodes: Record<string, unknown> = {};
      steps.forEach((step, i) => {
        const nodeId = `step_${i}`;
        const nextId = i < steps.length - 1 ? `step_${i + 1}` : 'done';

        // Build auth headers
        const authHeaders: Record<string, string> = {};
        if (step.auth.type === 'bearer' && step.auth.value) {
          authHeaders['Authorization'] = `Bearer ${step.auth.value}`;
        } else if (step.auth.type === 'apikey' && step.auth.value) {
          authHeaders['X-API-Key'] = step.auth.value;
        } else if (step.auth.type === 'basic' && step.auth.value) {
          authHeaders['Authorization'] = `Basic ${btoa(step.auth.value)}`;
        }

        const allHeaders = {
          ...Object.fromEntries(step.headers.filter(h => h.key && h.value).map(h => [h.key, h.value])),
          ...authHeaders,
        };

        // Extract path from full URL
        let pathTemplate = step.url;
        try {
          const parsed = new URL(step.url);
          pathTemplate = parsed.pathname + parsed.search;
        } catch {}

        nodes[nodeId] = {
          id: nodeId,
          type: 'http',
          label: step.name,
          action: {
            method: step.method,
            pathTemplate: pathTemplate || '/',
            headers: allHeaders,
            bodyTemplate: step.body && step.body.trim() !== '{}' && step.body.trim() !== ''
              ? step.body.trim()
              : null,
          },
          transitions: [{ targetNodeId: nextId, weight: 1, guard: null }],
          cooldownMs: 0,
          thinkTimeMs: { meanMs: 300, stdDevMs: 100 },
          maxRetries: 3,
          extractRules: Object.fromEntries(
            step.extractRules.filter(r => r.varName && r.path).map(r => [r.varName, r.path])
          ),
        };
      });

      nodes['done'] = {
        id: 'done', type: 'abort', label: 'Done',
        action: null, transitions: [], cooldownMs: 0,
        thinkTimeMs: { meanMs: 0, stdDevMs: 0 }, maxRetries: 0,
      };

      // Get base URL from first step
      let baseUrl = '';
      try {
        const parsed = new URL(steps[0].url);
        baseUrl = parsed.origin;
      } catch {
        baseUrl = '';
      }

      await submitRun.mutateAsync({
        id,
        agentCount: scale,
        flowSteps: nodes,
        entryNodeId: 'step_0',
        baseUrl: baseUrl || undefined,
      });

      toast.success(`Simulation started · ${scale.toLocaleString()} virtual users`);
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

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0f0f0f]">

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-zinc-800/60 bg-[#161616] flex-shrink-0">
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/40">
          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">FLOW</span>
          <span className="text-xs text-zinc-300 max-w-[180px] truncate">{(sc?.name as string) ?? 'Loading...'}</span>
          <span className={cn('text-[9px] font-medium px-1 py-0.5 rounded border',
            sc?.status === 'published' ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20')}>
            {(sc?.status as string) ?? 'draft'}
          </span>
        </div>

        <div className="h-4 w-px bg-zinc-800" />
        <span className="text-[11px] text-zinc-600">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>

        {/* Scale */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-zinc-700/50 bg-zinc-800/40">
          <Users size={10} className="text-zinc-500" />
          <input
            type="number"
            value={scale}
            onChange={e => setScale(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 bg-transparent text-xs text-zinc-200 focus:outline-none tabular-nums"
            min={1} max={1000000}
          />
          <span className="text-[10px] text-zinc-500">users</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Save indicator */}
          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
            <Save size={9} />
            Auto-saved
          </span>

          {runMode === 'idle' && (
            <button
              onClick={handleRun}
              disabled={submitRun.isPending || sc?.status !== 'published'}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors shadow-lg shadow-blue-500/20"
            >
              {submitRun.isPending ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              Run
            </button>
          )}
          {runMode === 'running' && (
            <button onClick={() => setRunMode('done')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-semibold transition-colors">
              <Square size={12} />
              Stop
            </button>
          )}
          {runMode === 'done' && (
            <button onClick={() => { setRunMode('idle'); resetMetrics(); setMetricsHistory(generateEmpty(40)); }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors">
              <Play size={12} />
              Run Again
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN SPLIT ──────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── STEP LIST ─────────────────────────────────────── */}
        <div className="w-52 flex-shrink-0 border-r border-zinc-800/60 flex flex-col overflow-hidden bg-[#141414]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/40">
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Flow Steps</span>
            <button onClick={addStep} className="text-zinc-600 hover:text-zinc-300 transition-colors p-0.5 rounded hover:bg-zinc-800">
              <Plus size={12} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {steps.map((step, i) => {
              const s = METHOD_STYLES[step.method];
              return (
                <div key={step.id} onClick={() => setActiveStepId(step.id)}
                  className={cn('flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800/30 transition-colors cursor-pointer group',
                    activeStepId === step.id ? 'bg-zinc-800/60 border-l-2 border-l-blue-500' : 'hover:bg-zinc-800/30')}>
                  <GripVertical size={10} className="text-zinc-700 flex-shrink-0" />
                  <span className="text-[10px] text-zinc-700 w-3 flex-shrink-0 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className={cn('text-[10px] font-bold', s.color)}>{step.method}</span>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{step.name}</p>
                    {step.url && <p className="text-[10px] text-zinc-600 truncate font-mono">{step.url}</p>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeStep(step.id); }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 transition-all">
                    <Trash2 size={10} />
                  </button>
                </div>
              );
            })}
            <button onClick={addStep}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/20 transition-colors">
              <Plus size={10} />
              <span className="text-[11px]">Add step</span>
            </button>
          </div>
        </div>

        {/* ── REQUEST EDITOR ────────────────────────────────── */}
        <div className="w-[420px] flex-shrink-0 flex flex-col border-r border-zinc-800/60 overflow-hidden bg-[#0f0f0f]">

          {/* URL bar */}
          <div className="flex items-center px-3 py-2.5 border-b border-zinc-800/60 gap-0 flex-shrink-0">
            <MethodDropdown value={activeStep.method} onChange={m => updateStep(activeStep.id, { method: m })} />
            <input
              value={activeStep.url}
              onChange={e => updateStep(activeStep.id, { url: e.target.value })}
              placeholder="https://api.yourapp.com/users"
              className="flex-1 px-3 py-1.5 bg-zinc-800/40 border border-l-0 border-zinc-700/50 rounded-r text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40 font-mono transition-colors"
            />
          </div>

          {/* Step name */}
          <div className="px-3 py-1.5 border-b border-zinc-800/30 flex-shrink-0">
            <input
              value={activeStep.name}
              onChange={e => updateStep(activeStep.id, { name: e.target.value })}
              placeholder="Request name"
              className="w-full bg-transparent text-[11px] text-zinc-500 focus:outline-none focus:text-zinc-300 transition-colors"
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800/60 flex-shrink-0 bg-[#141414]">
            {([
              { key: 'body',    label: 'Body',    dot: false },
              { key: 'headers', label: 'Headers', dot: activeStep.headers.length > 1 },
              { key: 'auth',    label: 'Auth',    dot: activeStep.auth.type !== 'none' },
              { key: 'extract', label: 'Extract', dot: activeStep.extractRules.length > 0 },
            ] as { key: StepTab; label: string; dot: boolean }[]).map(t => (
              <button key={t.key} onClick={() => setStepTab(t.key)}
                className={cn('relative flex items-center gap-1.5 px-3 py-2 text-[11px] transition-colors border-b-2 whitespace-nowrap',
                  stepTab === t.key ? 'text-white border-blue-500' : 'text-zinc-600 border-transparent hover:text-zinc-400')}>
                {t.label}
                {t.dot && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">

            {/* BODY */}
            {stepTab === 'body' && (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800/30 flex-shrink-0 bg-[#111]">
                  <div ref={fakerMenuRef} className="relative">
                    <button onClick={() => setShowFakerMenu(p => !p)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-[10px] text-zinc-400 transition-colors">
                      <Zap size={9} className="text-yellow-400" />
                      <span>Insert variable</span>
                      <ChevronDown size={9} className={cn('transition-transform text-zinc-600', showFakerMenu && 'rotate-180')} />
                    </button>
                    {showFakerMenu && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-[#1c1c1c] border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                        <div className="px-3 py-2 border-b border-zinc-800 bg-[#161616]">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Faker Variables</p>
                          <p className="text-[10px] text-zinc-700 mt-0.5">Click to insert · or type your own</p>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {FAKER_VARS.map(group => (
                            <div key={group.group}>
                              <div className="px-3 py-1.5 bg-zinc-800/30 border-b border-zinc-800/50">
                                <span className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">{group.group}</span>
                              </div>
                              {group.items.map(v => (
                                <button key={v.value} onClick={() => insertFakerVar(v.value)}
                                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/50 transition-colors text-left border-b border-zinc-800/20">
                                  <span className="text-[11px] text-zinc-400">{v.label}</span>
                                  <span className="text-[10px] text-yellow-400 font-mono truncate max-w-[130px] ml-2">{v.value}</span>
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-700 ml-auto">JSON · faker templates supported</span>
                </div>

                <div className="flex-1 relative overflow-hidden bg-[#0d0d0d] min-h-0">
                  <textarea
                    value={activeStep.body}
                    onChange={e => updateStep(activeStep.id, { body: e.target.value })}
                    placeholder={'{\n  "name": "{{faker.person.fullName}}",\n  "email": "{{faker.internet.email}}",\n  "password": "{{faker.internet.password}}"\n}'}
                    className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-zinc-300 text-xs font-mono resize-none focus:outline-none border-none leading-6 z-10"
                    spellCheck={false}
                    style={{ caretColor: '#d4d4d8' }}
                  />
                  <pre aria-hidden className="absolute inset-0 p-4 text-xs font-mono leading-6 overflow-hidden pointer-events-none whitespace-pre-wrap break-words">
                    {activeStep.body.split('\n').map((line, li) => (
                      <span key={li}>{tokenizeLine(line)}{'\n'}</span>
                    ))}
                  </pre>
                </div>
              </div>
            )}

            {/* HEADERS */}
            {stepTab === 'headers' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                <div className="grid grid-cols-2 gap-2 px-1 pb-1">
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Key</span>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Value</span>
                </div>
                {activeStep.headers.map((header, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input value={header.key}
                      onChange={e => { const h = [...activeStep.headers]; h[i] = { ...h[i], key: e.target.value }; updateStep(activeStep.id, { headers: h }); }}
                      placeholder="Header-Name"
                      className="flex-1 px-2.5 py-1.5 bg-zinc-800/40 border border-zinc-700/40 rounded text-xs text-zinc-300 font-mono focus:outline-none focus:border-blue-500/30 placeholder:text-zinc-700 transition-colors" />
                    <input value={header.value}
                      onChange={e => { const h = [...activeStep.headers]; h[i] = { ...h[i], value: e.target.value }; updateStep(activeStep.id, { headers: h }); }}
                      placeholder="value"
                      className="flex-1 px-2.5 py-1.5 bg-zinc-800/40 border border-zinc-700/40 rounded text-xs text-zinc-300 font-mono focus:outline-none focus:border-blue-500/30 placeholder:text-zinc-700 transition-colors" />
                    <button onClick={() => updateStep(activeStep.id, { headers: activeStep.headers.filter((_, j) => j !== i) })}
                      className="text-zinc-700 hover:text-red-400 transition-colors p-1"><Trash2 size={11} /></button>
                  </div>
                ))}
                <button onClick={() => updateStep(activeStep.id, { headers: [...activeStep.headers, { key: '', value: '' }] })}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors mt-2 px-1">
                  <Plus size={10} />Add header
                </button>
              </div>
            )}

            {/* AUTH */}
            {stepTab === 'auth' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-2">Auth Type</label>
                  <div className="flex gap-1 flex-wrap">
                    {(['none', 'bearer', 'apikey', 'basic'] as const).map(type => (
                      <button key={type} onClick={() => updateStep(activeStep.id, { auth: { ...activeStep.auth, type } })}
                        className={cn('px-3 py-1.5 rounded text-[11px] font-medium transition-colors capitalize border',
                          activeStep.auth.type === type ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50 hover:text-zinc-300')}>
                        {type === 'none' ? 'No Auth' : type === 'bearer' ? 'Bearer Token' : type === 'apikey' ? 'API Key' : 'Basic Auth'}
                      </button>
                    ))}
                  </div>
                </div>
                {activeStep.auth.type !== 'none' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-600 uppercase tracking-wider block">
                      {activeStep.auth.type === 'bearer' ? 'Token' : activeStep.auth.type === 'apikey' ? 'API Key' : 'username:password'}
                    </label>
                    <input value={activeStep.auth.value}
                      onChange={e => updateStep(activeStep.id, { auth: { ...activeStep.auth, value: e.target.value } })}
                      placeholder={activeStep.auth.type === 'bearer' ? 'eyJ... or {{step.1.response.token}}' : activeStep.auth.type === 'apikey' ? 'sk-...' : 'username:password'}
                      className="w-full px-3 py-2 bg-zinc-800/40 border border-zinc-700/40 rounded text-xs text-zinc-300 font-mono focus:outline-none focus:border-blue-500/30 placeholder:text-zinc-700" />
                    <p className="text-[10px] text-zinc-700">
                      Use <span className="text-yellow-400 font-mono">{'{{step.1.response.token}}'}</span> to chain auth from a previous step
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* EXTRACT */}
            {stepTab === 'extract' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Extract from Response</p>
                  <p className="text-[11px] text-zinc-600 mb-4 leading-relaxed">
                    Capture values and use in later steps via <span className="text-yellow-400 font-mono">{'{{step.N.response.varName}}'}</span>
                  </p>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 px-1 pb-1">
                      <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Variable Name</span>
                      <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Path in Response</span>
                    </div>
                    {activeStep.extractRules.map((rule, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input value={rule.varName}
                          onChange={e => { const r = [...activeStep.extractRules]; r[i] = { ...r[i], varName: e.target.value }; updateStep(activeStep.id, { extractRules: r }); }}
                          placeholder="userId"
                          className="flex-1 px-2.5 py-1.5 bg-zinc-800/40 border border-zinc-700/40 rounded text-xs text-zinc-300 font-mono focus:outline-none focus:border-blue-500/30" />
                        <span className="text-zinc-700 text-xs flex-shrink-0">←</span>
                        <input value={rule.path}
                          onChange={e => { const r = [...activeStep.extractRules]; r[i] = { ...r[i], path: e.target.value }; updateStep(activeStep.id, { extractRules: r }); }}
                          placeholder="body.id"
                          className="flex-1 px-2.5 py-1.5 bg-zinc-800/40 border border-zinc-700/40 rounded text-xs text-zinc-300 font-mono focus:outline-none focus:border-blue-500/30" />
                        <button onClick={() => updateStep(activeStep.id, { extractRules: activeStep.extractRules.filter((_, j) => j !== i) })}
                          className="text-zinc-700 hover:text-red-400 transition-colors p-1"><Trash2 size={11} /></button>
                      </div>
                    ))}
                    <button onClick={() => updateStep(activeStep.id, { extractRules: [...activeStep.extractRules, { varName: '', path: 'body.' }] })}
                      className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors mt-1">
                      <Plus size={10} />Add rule
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status bar */}
          {runMode !== 'idle' && (
            <div className="border-t border-zinc-800/60 px-3 py-2 bg-[#111] flex items-center gap-3 flex-shrink-0">
              {runMode === 'running' ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  <span className="text-[11px] text-green-400 font-semibold">RUNNING</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-[11px] text-zinc-400 font-mono tabular-nums">{formatNumber(metrics.activeAgents)} agents</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-[11px] text-zinc-400 font-mono tabular-nums">{formatNumber(metrics.rps)} rps</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={11} className="text-green-400 flex-shrink-0" />
                  <span className="text-[11px] text-green-400 font-semibold">COMPLETED</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-[11px] text-zinc-400 font-mono tabular-nums">{formatNumber(metrics.totalRequests)} req</span>
                  <span className="text-zinc-700">·</span>
                  <span className={cn('text-[11px] font-mono tabular-nums', metrics.totalErrors > 0 ? 'text-red-400' : 'text-green-400')}>
                    {metrics.totalErrors} err
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── RESPONSE PANEL ────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center border-b border-zinc-800/60 bg-[#141414] flex-shrink-0 px-1">
            {([
              { key: 'map',      label: 'World Map' },
              { key: 'rps',      label: 'RPS' },
              { key: 'latency',  label: 'Latency' },
              { key: 'response', label: 'Response' },
            ] as { key: ResultTab; label: string }[]).map(t => (
              <button key={t.key} onClick={() => setResultTab(t.key)}
                className={cn('px-3 py-2.5 text-[11px] transition-colors border-b-2 whitespace-nowrap',
                  resultTab === t.key ? 'text-white border-blue-500' : 'text-zinc-600 border-transparent hover:text-zinc-400')}>
                {t.label}
              </button>
            ))}
            {runMode === 'running' && (
              <div className="ml-auto flex items-center gap-2 px-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-400 font-medium">LIVE</span>
                <span className="text-zinc-700 text-[10px]">·</span>
                <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                  {formatNumber(metrics.activeAgents)} agents · {formatNumber(metrics.rps)} rps · {metrics.p95 > 0 ? formatMs(metrics.p95) : '—'} p95
                </span>
              </div>
            )}
            {runMode === 'done' && (
              <div className="ml-auto flex items-center gap-2 px-3">
                <CheckCircle2 size={11} className="text-green-400" />
                <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                  {formatNumber(metrics.totalRequests)} requests · {metrics.totalErrors} errors
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {resultTab === 'map' && (
              <div className="h-full p-4">
                {runMode === 'idle' ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                      <AlertCircle size={11} className="text-zinc-600" />
                      <span className="text-[11px] text-zinc-600">Default global distribution · Run to see live traffic</span>
                    </div>
                    <div className="flex-1"><WorldMap active={false} agentCount={0} /></div>
                  </div>
                ) : (
                  <WorldMap active={runMode === 'running'} agentCount={metrics.activeAgents}
                    regions={regionDistribution.length > 0 ? regionDistribution : undefined} />
                )}
              </div>
            )}

            {resultTab === 'rps' && (
              <div className="h-full p-4 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-3 flex-shrink-0">
                  {[
                    { label: 'Active Agents', value: formatNumber(metrics.activeAgents), color: 'text-blue-400' },
                    { label: 'Requests/sec',  value: formatNumber(metrics.rps),          color: 'text-yellow-400' },
                    { label: 'Total',         value: formatNumber(metrics.totalRequests), color: 'text-green-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3">
                      <p className="text-[10px] text-zinc-600 mb-1">{label}</p>
                      <p className={cn('text-xl font-semibold tabular-nums', color)}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex-1 rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3 min-h-0">
                  <RpsChart data={metricsHistory} />
                </div>
              </div>
            )}

            {resultTab === 'latency' && (
              <div className="h-full p-4 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-3 flex-shrink-0">
                  {[
                    { label: 'P50',    value: metrics.p50 > 0 ? formatMs(metrics.p50) : '—', color: 'text-green-400' },
                    { label: 'P95',    value: metrics.p95 > 0 ? formatMs(metrics.p95) : '—', color: 'text-yellow-400' },
                    { label: 'Errors', value: formatNumber(metrics.totalErrors), color: metrics.totalErrors > 0 ? 'text-red-400' : 'text-zinc-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3">
                      <p className="text-[10px] text-zinc-600 mb-1">{label}</p>
                      <p className={cn('text-xl font-semibold tabular-nums font-mono', color)}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex-1 rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3 min-h-0">
                  <LatencyChart data={metricsHistory} />
                </div>
              </div>
            )}

            {resultTab === 'response' && (
              <div className="h-full flex flex-col p-4 gap-3">
                <div className="flex items-center justify-between flex-shrink-0">
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Latest Response Sample</span>
                  {lastResponse && (
                    <button onClick={() => navigator.clipboard.writeText(lastResponse)}
                      className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
                      <Copy size={10} />Copy
                    </button>
                  )}
                </div>
                <div className="flex-1 rounded-lg border border-zinc-800 bg-[#0d0d0d] p-4 overflow-y-auto min-h-0">
                  {!lastResponse ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-zinc-700">
                        {runMode === 'idle' ? 'Run to see response samples' : 'Waiting for first response...'}
                      </p>
                    </div>
                  ) : (
                    <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(lastResponse), null, 2)
                            .split('\n').map((line, li) => <span key={li}>{tokenizeLine(line)}{'\n'}</span>);
                        } catch {
                          return <span className="text-zinc-300">{lastResponse}</span>;
                        }
                      })()}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
