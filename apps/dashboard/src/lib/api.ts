const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        toCamel(v),
      ]),
    );
  }
  return obj;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sf_token') : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  return toCamel(data);
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; user: { id: string; email: string; name: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    ),
  register: (name: string, email: string, password: string) =>
    apiFetch<{ accessToken: string; user: { id: string; email: string; name: string } }>(
      '/api/auth/register',
      { method: 'POST', body: JSON.stringify({ name, email, password }) },
    ),

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
  approveRun: (runId: string) =>
    apiFetch(`/api/approvals/${runId}/approve`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  // Metrics
  getRunMetrics: (runId: string) => apiFetch<unknown>(`/api/metrics/runs/${runId}`),
  getScenarioRunMetrics: (scenarioId: string) =>
    apiFetch<unknown[]>(`/api/metrics/scenarios/${scenarioId}/runs`),
};
