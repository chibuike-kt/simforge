'use client';

import Link from 'next/link';
import { Plus, Activity, ArrowRight, Clock, Play, Archive, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Scenario, ScenarioStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useScenarios, usePublishScenario, useSubmitRun } from '@/hooks/use-api';

function StatusBadge({ status }: { status: ScenarioStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
        status === 'published'
          ? 'bg-green-400/10 text-green-400 border-green-400/20'
          : status === 'draft'
            ? 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20'
            : 'bg-zinc-700/10 text-zinc-600 border-zinc-700/20',
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ScenariosPage() {
  const { data: scenarios, isLoading, error } = useScenarios();
  const publishScenario = usePublishScenario();
  const submitRun = useSubmitRun();

  return (
    <div className="space-y-5 animate-slide-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Scenarios</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {isLoading ? 'Loading...' : `${(scenarios as Scenario[])?.length ?? 0} scenarios`}
          </p>
        </div>
        <Link href="/scenarios/new">
          <Button
            size="sm"
            className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
          >
            <Plus size={12} />
            New Scenario
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="text-zinc-600 animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">
            Failed to load scenarios — is the control plane running?
          </p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-3">
          {((scenarios as Scenario[]) ?? []).map((scenario) => (
            <div
              key={scenario.id}
              className="group rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity size={15} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">{scenario.name}</h3>
                      <StatusBadge status={scenario.status} />
                      <span className="text-[10px] text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">
                        v{scenario.version}
                      </span>
                    </div>
                    {scenario.description && (
                      <p className="text-xs text-zinc-500 mt-1 truncate">{scenario.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <FileText size={11} className="text-zinc-600" />
                        <span className="text-xs text-zinc-600 font-mono">
                          {scenario.targetSystemId.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-zinc-600" />
                        <span className="text-xs text-zinc-600">
                          {formatDate(scenario.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {scenario.status === 'draft' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-zinc-700 text-zinc-400 hover:text-white gap-1"
                      onClick={async () => {
                        try {
                          await publishScenario.mutateAsync(scenario.id);
                          toast.success('Scenario published');
                        } catch (err) {
                          toast.error('Failed to publish', {
                            description: err instanceof Error ? err.message : 'Unknown error',
                          });
                        }
                      }}
                      disabled={publishScenario.isPending}
                    >
                      {publishScenario.isPending ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : null}
                      Publish
                    </Button>
                  )}
                  {scenario.status === 'published' && (
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1"
                      onClick={async () => {
                        try {
                          await submitRun.mutateAsync(scenario.id);
                          toast.success('Run submitted', {
                            description: 'Your simulation is being dispatched to workers',
                          });
                        } catch (err) {
                          toast.error('Failed to submit run', {
                            description: err instanceof Error ? err.message : 'Unknown error',
                          });
                        }
                      }}
                      disabled={submitRun.isPending}
                    >
                      {submitRun.isPending ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Play size={10} />
                      )}
                      Run
                    </Button>
                  )}
                  <ArrowRight
                    size={14}
                    className="text-zinc-700 group-hover:text-zinc-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}

          {((scenarios as Scenario[]) ?? []).length === 0 && (
            <div className="rounded-xl border border-zinc-800 border-dashed bg-zinc-900/50 py-16 text-center">
              <Archive size={24} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600">No scenarios yet</p>
              <p className="text-xs text-zinc-700 mt-1 mb-4">
                Create your first scenario to start simulating
              </p>
              <Link href="/scenarios/new">
                <Button
                  size="sm"
                  className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
                >
                  <Plus size={12} />
                  Create Scenario
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
