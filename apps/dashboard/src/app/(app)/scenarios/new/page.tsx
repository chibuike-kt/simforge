'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Loader2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTargets, useBehaviors, useCreateScenario } from '@/hooks/use-api';
import { TargetSystem, BehaviorModel, TrafficPattern } from '@/types';
import { cn } from '@/lib/utils';
import { Minus, TrendingUp, Zap, BarChart2, AlignJustify } from 'lucide-react';

const STEPS = ['Details', 'Target', 'Behavior', 'Traffic', 'Review'];

const TRAFFIC_PATTERNS: {
  type: TrafficPattern;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  { type: 'steady', label: 'Steady', desc: 'Constant load over time', icon: <Minus size={16} /> },
  {
    type: 'ramp',
    label: 'Ramp',
    desc: 'Gradually increase agents',
    icon: <TrendingUp size={16} />,
  },
  { type: 'burst', label: 'Burst', desc: 'Sudden spike of traffic', icon: <Zap size={16} /> },
  {
    type: 'viral',
    label: 'Viral',
    desc: 'Exponential growth curve',
    icon: <BarChart2 size={16} />,
  },
  { type: 'step', label: 'Step', desc: 'Incremental load steps', icon: <AlignJustify size={16} /> },
];

export default function NewScenarioPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    description: '',
    targetSystemId: '',
    behaviorModelId: '',
    trafficPattern: {
      type: 'steady' as TrafficPattern,
      steadyAgents: 100,
      startAgents: 100,
      endAgents: 1000,
      durationMs: 300_000,
      burstAgents: 500,
    },
  });

  const { data: targets } = useTargets();
  const { data: behaviors } = useBehaviors();
  const createScenario = useCreateScenario();

  function update(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateTraffic(key: string, value: unknown) {
    setForm((prev) => ({
      ...prev,
      trafficPattern: { ...prev.trafficPattern, [key]: value },
    }));
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return form.name.length > 0;
      case 1:
        return form.targetSystemId.length > 0;
      case 2:
        return form.behaviorModelId.length > 0;
      case 3:
        return true;
      default:
        return true;
    }
  }

  async function handleSubmit() {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      targetSystemId: form.targetSystemId,
      behaviorModelId: form.behaviorModelId,
      trafficPattern: buildTrafficPattern(),
    };

    await createScenario.mutateAsync(payload);
    router.push('/scenarios');
  }

  function buildTrafficPattern() {
    const { type } = form.trafficPattern;
    switch (type) {
      case 'steady':
        return { type, steadyAgents: form.trafficPattern.steadyAgents };
      case 'ramp':
        return {
          type,
          startAgents: form.trafficPattern.startAgents,
          endAgents: form.trafficPattern.endAgents,
          durationMs: form.trafficPattern.durationMs,
        };
      case 'burst':
        return { type, burstAgents: form.trafficPattern.burstAgents };
      default:
        return { type, steadyAgents: form.trafficPattern.steadyAgents };
    }
  }

  const selectedTarget = (targets as TargetSystem[])?.find((t) => t.id === form.targetSystemId);
  const selectedBehavior = (behaviors as BehaviorModel[])?.find(
    (b) => b.id === form.behaviorModelId,
  );

  return (
    <div className="max-w-2xl animate-slide-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
          onClick={() => router.push('/scenarios')}
        >
          <ArrowLeft size={14} />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-white">New Scenario</h2>
          <p className="text-sm text-zinc-500">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all',
                i < step
                  ? 'bg-blue-500 text-white'
                  : i === step
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'bg-zinc-800 text-zinc-600 border border-zinc-700',
              )}
            >
              {i < step ? <Check size={10} /> : i + 1}
            </div>
            <span
              className={cn(
                'text-xs font-medium hidden sm:block',
                i === step ? 'text-zinc-300' : 'text-zinc-600',
              )}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn('h-px w-6 transition-all', i < step ? 'bg-blue-500' : 'bg-zinc-800')}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 mb-4">
        {/* Step 0 — Details */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Scenario details</h3>
              <p className="text-xs text-zinc-500">Give your scenario a descriptive name</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">Name</Label>
              <Input
                placeholder="e.g. Checkout flow ramp test"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="h-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                Description <span className="text-zinc-700 normal-case">(optional)</span>
              </Label>
              <Input
                placeholder="What are you testing?"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                className="h-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Step 1 — Target */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Select target system</h3>
              <p className="text-xs text-zinc-500">
                Choose which system to simulate traffic against
              </p>
            </div>
            <div className="space-y-2">
              {((targets as TargetSystem[]) ?? []).map((target) => (
                <button
                  key={target.id}
                  onClick={() => update('targetSystemId', target.id)}
                  className={cn(
                    'w-full text-left rounded-lg border p-3 transition-all',
                    form.targetSystemId === target.id
                      ? 'border-blue-500/50 bg-blue-500/5'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-300">{target.name}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {target.allowedOrigins[0]} · {target.mode} · max {target.maxRps} RPS
                      </p>
                    </div>
                    {form.targetSystemId === target.id && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {((targets as TargetSystem[]) ?? []).length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-zinc-600">No targets available</p>
                  <p className="text-xs text-zinc-700 mt-1">Add a target system first</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Behavior */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Select behavior model</h3>
              <p className="text-xs text-zinc-500">Choose how virtual users will behave</p>
            </div>
            <div className="space-y-2">
              {((behaviors as BehaviorModel[]) ?? []).map((model) => (
                <button
                  key={model.id}
                  onClick={() => update('behaviorModelId', model.id)}
                  className={cn(
                    'w-full text-left rounded-lg border p-3 transition-all',
                    form.behaviorModelId === model.id
                      ? 'border-blue-500/50 bg-blue-500/5'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-300">{model.name}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        v{model.version} · Entry: {model.entryNodeId}
                      </p>
                    </div>
                    {form.behaviorModelId === model.id && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {((behaviors as BehaviorModel[]) ?? []).length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-zinc-600">No behavior models available</p>
                  <p className="text-xs text-zinc-700 mt-1">Create a behavior model first</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Traffic */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Traffic pattern</h3>
              <p className="text-xs text-zinc-500">Define how load is applied over time</p>
            </div>

            {/* Pattern selector */}
            <div className="grid grid-cols-5 gap-2">
              {TRAFFIC_PATTERNS.map((p) => (
                <button
                  key={p.type}
                  onClick={() => updateTraffic('type', p.type)}
                  className={cn(
                    'rounded-lg border p-2.5 text-center transition-all',
                    form.trafficPattern.type === p.type
                      ? 'border-blue-500/50 bg-blue-500/5'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600',
                  )}
                >
                  <div className="flex justify-center mb-1.5 text-zinc-400">{p.icon}</div>
                  <p className="text-[11px] font-medium text-zinc-300">{p.label}</p>
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-500">
              {TRAFFIC_PATTERNS.find((p) => p.type === form.trafficPattern.type)?.desc}
            </p>

            {/* Pattern config */}
            <div className="space-y-3 pt-2">
              {form.trafficPattern.type === 'steady' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                    Concurrent Agents
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.trafficPattern.steadyAgents}
                    onChange={(e) => updateTraffic('steadyAgents', parseInt(e.target.value))}
                    className="h-9 bg-zinc-800/50 border-zinc-700 text-white focus:border-blue-500"
                  />
                </div>
              )}

              {form.trafficPattern.type === 'ramp' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                      Start Agents
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.trafficPattern.startAgents}
                      onChange={(e) => updateTraffic('startAgents', parseInt(e.target.value))}
                      className="h-9 bg-zinc-800/50 border-zinc-700 text-white focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                      End Agents
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.trafficPattern.endAgents}
                      onChange={(e) => updateTraffic('endAgents', parseInt(e.target.value))}
                      className="h-9 bg-zinc-800/50 border-zinc-700 text-white focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                      Duration (s)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.trafficPattern.durationMs / 1000}
                      onChange={(e) => updateTraffic('durationMs', parseInt(e.target.value) * 1000)}
                      className="h-9 bg-zinc-800/50 border-zinc-700 text-white focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {form.trafficPattern.type === 'burst' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                    Burst Agents
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.trafficPattern.burstAgents}
                    onChange={(e) => updateTraffic('burstAgents', parseInt(e.target.value))}
                    className="h-9 bg-zinc-800/50 border-zinc-700 text-white focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Review scenario</h3>
              <p className="text-xs text-zinc-500">
                Confirm everything looks right before creating
              </p>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Name', value: form.name },
                {
                  label: 'Description',
                  value: form.description || '—',
                },
                {
                  label: 'Target',
                  value: selectedTarget?.name ?? '—',
                },
                {
                  label: 'Behavior Model',
                  value: selectedBehavior?.name ?? '—',
                },
                {
                  label: 'Traffic Pattern',
                  value:
                    form.trafficPattern.type.charAt(0).toUpperCase() +
                    form.trafficPattern.type.slice(1),
                },
                {
                  label: 'Agents',
                  value:
                    form.trafficPattern.type === 'steady'
                      ? `${form.trafficPattern.steadyAgents} concurrent`
                      : form.trafficPattern.type === 'ramp'
                        ? `${form.trafficPattern.startAgents} → ${form.trafficPattern.endAgents}`
                        : `${form.trafficPattern.burstAgents} burst`,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                >
                  <span className="text-xs text-zinc-500">{label}</span>
                  <span className="text-xs font-medium text-zinc-300">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
          onClick={() => (step === 0 ? router.push('/scenarios') : setStep(step - 1))}
        >
          <ArrowLeft size={12} className="mr-1.5" />
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            size="sm"
            className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
          >
            Next
            <ArrowRight size={12} />
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
            onClick={handleSubmit}
            disabled={createScenario.isPending}
          >
            {createScenario.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Check size={12} />
            )}
            {createScenario.isPending ? 'Creating...' : 'Create Scenario'}
          </Button>
        )}
      </div>
    </div>
  );
}
