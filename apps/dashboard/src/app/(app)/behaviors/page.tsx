'use client';

import { useState } from 'react';
import { Plus, GitBranch, Hash, Clock, Search, Loader2, ChevronRight } from 'lucide-react';
import { useBehaviors } from '@/hooks/use-api';
import { BehaviorModel } from '@/types';
import { cn, formatDate } from '@/lib/utils';

export default function BehaviorsPage() {
  const { data: behaviors, isLoading } = useBehaviors();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const list = (behaviors as BehaviorModel[]) ?? [];
  const filtered = list.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));
  const selectedBehavior = list.find((b) => b.id === selected);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0f0f0f]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/60 bg-[#1a1a1a] flex-shrink-0">
        <span className="text-sm font-medium text-zinc-300">Behaviors</span>
        <div className="relative flex-1 max-w-sm">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            placeholder="Search behaviors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <div className="ml-auto">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors">
            <Plus size={11} />
            New Behavior
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left list */}
        <div className="w-72 border-r border-zinc-800/60 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-3 py-2 border-b border-zinc-800/40">
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              {filtered.length} model{filtered.length !== 1 ? 's' : ''}
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
                <GitBranch size={20} className="text-zinc-700 mb-3" />
                <p className="text-xs text-zinc-600">No behavior models yet</p>
              </div>
            )}
            {filtered.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelected(model.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 border-b border-zinc-800/40 transition-colors text-left',
                  selected === model.id
                    ? 'bg-zinc-800/60 border-l-2 border-l-blue-500'
                    : 'hover:bg-zinc-800/30',
                )}
              >
                <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <GitBranch size={12} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-300 truncate">{model.name}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    v{model.version} · {model.entryNodeId}
                  </p>
                </div>
                <ChevronRight size={11} className="text-zinc-700 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Right detail */}
        <div className="flex-1 overflow-y-auto">
          {!selectedBehavior ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">
                  <GitBranch size={24} className="text-zinc-600" />
                </div>
                <p className="text-sm font-medium text-zinc-400 mb-1">Select a behavior</p>
                <p className="text-xs text-zinc-600">Choose a model to view its state machine</p>
              </div>
            </div>
          ) : (
            <div className="p-6 max-w-2xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedBehavior.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">
                      v{selectedBehavior.version}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                      <Hash size={9} />
                      {selectedBehavior.compiledHash.slice(0, 16)}
                    </span>
                  </div>
                </div>
              </div>

              {/* JSON view */}
              <div className="rounded-lg border border-zinc-800 bg-[#111] p-4 font-mono text-xs space-y-1.5 mb-6">
                <div className="text-zinc-600">{'{'}</div>
                <div className="pl-4 space-y-1">
                  <div>
                    <span className="text-blue-400">&quot;id&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-green-400">&quot;{selectedBehavior.id}&quot;</span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;name&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-green-400">&quot;{selectedBehavior.name}&quot;</span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;version&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-orange-400">{selectedBehavior.version}</span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;entryNodeId&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-green-400">
                      &quot;{selectedBehavior.entryNodeId}&quot;
                    </span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;compiledHash&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-green-400">
                      &quot;{selectedBehavior.compiledHash}&quot;
                    </span>
                    <span className="text-zinc-600">,</span>
                  </div>
                  <div>
                    <span className="text-blue-400">&quot;createdAt&quot;</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-green-400">
                      &quot;{formatDate(selectedBehavior.createdAt)}&quot;
                    </span>
                  </div>
                </div>
                <div className="text-zinc-600">{'}'}</div>
              </div>

              {/* Entry node */}
              <div className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-4">
                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-3">
                  State Machine Entry
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-300">
                      {selectedBehavior.entryNodeId}
                    </p>
                    <p className="text-[10px] text-zinc-600">Entry node</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
