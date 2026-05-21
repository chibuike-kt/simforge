'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Clock,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Circle,
  ChevronRight,
  Zap,
  Users,
} from 'lucide-react';
import { RunStatusBadge } from '@/components/simulation/run-status-badge';
import { formatDate } from '@/lib/utils';
import { SimulationRun, RunStatus } from '@/types';
import { usePendingRuns, useApproveRun } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { label: string; value: RunStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Running', value: 'running' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Pending', value: 'pending' },
];

function StatusIcon({ status }: { status: RunStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={13} className="text-green-400" />;
    case 'failed':
      return <XCircle size={13} className="text-red-400" />;
    case 'running':
      return <Circle size={13} className="text-blue-400 animate-pulse fill-blue-400" />;
    default:
      return <Circle size={13} className="text-zinc-600" />;
  }
}

export default function RunsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RunStatus | 'all'>('all');
  const { data: pendingRuns, isLoading, refetch } = usePendingRuns();
  const approveRun = useApproveRun();

  const runs = (pendingRuns as SimulationRun[]) ?? [];
  const filtered = runs.filter((run) => {
    const matchSearch = run.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || run.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0f0f0f]">
      {/* Toolbar — like Postman collection runner toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/60 bg-[#1a1a1a] flex-shrink-0">
        <span className="text-sm font-medium text-zinc-300">Runs</span>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            placeholder="Search by run ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-0.5 bg-zinc-800/50 border border-zinc-700/50 rounded p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-2.5 py-1 rounded text-[11px] font-medium transition-all',
                statusFilter === f.value
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => refetch()}
          className="p-1.5 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
        >
          <RefreshCw size={12} />
        </button>

        <div className="ml-auto">
          <Link href="/scenarios">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors">
              <Play size={11} />
              New Run
            </button>
          </Link>
        </div>
      </div>

      {/* Pending approval banner */}
      {!isLoading && runs.some((r) => r.status === 'pending') && (
        <div className="flex items-center gap-3 px-4 py-2 bg-yellow-500/5 border-b border-yellow-500/20 flex-shrink-0">
          <AlertCircle size={12} className="text-yellow-400 flex-shrink-0" />
          <span className="text-xs text-yellow-400">
            {runs.filter((r) => r.status === 'pending').length} run
            {runs.filter((r) => r.status === 'pending').length > 1 ? 's' : ''} awaiting manual
            approval
          </span>
          <div className="ml-auto flex items-center gap-2">
            {runs
              .filter((r) => r.status === 'pending')
              .map((run) => (
                <button
                  key={run.id}
                  onClick={() => approveRun.mutate(run.id)}
                  disabled={approveRun.isPending}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/20 text-yellow-400 text-[11px] font-medium transition-colors"
                >
                  {approveRun.isPending ? (
                    <Loader2 size={9} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={9} />
                  )}
                  Approve {run.id.slice(0, 8)}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Runs list — left panel like Postman history */}
        <div className="w-72 border-r border-zinc-800/60 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-3 py-2 border-b border-zinc-800/40 flex items-center justify-between">
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              {filtered.length} run{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={16} className="text-zinc-600 animate-spin" />
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Play size={20} className="text-zinc-700 mb-3" />
                <p className="text-xs text-zinc-600">No runs yet</p>
                <p className="text-[11px] text-zinc-700 mt-1">Go to a scenario and click Run</p>
              </div>
            )}

            {filtered.map((run) => (
              <Link
                key={run.id}
                href={`/scenarios/${run.scenarioId}`}
                className="flex items-center gap-3 px-3 py-3 border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors group"
              >
                <StatusIcon status={run.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
                    {run.id.slice(0, 16)}...
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={9} className="text-zinc-700" />
                    <span className="text-[10px] text-zinc-700">{formatDate(run.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight
                  size={11}
                  className="text-zinc-700 group-hover:text-zinc-500 flex-shrink-0"
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Right panel — run detail or empty state */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">
              <Play size={24} className="text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Select a run</p>
            <p className="text-xs text-zinc-600 mb-6">Choose a run from the list to view details</p>
            <div className="flex items-center gap-3 justify-center text-xs text-zinc-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-green-400" />
                <span>{runs.filter((r) => r.status === 'completed').length} completed</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <Circle size={11} className="text-blue-400" />
                <span>{runs.filter((r) => r.status === 'running').length} running</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <XCircle size={11} className="text-red-400" />
                <span>{runs.filter((r) => r.status === 'failed').length} failed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
