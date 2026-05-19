export type RunStatus =
  | 'pending'
  | 'approved'
  | 'dispatched'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type SimulationMode = 'sandbox' | 'shadow' | 'production';
export type TrafficPattern = 'steady' | 'ramp' | 'burst' | 'viral' | 'step';
export type ScenarioStatus = 'draft' | 'published' | 'archived';

export interface TargetSystem {
  id: string;
  name: string;
  allowedOrigins: string[];
  maxRps: number;
  maxConcurrency: number;
  mode: SimulationMode;
  approvalThreshold: number;
  verifiedAt: string | null;
  createdAt: string;
}

export interface BehaviorModel {
  id: string;
  version: number;
  name: string;
  entryNodeId: string;
  compiledHash: string;
  createdAt: string;
}

export interface Scenario {
  id: string;
  version: number;
  name: string;
  description: string | null;
  targetSystemId: string;
  behaviorModelId: string;
  trafficPattern: TrafficPatternConfig;
  status: ScenarioStatus;
  createdAt: string;
}

export interface TrafficPatternConfig {
  type: TrafficPattern;
  startAgents?: number;
  endAgents?: number;
  durationMs?: number;
  steadyAgents?: number;
  burstAgents?: number;
  steps?: Array<{ agents: number; durationMs: number }>;
}

export interface SimulationRun {
  id: string;
  scenarioId: string;
  scenarioVersion: number;
  status: RunStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface LiveMetrics {
  runId: string;
  activeAgents: number;
  currentRps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  queueDepth: number;
  totalRequests: number;
  totalFailures: number;
  activeWorkers: number;
}

export interface MetricPoint {
  time: string;
  rps: number;
  p50: number;
  p95: number;
  p99: number;
  agents: number;
  errors: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}
