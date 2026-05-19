export enum SimulationMode {
  SANDBOX = 'sandbox',
  SHADOW = 'shadow',
  PRODUCTION = 'production',
}

export enum RunStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DISPATCHED = 'dispatched',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ScenarioStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum TrafficPattern {
  STEADY = 'steady',
  RAMP = 'ramp',
  BURST = 'burst',
  VIRAL = 'viral',
  STEP = 'step',
}

export enum AgentStatus {
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
  steps?: Array<{ agents: number; durationMs: number }>;
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

// ─── Regional Traffic Profiles ───────────────────────────────────────────────

export type RegionCode =
  | 'NA_WEST'    // North America West (US-CA, US-WA, US-OR)
  | 'NA_EAST'    // North America East (US-NY, US-VA, CA)
  | 'EU_WEST'    // Western Europe (GB, FR, DE, NL)
  | 'EU_EAST'    // Eastern Europe (PL, UA, RO, CZ)
  | 'ASIA_EAST'  // East Asia (JP, KR, TW)
  | 'ASIA_SE'    // Southeast Asia (SG, TH, VN, ID, MY)
  | 'ASIA_SOUTH' // South Asia (IN, PK, BD, LK)
  | 'ASIA_CENTRAL' // Central Asia + Middle East (SA, AE, TR, KZ)
  | 'AFRICA'     // Africa (NG, ZA, KE, EG, GH)
  | 'LATAM'      // Latin America (BR, MX, CO, AR, PE)
  | 'OCEANIA';   // Oceania (AU, NZ)

export interface LatencyProfile {
  p50: number;   // ms
  p95: number;   // ms
  p99: number;   // ms
  jitter: number; // ms — random variance added per request
}

export interface ConnectionProfile {
  timeoutRate: number;    // 0-1 — probability of timeout
  retryRate: number;      // 0-1 — probability of retry on failure
  packetLossRate: number; // 0-1 — probability of packet loss
  keepAlive: boolean;     // whether to use keep-alive connections
  http2: boolean;         // whether to use HTTP/2
}

export interface DeviceProfile {
  mobilePct: number;   // 0-1 — percentage of mobile traffic
  desktopPct: number;  // 0-1 — percentage of desktop traffic
  botPct: number;      // 0-1 — percentage of bot/crawler traffic
}

export interface RegionTrafficProfile {
  code: RegionCode;
  label: string;
  countries: string[];          // ISO country codes
  rpsWeight: number;            // 0-1 — relative traffic contribution
  latency: LatencyProfile;
  connection: ConnectionProfile;
  device: DeviceProfile;
  userAgents: string[];         // pool of realistic user agents for this region
  headers: Record<string, string>; // region-specific headers (Accept-Language etc)
}

// ─── Scenario Source Regions ─────────────────────────────────────────────────

export interface ScenarioRegion {
  regionCode: RegionCode;
  agentPct: number;   // 0-1 — what % of total agents come from this region
  enabled: boolean;
}

export interface TrafficPattern {
  type: 'steady' | 'ramp' | 'burst' | 'viral' | 'step';
  steadyAgents?: number;
  startAgents?: number;
  endAgents?: number;
  durationMs?: number;
  burstAgents?: number;
  stepCount?: number;
  stepAgents?: number;
}
