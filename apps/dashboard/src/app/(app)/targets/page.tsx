'use client';

import { useState } from 'react';
import {
  Plus,
  Target,
  Search,
  Loader2,
  ChevronRight,
  Zap,
  Users,
  ShieldCheck,
  ShieldAlert,
  X,
  Check,
} from 'lucide-react';
import { useTargets } from '@/hooks/use-api';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface TargetSystem {
  id: string;
  name: string;
  allowedOrigins: string[];
  maxRps: number;
  maxConcurrency: number;
  mode: 'sandbox' | 'shadow' | 'production';
  approvalThreshold: number;
  verifiedAt: string | null;
  createdAt: string;
}

type SimulationMode = 'sandbox' | 'shadow' | 'production';

const MODE_STYLES: Record<SimulationMode, string> = {
  sandbox: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  shadow: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  production: 'bg-red-400/10 text-red-400 border-red-400/20',
};

const DEFAULT_FORM = {
  name: '',
  baseUrl: '',
  mode: 'sandbox' as SimulationMode,
  maxRps: 100,
  maxConcurrency: 1000,
  approvalThreshold: 10000,
};

export default function TargetsPage() {
  const { data: targets, isLoading } = useTargets();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const list = (targets as TargetSystem[]) ?? [];
  const filtered = list.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.allowedOrigins.some((o) => o.toLowerCase().includes(search.toLowerCase())),
  );
  const selectedTarget = list.find((t) => t.id === selected);

  async function handleCreate() {
    if (!form.name.trim() || !form.baseUrl.trim()) {
      toast.error('Name and URL are required');
      return;
    }

    // Validate URL
    let origin = form.baseUrl.trim();
    try {
      const parsed = new URL(origin);
      origin = parsed.origin;
    } catch {
      toast.error('Invalid URL — must be a valid URL like https://api.yourapp.com');
      return;
    }

    setSaving(true);
    try {
      await api.createTarget({
        name: form.name.trim(),
        allowedOrigins: [origin],
        mode: form.mode,
        maxRps: form.maxRps,
        maxConcurrency: form.maxConcurrency,
        approvalThreshold: form.approvalThreshold,
      });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast.success(`Target "${form.name}" created`);
      setForm(DEFAULT_FORM);
      setShowForm(false);
    } catch (err) {
      toast.error('Failed to create target', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0f0f0f]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/60 bg-[#1a1a1a] flex-shrink-0">
        <span className="text-sm font-medium text-zinc-300">Targets</span>
        <div className="relative flex-1 max-w-sm">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            placeholder="Search targets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors"
          >
            <Plus size={11} />
            Add Target
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left list */}
        <div className="w-72 border-r border-zinc-800/60 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-3 py-2 border-b border-zinc-800/40">
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              {filtered.length} target{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={16} className="text-zinc-600 animate-spin" />
              </div>
            )}
            {!isLoading && filtered.length === 0 && !showForm && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Target size={20} className="text-zinc-700 mb-3" />
                <p className="text-xs text-zinc-600">No targets yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 mt-2"
                >
                  Add your first target →
                </button>
              </div>
            )}
            {filtered.map((target) => (
              <button
                key={target.id}
                onClick={() => {
                  setSelected(target.id);
                  setShowForm(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 border-b border-zinc-800/40 transition-colors text-left',
                  selected === target.id && !showForm
                    ? 'bg-zinc-800/60 border-l-2 border-l-blue-500'
                    : 'hover:bg-zinc-800/30',
                )}
              >
                <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <Target size={12} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-300 truncate">{target.name}</p>
                  <p className="text-[10px] text-zinc-600 truncate mt-0.5">
                    {target.allowedOrigins[0]}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-[9px] font-medium px-1.5 py-0.5 rounded border flex-shrink-0',
                    MODE_STYLES[target.mode],
                  )}
                >
                  {target.mode}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto">
          {/* Create form */}
          {showForm && (
            <div className="p-6 max-w-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-white">New Target</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider block mb-1.5">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="My API"
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
                  />
                </div>

                {/* Base URL */}
                <div>
                  <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider block mb-1.5">
                    Base URL
                  </label>
                  <input
                    value={form.baseUrl}
                    onChange={(e) => setForm((p) => ({ ...p, baseUrl: e.target.value }))}
                    placeholder="https://api.yourapp.com"
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm text-zinc-300 font-mono focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
                  />
                  <p className="text-[10px] text-zinc-600 mt-1">
                    Only requests to this origin will be allowed
                  </p>
                </div>

                {/* Mode */}
                <div>
                  <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider block mb-1.5">
                    Mode
                  </label>
                  <div className="flex gap-2">
                    {(['sandbox', 'shadow', 'production'] as SimulationMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setForm((p) => ({ ...p, mode }))}
                        className={cn(
                          'flex-1 py-2 rounded text-xs font-medium border transition-colors capitalize',
                          form.mode === mode
                            ? MODE_STYLES[mode]
                            : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50 hover:text-zinc-300',
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {form.mode === 'sandbox' && 'Safe for testing — no real side effects expected'}
                    {form.mode === 'shadow' && 'Mirror traffic — runs alongside production'}
                    {form.mode === 'production' &&
                      '⚠ Real production traffic — requires approval for large runs'}
                  </p>
                </div>

                {/* Max RPS + Concurrency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider block mb-1.5">
                      Max RPS
                    </label>
                    <input
                      type="number"
                      value={form.maxRps}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, maxRps: parseInt(e.target.value) || 100 }))
                      }
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 tabular-nums"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider block mb-1.5">
                      Max Concurrency
                    </label>
                    <input
                      type="number"
                      value={form.maxConcurrency}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, maxConcurrency: parseInt(e.target.value) || 1000 }))
                      }
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 tabular-nums"
                      min={1}
                    />
                  </div>
                </div>

                {/* Approval threshold */}
                <div>
                  <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider block mb-1.5">
                    Approval Threshold
                  </label>
                  <input
                    type="number"
                    value={form.approvalThreshold}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        approvalThreshold: parseInt(e.target.value) || 10000,
                      }))
                    }
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 tabular-nums"
                    min={1}
                  />
                  <p className="text-[10px] text-zinc-600 mt-1">
                    Runs with more agents than this require manual approval
                  </p>
                </div>

                {/* Submit */}
                <button
                  onClick={handleCreate}
                  disabled={saving || !form.name.trim() || !form.baseUrl.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {saving ? 'Creating...' : 'Create Target'}
                </button>
              </div>
            </div>
          )}

          {/* Target detail */}
          {!showForm && selectedTarget && (
            <div className="p-6 max-w-2xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedTarget.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded border',
                        MODE_STYLES[selectedTarget.mode],
                      )}
                    >
                      {selectedTarget.mode}
                    </span>
                    {selectedTarget.verifiedAt ? (
                      <span className="flex items-center gap-1 text-[11px] text-green-400">
                        <ShieldCheck size={10} />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                        <ShieldAlert size={10} />
                        Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* JSON config */}
              <div className="rounded-lg border border-zinc-800 bg-[#111] p-4 font-mono text-xs space-y-1.5 mb-6">
                <div className="text-zinc-600">{'{'}</div>
                <div className="pl-4 space-y-1">
                  <div>
                    <span className="text-blue-400">&quot;id&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-green-400">&quot;{selectedTarget.id}&quot;</span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;mode&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-yellow-400">&quot;{selectedTarget.mode}&quot;</span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;maxRps&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-orange-400">{selectedTarget.maxRps}</span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;maxConcurrency&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-orange-400">{selectedTarget.maxConcurrency}</span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;approvalThreshold&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-orange-400">{selectedTarget.approvalThreshold}</span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;allowedOrigins&quot;</span>
                    <span className="text-zinc-600">: [</span>
                  </div>
                  {selectedTarget.allowedOrigins.map((origin, i) => (
                    <div key={origin} className="pl-4">
                      <span className="text-green-400">&quot;{origin}&quot;</span>
                      {i < selectedTarget.allowedOrigins.length - 1 && (
                        <span className="text-zinc-600">,</span>
                      )}
                    </div>
                  ))}
                  <div>
                    <span className="text-zinc-600">]</span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;createdAt&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-green-400">
                      &quot;{formatDate(selectedTarget.createdAt)}&quot;
                    </span>
                  </div>
                </div>
                <div className="text-zinc-600">{'}'}</div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Max RPS',
                    value: selectedTarget.maxRps.toLocaleString(),
                    icon: <Zap size={13} className="text-yellow-400" />,
                  },
                  {
                    label: 'Max Concurrency',
                    value: selectedTarget.maxConcurrency.toLocaleString(),
                    icon: <Users size={13} className="text-blue-400" />,
                  },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-4">
                    <div className="flex items-center gap-2 mb-1">
                      {icon}
                      <span className="text-xs text-zinc-500">{label}</span>
                    </div>
                    <span className="text-xl font-semibold text-white tabular-nums">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!showForm && !selectedTarget && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">
                  <Target size={24} className="text-zinc-600" />
                </div>
                <p className="text-sm font-medium text-zinc-400 mb-1">Select a target</p>
                <p className="text-xs text-zinc-600 mb-4">Choose a target or add a new one</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors mx-auto"
                >
                  <Plus size={11} />
                  Add Target
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
