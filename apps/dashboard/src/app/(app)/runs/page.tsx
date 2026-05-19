'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, ArrowRight, Clock, Search, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RunStatusBadge } from '@/components/simulation/run-status-badge';
import { formatDate } from '@/lib/utils';
import { SimulationRun, RunStatus } from '@/types';
import { usePendingRuns, useApproveRun } from '@/hooks/use-api';

const STATUS_FILTERS: { label: string; value: RunStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Running', value: 'running' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Pending', value: 'pending' },
];

export default function RunsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RunStatus | 'all'>('all');
  const { data: pendingRuns, isLoading: pendingLoading } = usePendingRuns();
  const approveRun = useApproveRun();

  const pending = (pendingRuns as SimulationRun[]) ?? [];

  return (
    <div className="space-y-5 animate-slide-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Simulation Runs</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Monitor and manage all simulation runs</p>
        </div>
        <Link href="/scenarios">
          <Button
            size="sm"
            className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
          >
            <Play size={12} />
            New Run
          </Button>
        </Link>
      </div>

      {/* Pending approvals banner */}
      {!pendingLoading && pending.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={15} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-400">
                {pending.length} run{pending.length > 1 ? 's' : ''} awaiting approval
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                These runs are ready to dispatch but require manual approval
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {pending.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">{run.id.slice(0, 12)}...</span>
                  <RunStatusBadge status={run.status} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600">{formatDate(run.createdAt)}</span>
                  <Button
                    size="sm"
                    className="h-6 text-[11px] bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/20 gap-1"
                    onClick={() => approveRun.mutate(run.id)}
                    disabled={approveRun.isPending}
                  >
                    {approveRun.isPending ? <Loader2 size={9} className="animate-spin" /> : null}
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search runs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
        >
          <RefreshCw size={13} />
        </Button>
      </div>

      {/* Empty state */}
      {!pendingLoading && pending.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/50">
            <div className="col-span-3 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              Run ID
            </div>
            <div className="col-span-3 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              Scenario
            </div>
            <div className="col-span-2 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              Status
            </div>
            <div className="col-span-2 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              Created
            </div>
            <div className="col-span-2 text-[10px] font-medium text-zinc-600 uppercase tracking-wider"></div>
          </div>
          <div className="py-16 text-center">
            <Play size={24} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-600">No runs yet</p>
            <p className="text-xs text-zinc-700 mt-1">Go to Scenarios and submit a run</p>
          </div>
        </div>
      )}

      {/* Pending runs table */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/50">
            <div className="col-span-4 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              Run ID
            </div>
            <div className="col-span-3 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              Status
            </div>
            <div className="col-span-3 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              Created
            </div>
            <div className="col-span-2 text-[10px] font-medium text-zinc-600 uppercase tracking-wider"></div>
          </div>
          <div className="divide-y divide-zinc-800">
            {pending
              .filter((run) => {
                const matchSearch = run.id.includes(search);
                const matchStatus = statusFilter === 'all' || run.status === statusFilter;
                return matchSearch && matchStatus;
              })
              .map((run) => (
                <Link
                  key={run.id}
                  href={`/runs/${run.id}`}
                  className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-zinc-800/40 transition-colors group items-center"
                >
                  <div className="col-span-4 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                      <Play size={11} className="text-zinc-500" />
                    </div>
                    <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-300 transition-colors truncate">
                      {run.id.slice(0, 16)}...
                    </span>
                  </div>
                  <div className="col-span-3">
                    <RunStatusBadge status={run.status} />
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5">
                    <Clock size={10} className="text-zinc-600" />
                    <span className="text-xs text-zinc-600">{formatDate(run.createdAt)}</span>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <ArrowRight
                      size={12}
                      className="text-zinc-700 group-hover:text-zinc-500 transition-colors"
                    />
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
