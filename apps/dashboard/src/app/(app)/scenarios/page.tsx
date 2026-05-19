'use client';

import Link from 'next/link';
import { Plus, Activity, ArrowRight, Clock, Play, Archive, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Scenario, ScenarioStatus } from '@/types';
import { cn } from '@/lib/utils';

const MOCK_SCENARIOS: (Scenario & { targetName: string; runCount: number })[] = [
  {
    id: '51d95b38-dc5a-461d-bbf8-0cf8025d7e26',
    version: 1,
    name: 'Basic ramp test',
    description: 'Simple GET request ramp from 1 to 5 agents',
    targetSystemId: '56c8afaa-9aea-4704-87e7-11669711cba2',
    behaviorModelId: '813a1a6b-8076-474f-a93a-9c9c78114260',
    targetName: 'Test API',
    trafficPattern: { type: 'steady', steadyAgents: 5 },
    status: 'published',
    runCount: 2,
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
  },
];

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
  return (
    <div className="space-y-5 animate-slide-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Scenarios</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {MOCK_SCENARIOS.length} scenario{MOCK_SCENARIOS.length !== 1 ? 's' : ''}
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

      <div className="grid grid-cols-1 gap-3">
        {MOCK_SCENARIOS.map((scenario) => (
          <Link
            key={scenario.id}
            href={`/scenarios/${scenario.id}`}
            className="group rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity size={15} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {scenario.name}
                    </h3>
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
                      <span className="text-xs text-zinc-600">{scenario.targetName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Play size={11} className="text-zinc-600" />
                      <span className="text-xs text-zinc-600">
                        {scenario.runCount} run{scenario.runCount !== 1 ? 's' : ''}
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
                <div className="text-right">
                  <p className="text-xs font-medium text-zinc-400 capitalize">
                    {scenario.trafficPattern.type}
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    {scenario.trafficPattern.steadyAgents ?? scenario.trafficPattern.endAgents ?? 0}{' '}
                    agents
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-zinc-700 group-hover:text-zinc-500 transition-colors"
                />
              </div>
            </div>
          </Link>
        ))}

        {MOCK_SCENARIOS.length === 0 && (
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
    </div>
  );
}
