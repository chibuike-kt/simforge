'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Activity,
  Search,
  Loader2,
  ChevronRight,
  Play,
  Clock,
  Folder,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { useScenarios, usePublishScenario, useSubmitRun } from '@/hooks/use-api';
import { Scenario, ScenarioStatus } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

function StatusDot({ status }: { status: ScenarioStatus }) {
  return (
    <span
      className={cn(
        'w-1.5 h-1.5 rounded-full flex-shrink-0',
        status === 'published' ? 'bg-green-400' : 'bg-zinc-600',
      )}
    />
  );
}

export default function ScenariosPage() {
  const { data: scenarios, isLoading } = useScenarios();
  const publishScenario = usePublishScenario();
  const submitRun = useSubmitRun();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const list = (scenarios as Scenario[]) ?? [];
  const filtered = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const selectedScenario = list.find((s) => s.id === selected);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0f0f0f]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/60 bg-[#1a1a1a] flex-shrink-0">
        <span className="text-sm font-medium text-zinc-300">Scenarios</span>
        <div className="relative flex-1 max-w-sm">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            placeholder="Search scenarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <div className="ml-auto">
          <Link href="/scenarios/new">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors">
              <Plus size={11} />
              New Scenario
            </button>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left list */}
        <div className="w-72 border-r border-zinc-800/60 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-3 py-2 border-b border-zinc-800/40">
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              {filtered.length} scenario{filtered.length !== 1 ? 's' : ''}
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
                <Activity size={20} className="text-zinc-700 mb-3" />
                <p className="text-xs text-zinc-600">No scenarios yet</p>
                <Link
                  href="/scenarios/new"
                  className="text-[11px] text-blue-400 hover:text-blue-300 mt-2"
                >
                  Create your first scenario →
                </Link>
              </div>
            )}
            {filtered.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelected(scenario.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 border-b border-zinc-800/40 transition-colors text-left',
                  selected === scenario.id
                    ? 'bg-zinc-800/60 border-l-2 border-l-blue-500'
                    : 'hover:bg-zinc-800/30',
                )}
              >
                <StatusDot status={scenario.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-300 truncate">{scenario.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-zinc-600 capitalize">{scenario.status}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-[10px] text-zinc-600">v{scenario.version}</span>
                  </div>
                </div>
                <ChevronRight size={11} className="text-zinc-700 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Right detail */}
        <div className="flex-1 overflow-y-auto">
          {!selectedScenario ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">
                  <Activity size={24} className="text-zinc-600" />
                </div>
                <p className="text-sm font-medium text-zinc-400 mb-1">Select a scenario</p>
                <p className="text-xs text-zinc-600 mb-4">Choose a scenario to view and run</p>
                <Link href="/scenarios/new">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors mx-auto">
                    <Plus size={11} />
                    New Scenario
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 max-w-2xl">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedScenario.name}</h2>
                  {selectedScenario.description && (
                    <p className="text-xs text-zinc-500 mt-1">{selectedScenario.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded border',
                        selectedScenario.status === 'published'
                          ? 'bg-green-400/10 text-green-400 border-green-400/20'
                          : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20',
                      )}
                    >
                      {selectedScenario.status}
                    </span>
                    <span className="text-[10px] text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">
                      v{selectedScenario.version}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {selectedScenario.status === 'draft' && (
                    <button
                      onClick={async () => {
                        try {
                          await publishScenario.mutateAsync(selectedScenario.id);
                          toast.success('Scenario published');
                        } catch {
                          toast.error('Failed to publish');
                        }
                      }}
                      disabled={publishScenario.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 text-xs font-medium transition-colors"
                    >
                      {publishScenario.isPending ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={11} />
                      )}
                      Publish
                    </button>
                  )}
                  <Link href={`/scenarios/${selectedScenario.id}`}>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors">
                      <Play size={11} />
                      Open & Run
                    </button>
                  </Link>
                </div>
              </div>

              {/* JSON config */}
              <div className="rounded-lg border border-zinc-800 bg-[#111] p-4 font-mono text-xs space-y-1.5 mb-6">
                <div className="text-zinc-600">{'{'}</div>
                <div className="pl-4 space-y-1">
                  <div>
                    <span className="text-blue-400">&quot;id&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-green-400">&quot;{selectedScenario.id}&quot;</span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;status&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-yellow-400">&quot;{selectedScenario.status}&quot;</span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;trafficPattern&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-orange-400">
                      &quot;
                      {((selectedScenario.trafficPattern as unknown as Record<string, unknown>)
                        ?.type as string) ?? 'steady'}
                      &quot;
                    </span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;targetSystemId&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-green-400">
                      &quot;{selectedScenario.targetSystemId.slice(0, 20)}...&quot;
                    </span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;behaviorModelId&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-green-400">
                      &quot;{selectedScenario.behaviorModelId.slice(0, 20)}...&quot;
                    </span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;createdAt&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-green-400">
                      &quot;{formatDate(selectedScenario.createdAt)}&quot;
                    </span>
                  </div>
                </div>
                <div className="text-zinc-600">{'}'}</div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/scenarios/${selectedScenario.id}`} className="block">
                  <div className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-4 hover:border-zinc-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Play size={13} className="text-blue-400" />
                      <span className="text-xs font-medium text-zinc-300">Open Editor</span>
                    </div>
                    <p className="text-[11px] text-zinc-600">Configure and run this scenario</p>
                  </div>
                </Link>
                <div className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={13} className="text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-300">Created</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {formatDate(selectedScenario.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
