const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Targets
  getTargets: () => apiFetch<unknown[]>('/api/targets'),
  createTarget: (data: unknown) =>
    apiFetch('/api/targets', { method: 'POST', body: JSON.stringify(data) }),

  // Behaviors
  getBehaviors: () => apiFetch<unknown[]>('/api/behaviors'),
  createBehavior: (data: unknown) =>
    apiFetch('/api/behaviors', { method: 'POST', body: JSON.stringify(data) }),

  // Scenarios
  getScenarios: () => apiFetch<unknown[]>('/api/scenarios'),
  getScenario: (id: string) => apiFetch<unknown>(`/api/scenarios/${id}`),
  createScenario: (data: unknown) =>
    apiFetch('/api/scenarios', { method: 'POST', body: JSON.stringify(data) }),
  publishScenario: (id: string) => apiFetch(`/api/scenarios/${id}/publish`, { method: 'PATCH' }),
  submitRun: (id: string) => apiFetch(`/api/scenarios/${id}/runs`, { method: 'POST' }),
  getRuns: (scenarioId: string) => apiFetch<unknown[]>(`/api/scenarios/${scenarioId}/runs`),

  // Approvals
  getPendingRuns: () => apiFetch<unknown[]>('/api/approvals/pending'),
  approveRun: (runId: string) => apiFetch(`/api/approvals/${runId}/approve`, { method: 'POST' }),
  rejectRun: (runId: string, reason: string) =>
    apiFetch(`/api/approvals/${runId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};
