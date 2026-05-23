import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Targets ─────────────────────────────────────────────────────────────────

export function useTargets() {
  return useQuery({
    queryKey: ['targets'],
    queryFn: () => api.getTargets(),
  });
}

export function useCreateTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.createTarget(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['targets'] }),
  });
}

// ─── Behaviors ───────────────────────────────────────────────────────────────

export function useBehaviors() {
  return useQuery({
    queryKey: ['behaviors'],
    queryFn: () => api.getBehaviors(),
  });
}

export function useCreateBehavior() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.createBehavior(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['behaviors'] }),
  });
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

export function useScenarios() {
  return useQuery({
    queryKey: ['scenarios'],
    queryFn: () => api.getScenarios(),
  });
}

export function useScenario(id: string) {
  return useQuery({
    queryKey: ['scenarios', id],
    queryFn: () => api.getScenario(id),
    enabled: !!id,
  });
}

export function useCreateScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.createScenario(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scenarios'] }),
  });
}

export function usePublishScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.publishScenario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scenarios'] }),
  });
}

export function useSubmitRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      agentCount,
      flowSteps,
      entryNodeId,
      baseUrl,
    }: {
      id: string;
      agentCount?: number;
      flowSteps?: Record<string, unknown>;
      entryNodeId?: string;
      baseUrl?: string;
    }) => api.submitRun(id, agentCount, flowSteps, entryNodeId, baseUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}

export function useScenarioRuns(scenarioId: string) {
  return useQuery({
    queryKey: ['runs', scenarioId],
    queryFn: () => api.getRuns(scenarioId),
    enabled: !!scenarioId,
    refetchInterval: 5000,
  });
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export function usePendingRuns() {
  return useQuery({
    queryKey: ['pending-runs'],
    queryFn: () => api.getPendingRuns(),
    refetchInterval: 10_000,
  });
}

export function useApproveRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => api.approveRun(runId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-runs'] });
      qc.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}

export function useRejectRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, reason }: { runId: string; reason: string }) =>
      api.rejectRun(runId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-runs'] });
      qc.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}
