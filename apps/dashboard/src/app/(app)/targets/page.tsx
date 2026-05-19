'use client';

import { useState } from 'react';
import { Plus, Target, ArrowRight, Clock, ShieldCheck, ShieldAlert, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { TargetSystem, SimulationMode } from '@/types';
import { cn } from '@/lib/utils';

const MOCK_TARGETS: TargetSystem[] = [
  {
    id: '56c8afaa-9aea-4704-87e7-11669711cba2',
    name: 'Test API',
    allowedOrigins: ['https://jsonplaceholder.typicode.com'],
    maxRps: 10,
    maxConcurrency: 100,
    mode: 'sandbox',
    approvalThreshold: 100000,
    verifiedAt: null,
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
  },
];

function ModeTag({ mode }: { mode: SimulationMode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
        mode === 'sandbox'
          ? 'bg-blue-400/10 text-blue-400 border-blue-400/20'
          : mode === 'shadow'
            ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
            : 'bg-red-400/10 text-red-400 border-red-400/20',
      )}
    >
      {mode.charAt(0).toUpperCase() + mode.slice(1)}
    </span>
  );
}

export default function TargetsPage() {
  return (
    <div className="space-y-5 animate-slide-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Target Systems</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {MOCK_TARGETS.length} registered target{MOCK_TARGETS.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1.5">
          <Plus size={12} />
          Add Target
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {MOCK_TARGETS.map((target) => (
          <div
            key={target.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <Target size={15} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{target.name}</h3>
                    <ModeTag mode={target.mode} />
                    {target.verifiedAt ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-green-400">
                        <ShieldCheck size={10} />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                        <ShieldAlert size={10} />
                        Unverified
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {target.allowedOrigins.map((origin) => (
                      <span
                        key={origin}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-400"
                      >
                        <Globe size={9} className="text-zinc-600" />
                        {origin}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-zinc-600">Max {target.maxRps} RPS</span>
                    <span className="text-xs text-zinc-600">
                      Max {target.maxConcurrency.toLocaleString()} concurrent
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-zinc-600" />
                      <span className="text-xs text-zinc-600">{formatDate(target.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 gap-1 flex-shrink-0"
              >
                Manage
                <ArrowRight size={11} />
              </Button>
            </div>
          </div>
        ))}

        {MOCK_TARGETS.length === 0 && (
          <div className="rounded-xl border border-zinc-800 border-dashed bg-zinc-900/50 py-16 text-center">
            <Target size={24} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-600">No target systems yet</p>
            <p className="text-xs text-zinc-700 mt-1 mb-4">
              Add your first target to start building scenarios
            </p>
            <Button
              size="sm"
              className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
            >
              <Plus size={12} />
              Add Target
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
