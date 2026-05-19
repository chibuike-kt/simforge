'use client';

import { Plus, GitBranch, ArrowRight, Clock, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { BehaviorModel } from '@/types';

const MOCK_BEHAVIORS: BehaviorModel[] = [
  {
    id: '813a1a6b-8076-474f-a93a-9c9c78114260',
    version: 1,
    name: 'Simple GET user',
    entryNodeId: 'fetch_user',
    compiledHash: 'a3f9b2c1d4e5f6a7',
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
  },
];

export default function BehaviorsPage() {
  return (
    <div className="space-y-5 animate-slide-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Behavior Models</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {MOCK_BEHAVIORS.length} model{MOCK_BEHAVIORS.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1.5">
          <Plus size={12} />
          New Model
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {MOCK_BEHAVIORS.map((model) => (
          <div
            key={model.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <GitBranch size={15} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{model.name}</h3>
                    <span className="text-[10px] text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">
                      v{model.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Hash size={10} className="text-zinc-600" />
                      <span className="text-xs font-mono text-zinc-600">
                        {model.compiledHash.slice(0, 12)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GitBranch size={10} className="text-zinc-600" />
                      <span className="text-xs text-zinc-600">Entry: {model.entryNodeId}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={10} className="text-zinc-600" />
                      <span className="text-xs text-zinc-600">{formatDate(model.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 gap-1 flex-shrink-0"
              >
                View
                <ArrowRight size={11} />
              </Button>
            </div>
          </div>
        ))}

        {MOCK_BEHAVIORS.length === 0 && (
          <div className="rounded-xl border border-zinc-800 border-dashed bg-zinc-900/50 py-16 text-center">
            <GitBranch size={24} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-600">No behavior models yet</p>
            <p className="text-xs text-zinc-700 mt-1 mb-4">Define how your virtual users behave</p>
            <Button
              size="sm"
              className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
            >
              <Plus size={12} />
              New Model
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
