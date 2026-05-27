export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export const NAV: NavItem[] = [
  {
    label: 'Getting Started',
    href: '#introduction',
    children: [
      { label: 'Introduction', href: '#introduction' },
      { label: 'Quick Start', href: '#quickstart' },
      { label: 'Architecture', href: '#architecture' },
    ],
  },
  {
    label: 'Core Concepts',
    href: '#targets',
    children: [
      { label: 'Targets', href: '#targets' },
      { label: 'Scenarios', href: '#scenarios' },
      { label: 'Flow Editor', href: '#flow-editor' },
      { label: 'Headers & Auth', href: '#headers-auth' },
      { label: 'Extract Rules', href: '#extract-rules' },
      { label: 'Collections', href: '#collections' },
      { label: 'Runs & Scale', href: '#runs' },
    ],
  },
  {
    label: 'Faker Templates',
    href: '#faker-templates',
    children: [
      { label: 'Person & Internet', href: '#faker-person' },
      { label: 'Phone Numbers', href: '#faker-phone' },
      { label: 'Finance & Numbers', href: '#faker-finance' },
      { label: 'Flow Variables', href: '#faker-flow' },
    ],
  },
  {
    label: 'Simulation Engine',
    href: '#agents',
    children: [
      { label: 'Virtual Agents', href: '#agents' },
      { label: 'Global Regions', href: '#regions' },
      { label: 'Rate Limiting', href: '#rate-limiting' },
      { label: 'Data Extraction', href: '#extraction' },
      { label: 'Multi-Step Flows', href: '#multi-step' },
    ],
  },
  {
    label: 'Observability',
    href: '#realtime',
    children: [
      { label: 'Real-Time Events', href: '#realtime' },
      { label: 'Event Types', href: '#event-types' },
      { label: 'Metrics', href: '#metrics' },
      { label: 'Reports', href: '#reports' },
    ],
  },
  {
    label: 'Reference',
    href: '#api-reference',
    children: [
      { label: 'API Reference', href: '#api-reference' },
      { label: 'Troubleshooting', href: '#troubleshooting' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
];

export const FAKER_GROUPS = [
  {
    id: 'faker-person',
    group: 'Person & Internet',
    items: [
      { label: 'Full Name', value: '{{faker.person.fullName}}' },
      { label: 'Email', value: '{{faker.internet.email}}' },
      { label: 'Username', value: '{{faker.internet.username}}' },
      { label: 'Username (Safe)', value: '{{faker.internet.username.safe}}' },
      { label: 'Password', value: '{{faker.internet.password}}' },
      { label: 'Job Title', value: '{{faker.person.jobTitle}}' },
    ],
  },
  {
    id: 'faker-phone',
    group: 'Nigerian Phone Numbers',
    items: [
      { label: 'Any network', value: '{{faker.phone.nigeria}}' },
      { label: 'MTN only', value: '{{faker.phone.nigeria.mtn}}' },
      { label: 'Airtel only', value: '{{faker.phone.nigeria.airtel}}' },
      { label: 'Glo only', value: '{{faker.phone.nigeria.glo}}' },
      { label: '9mobile only', value: '{{faker.phone.nigeria.9mobile}}' },
    ],
  },
  {
    id: 'faker-finance',
    group: 'Finance & Numbers',
    items: [
      { label: 'Amount', value: '{{faker.finance.amount}}' },
      { label: 'Currency', value: '{{faker.finance.currency}}' },
      { label: 'PIN (4-digit)', value: '{{faker.finance.pin.4}}' },
      { label: 'PIN (6-digit)', value: '{{faker.finance.pin.6}}' },
      { label: '4 digits', value: '{{faker.number.digits.4}}' },
      { label: '6 digits', value: '{{faker.number.digits.6}}' },
      { label: 'N digits', value: '{{faker.number.digits.N}}' },
      { label: 'UUID', value: '{{faker.string.uuid}}' },
      { label: 'Alphanumeric', value: '{{faker.string.alphanumeric}}' },
    ],
  },
  {
    id: 'faker-flow',
    group: 'Flow & Region Variables',
    items: [
      { label: 'Step 1 field', value: '{{step.1.response.fieldName}}' },
      { label: 'Step 2 field', value: '{{step.2.response.fieldName}}' },
      { label: 'Agent Country', value: '{{region.country}}' },
      { label: 'Agent Locale', value: '{{region.locale}}' },
      { label: 'Agent Region', value: '{{region.code}}' },
    ],
  },
];

export const REGIONS = [
  { code: 'NA_WEST', name: 'N. America West', pct: '18%', p50: '25ms' },
  { code: 'NA_EAST', name: 'N. America East', pct: '15%', p50: '18ms' },
  { code: 'EU_WEST', name: 'Western Europe', pct: '22%', p50: '35ms' },
  { code: 'EU_EAST', name: 'Eastern Europe', pct: '6%', p50: '55ms' },
  { code: 'ASIA_EAST', name: 'East Asia', pct: '8%', p50: '120ms' },
  { code: 'ASIA_SE', name: 'Southeast Asia', pct: '6%', p50: '95ms' },
  { code: 'ASIA_SOUTH', name: 'South Asia', pct: '10%', p50: '110ms' },
  { code: 'ASIA_CENTRAL', name: 'Middle East', pct: '4%', p50: '80ms' },
  { code: 'AFRICA', name: 'Africa', pct: '4%', p50: '140ms' },
  { code: 'LATAM', name: 'Latin America', pct: '5%', p50: '70ms' },
  { code: 'OCEANIA', name: 'Oceania', pct: '2%', p50: '160ms' },
];

export const EVENT_TYPES = [
  {
    event: 'worker.started',
    when: 'Worker process comes online',
    fields: 'workerId, region, concurrency',
  },
  {
    event: 'shard.started',
    when: 'Shard job begins processing',
    fields: 'runId, shardId, agentCount',
  },
  {
    event: 'agent.spawned',
    when: 'An agent is initialized',
    fields: 'agentId, regionCode, countryCode',
  },
  {
    event: 'action.executed',
    when: 'Agent fires an HTTP request',
    fields: 'agentId, nodeId, method',
  },
  {
    event: 'response.received',
    when: 'Agent receives a response',
    fields: 'statusCode, latencyMs, bodyRaw',
  },
  {
    event: 'agent.state_changed',
    when: 'Agent moves to the next step',
    fields: 'fromNodeId, toNodeId',
  },
  { event: 'agent.completed', when: 'Agent finished all steps', fields: 'agentId, steps' },
  { event: 'agent.failed', when: 'Agent crashed or exhausted retries', fields: 'agentId, reason' },
  { event: 'action.dlq_sent', when: 'Step failed after all retries', fields: 'nodeId, error' },
  { event: 'action.retried', when: 'Step is being retried', fields: 'nodeId, retryCount' },
  {
    event: 'shard.completed',
    when: 'All agents in a shard finished',
    fields: 'requests, errors, duration',
  },
  {
    event: 'agent.loop_detected',
    when: 'Agent visited same node 5+ times',
    fields: 'agentId, nodeId',
  },
];

export const TROUBLESHOOTING = [
  {
    q: 'Agents fail immediately with invalid_model_nodes',
    a: 'The behavior model nodes field is coming through as a JSON string. This happens when BullMQ serializes JSONB data from PostgreSQL. The worker normalizeModel() function handles this automatically — restart the worker.',
  },
  {
    q: '{{step.1.response.X}} resolves to empty string',
    a: 'Step 1 returned an error so extraction failed. Check worker logs for [Extract] Failed lines — they show the actual response body. Confirm the extract path matches the real response structure. Use body.data.field not data.field.',
  },
  {
    q: 'All agents rate-limited immediately at scale',
    a: 'Your API rate limiter is more aggressive than the SimForge token bucket. Start at 5-10 users to find the threshold. Increase thinkTimeMs.meanMs, or raise your staging rate limits for load testing.',
  },
  {
    q: 'Run stuck in dispatched status',
    a: 'The worker is not processing the job. Check: is the execution plane running (pnpm dev in apps/execution-plane)? Is Redis reachable (docker ps confirms sf-redis is running)? Check worker logs for connection errors.',
  },
  {
    q: 'Response panel shows garbled binary data',
    a: 'The response is gzip-compressed. The HTTP adapter sends accept-encoding: identity to disable compression. Ensure region headers are not overriding this.',
  },
  {
    q: 'Username validation errors from target API',
    a: 'Use {{faker.internet.username.safe}} instead of {{faker.internet.username}}. The safe variant produces only alphanumeric characters and underscores, matching the common ^[a-zA-Z0-9_]{5,30}$ pattern.',
  },
  {
    q: 'Flow steps clear when navigating away',
    a: 'Steps persist to localStorage under sf_flow_{scenarioId}. Open devtools > Application > Local Storage and check the key exists. If localStorage is being cleared by an extension, try incognito mode.',
  },
];

export const FAQ = [
  {
    q: 'Does SimForge make real HTTP requests?',
    a: 'Yes. Every agent makes real HTTP requests to your actual API. SimForge is not a mock — it sends real POST bodies, receives real responses, and can create real users and trigger real OTPs. Always test against staging first.',
  },
  {
    q: 'Is traffic truly geo-distributed?',
    a: 'Region profiles are simulated — latency, headers, and user agents are adjusted per region, but all requests originate from the machine running the worker. For true geo-distributed load, deploy the execution plane to cloud regions.',
  },
  {
    q: 'How do I handle OTP flows in load tests?',
    a: 'Add a SimForge bypass in your staging API. Check for the x-simforge: true request header and skip OTP verification in non-production. SimForge sends this header on every request automatically.',
  },
  {
    q: 'Can I run SimForge against production?',
    a: 'Yes, but with caution. Set target mode to production and a low approvalThreshold so large runs require manual approval. Start with 10-50 agents to understand the impact before scaling up.',
  },
  {
    q: 'What is the maximum scale?',
    a: 'SimForge is architected for 1M+ concurrent users. The limiting factor is your machine resources and number of worker instances. A single worker with concurrency 10 handles 500-1000 concurrent agents comfortably.',
  },
  {
    q: 'How do I clean up test data?',
    a: 'All SimForge requests include the x-simforge: true header. Tag records created with this header (e.g. source: simforge) and periodically delete them. Or use a dedicated staging database.',
  },
  {
    q: 'Can SimForge test GraphQL APIs?',
    a: 'Yes. GraphQL is just POST to a single endpoint with a JSON body. Set method to POST, URL to your GraphQL endpoint, and include your query and variables in the body using faker templates.',
  },
];
