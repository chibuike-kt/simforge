export declare enum SimulationMode {
  SANDBOX = 'sandbox',
  SHADOW = 'shadow',
  PRODUCTION = 'production',
}
export declare enum RunStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DISPATCHED = 'dispatched',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
export declare enum ScenarioStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}
export declare enum TrafficPattern {
  STEADY = 'steady',
  RAMP = 'ramp',
  BURST = 'burst',
  VIRAL = 'viral',
  STEP = 'step',
}
export declare enum AgentStatus {
  SPAWNED = 'spawned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  LOOP_DETECTED = 'loop_detected',
}
export interface TransitionGuard {
  type: 'response_status' | 'retry_count' | 'history_contains';
  value: string | number;
}
export interface Transition {
  targetNodeId: string;
  weight: number;
  guard: TransitionGuard | null;
}
export interface ThinkTime {
  meanMs: number;
  stdDevMs: number;
}
export interface HttpAction {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  pathTemplate: string;
  headers: Record<string, string>;
  bodyTemplate: string | null;
}
export interface WaitAction {
  durationMs: number;
  jitterMs: number;
}
export interface BehaviorNode {
  id: string;
  type: 'http' | 'websocket' | 'wait' | 'branch' | 'abort';
  label: string;
  action: HttpAction | WaitAction | null;
  transitions: Transition[];
  cooldownMs: number;
  thinkTimeMs: ThinkTime;
  maxRetries: number;
}
export interface BehaviorModel {
  id: string;
  version: number;
  name: string;
  entryNodeId: string;
  nodes: Record<string, BehaviorNode>;
  compiledHash: string;
}
export interface TrafficPatternConfig {
  type: TrafficPattern;
  startAgents?: number;
  endAgents?: number;
  durationMs?: number;
  burstAgents?: number;
  burstDurationMs?: number;
  growthFactor?: number;
  steadyAgents?: number;
  steps?: Array<{
    agents: number;
    durationMs: number;
  }>;
}
export interface TargetSystemProfile {
  id: string;
  name: string;
  allowedOrigins: string[];
  maxRps: number;
  maxConcurrency: number;
  mode: SimulationMode;
  approvalThreshold: number;
  rateLimitFeedbackEnabled: boolean;
  verifiedAt: string | null;
}
export interface AgentState {
  agentId: string;
  runId: string;
  shardId: string;
  currentNodeId: string;
  sessionToken: string;
  historyRing: string[];
  cooldownUntil: number;
  retryCount: number;
  entropySeed: number;
  customKv: Record<string, string>;
  status: AgentStatus;
  spawnedAt: string;
  lastActiveAt: string;
}
export interface SimulationJobEnvelope {
  runId: string;
  shardId: string;
  agentCount: number;
  agentIdRange: [string, string];
  behaviorModel: BehaviorModel;
  targetConfig: {
    baseUrl: string;
    allowedOrigins: string[];
    maxRps: number;
    mode: SimulationMode;
  };
  timingConfig: {
    startOffsetMs: number;
    rampCurve: TrafficPatternConfig;
  };
  signedAt: string;
  signature: string;
}
//# sourceMappingURL=simulation.types.d.ts.map
