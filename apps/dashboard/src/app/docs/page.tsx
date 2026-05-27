'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import Link from 'next/link';
import {
  Zap, ChevronDown, ChevronRight, Copy, Check,
  ArrowRight, Info, AlertTriangle, Lightbulb,
  HelpCircle, Hash, Globe, BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV, FAKER_GROUPS, REGIONS, EVENT_TYPES, TROUBLESHOOTING, FAQ } from './data';
import type { NavItem } from './data';

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '');
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-20% 0px -70% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);
  return { copied, copy };
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[11px] bg-zinc-800 border border-zinc-700 text-cyan-400 px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

type CalloutType = 'info' | 'warning' | 'tip';

function Callout({ type, children }: { type: CalloutType; children: React.ReactNode }) {
  const styles: Record<CalloutType, { cls: string; Icon: typeof Info }> = {
    info:    { cls: 'bg-blue-500/5 border-blue-500/20 text-blue-300',     Icon: Info          },
    warning: { cls: 'bg-yellow-500/5 border-yellow-500/20 text-yellow-300', Icon: AlertTriangle },
    tip:     { cls: 'bg-green-500/5 border-green-500/20 text-green-300',   Icon: Lightbulb     },
  };
  const { cls, Icon } = styles[type];
  return (
    <div className={cn('flex gap-3 p-4 rounded-lg border my-4 text-sm leading-relaxed', cls)}>
      <Icon size={15} className="flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function CodeBlock({ label, code, id }: { label: string; code: string; id: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden my-4 bg-[#0d0d0d]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-[#141414]">
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">{label}</span>
        <button
          onClick={() => copy(code, id)}
          className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          {copied === id
            ? <><Check size={10} className="text-green-400" /><span className="text-green-400">copied</span></>
            : <><Copy size={10} /><span>copy</span></>}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono leading-7 overflow-x-auto text-zinc-300 whitespace-pre">{code}</pre>
    </div>
  );
}

function SectionHeader({ eyebrow, title, id }: { eyebrow?: string; title: string; id: string }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="font-mono text-[10px] text-blue-400 uppercase tracking-widest mb-3">{eyebrow}</p>
      )}
      <div className="flex items-center gap-2 group">
        <h2 id={id} className="text-2xl font-bold text-white scroll-mt-20">{title}</h2>
        <a
          href={'#' + id}
          className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-zinc-400 transition-all"
        >
          <Hash size={14} />
        </a>
      </div>
      <div className="h-px bg-zinc-800 mt-4" />
    </div>
  );
}

function H3({ title, id }: { title: string; id?: string }) {
  return (
    <h3 id={id} className="text-base font-semibold text-white mt-8 mb-3 scroll-mt-20">
      {title}
    </h3>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800 my-4">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zinc-900">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left font-mono text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-zinc-900/50 transition-colors">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-4 py-3 text-sm text-zinc-400 border-b border-zinc-800/40 align-top"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Steps({ steps }: { steps: { n: string; title: string; desc: string }[] }) {
  return (
    <div className="my-6">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-7 h-7 rounded-full border-2 border-blue-500 bg-blue-500/10 flex items-center justify-center font-mono text-[11px] text-blue-400 font-bold z-10">
              {step.n}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px flex-1 bg-zinc-800 my-1 min-h-[20px]" />
            )}
          </div>
          <div className="pb-6 flex-1">
            <p className="text-sm font-semibold text-white mb-1">{step.title}</p>
            <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET:    'text-green-400  bg-green-400/10  border-green-400/25',
    POST:   'text-blue-400   bg-blue-400/10   border-blue-400/25',
    PUT:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
    PATCH:  'text-orange-400 bg-orange-400/10 border-orange-400/25',
    DELETE: 'text-red-400    bg-red-400/10    border-red-400/25',
  };
  return (
    <span className={cn('font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border', colors[method] ?? '')}>
      {method}
    </span>
  );
}

// ─── Sidebar Nav Link (extracted to avoid JSX tag issues in maps) ─────────────

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        'flex items-center px-4 py-1.5 text-[13px] transition-all border-l-2 ml-3 mr-2 rounded-r',
        isActive
          ? 'text-blue-400 border-blue-500 bg-blue-500/8'
          : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-700',
      )}
    >
      {label}
    </a>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ nav, activeId }: { nav: NavItem[]; activeId: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(nav.map((n) => n.href)));

  function toggle(href: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  }

  return (
    <nav className="w-56 flex-shrink-0 fixed top-12 left-0 bottom-0 overflow-y-auto border-r border-zinc-800/60 bg-[#0a0a0a] py-5">
      {nav.map((section) => (
        <div key={section.href} className="mb-1">
          <button
            onClick={() => toggle(section.href)}
            className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors"
          >
            <span>{section.label}</span>
            {expanded.has(section.href)
              ? <ChevronDown size={10} />
              : <ChevronRight size={10} />}
          </button>
          {expanded.has(section.href) && section.children && (
            <div className="mt-0.5 mb-2">
              {section.children.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={activeId === item.href.replace('#', '')}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

// ─── Section IDs ─────────────────────────────────────────────────────────────

const SECTION_IDS = [
  'introduction', 'quickstart', 'architecture',
  'targets', 'scenarios', 'flow-editor', 'headers-auth', 'extract-rules', 'collections', 'runs',
  'faker-templates', 'faker-person', 'faker-phone', 'faker-finance', 'faker-flow',
  'agents', 'regions', 'rate-limiting', 'extraction', 'multi-step',
  'realtime', 'event-types', 'metrics', 'reports',
  'api-reference', 'troubleshooting', 'faq',
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const activeId = useActiveSection(SECTION_IDS);
  const [scrollPct, setScrollPct] = useState(0);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    setIsAuthed(!!localStorage.getItem('sf_token'));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-px bg-zinc-800 z-50">
        <div
          className="h-full bg-blue-500 transition-all duration-75"
          style={{ width: scrollPct + '%' }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-[#0a0a0a]/90 backdrop-blur border-b border-zinc-800/60 flex items-center px-6 gap-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <Zap size={12} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm">SimForge</span>
        </div>
        <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
          v1.0 · BETA
        </span>
        <div className="ml-auto flex items-center gap-4">
          <a
            href="#quickstart"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Quick Start
          </a>
          <a
            href="#api-reference"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            API
          </a>
          {isAuthed ? (
            <Link
              href="/scenarios"
              className="text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded transition-colors"
            >
              Go to app →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded transition-colors"
              >
                Get started →
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="flex">
        <Sidebar nav={NAV} activeId={activeId} />

        <main className="ml-56 flex-1 max-w-3xl px-10 py-12 pb-32">
          {/* INTRODUCTION */}
          <section id="introduction" className="scroll-mt-20 mb-20">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Documentation · v1.0
            </div>
            <h1 className="text-5xl font-bold text-white mb-5 tracking-tight leading-tight">
              SimForge
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-xl">
              A production-grade API load testing platform. Simulate realistic authenticated traffic
              from virtual users across 11 global regions using a Postman-style visual flow editor.
              No YAML, no config files, no setup hell.
            </p>
            <div className="flex items-center gap-3 mb-10">
              <Link
                href="/register"
                className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 px-5 py-2.5 rounded-lg transition-colors"
              >
                Start testing <ArrowRight size={14} />
              </Link>
              <a
                href="#quickstart"
                className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Read the docs →
              </a>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  Icon: Zap,
                  title: 'Visual Flow Editor',
                  desc: 'Build multi-step authenticated flows with faker data injection and response extraction.',
                },
                {
                  Icon: Globe,
                  title: 'Global Traffic',
                  desc: 'Agents spawn across 11 regions with realistic latency, user agents, and geo headers.',
                },
                {
                  Icon: BarChart2,
                  title: 'Real-Time Metrics',
                  desc: 'P50/P95/P99 latency, RPS, error rates, region breakdowns — live and persisted.',
                },
              ].map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                >
                  <Icon size={14} className="text-blue-400 mb-2" />
                  <p className="text-sm font-semibold text-white mb-1">{title}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* QUICK START */}
          <section id="quickstart" className="scroll-mt-20 mb-20">
            <SectionHeader eyebrow="Getting Started" title="Quick Start" id="quickstart" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Get your first load test running in under 5 minutes. Requires Node.js 18+, PostgreSQL
              16, and Redis 7.
            </p>
            <H3 title="1. Start Infrastructure" />
            <CodeBlock
              id="infra"
              label="bash"
              code={`# Start PostgreSQL and Redis via Docker
docker compose -f infra/docker/docker-compose.yml up -d

# Install all dependencies
pnpm install`}
            />
            <H3 title="2. Start All Services" />
            <p className="text-zinc-400 text-sm mb-3">Open three terminals simultaneously:</p>
            <CodeBlock
              id="svc1"
              label="Terminal 1 · Control Plane"
              code="cd apps/control-plane && pnpm dev    # port 4000"
            />
            <CodeBlock
              id="svc2"
              label="Terminal 2 · Worker"
              code="cd apps/execution-plane && pnpm dev  # BullMQ processor"
            />
            <CodeBlock
              id="svc3"
              label="Terminal 3 · Dashboard"
              code="cd apps/dashboard && pnpm dev        # port 3000"
            />
            <H3 title="3. Create Your First Load Test" />
            <Steps
              steps={[
                {
                  n: '1',
                  title: 'Add a Target',
                  desc: 'Go to Targets → Add Target. Enter your API base URL. Set mode to sandbox.',
                },
                {
                  n: '2',
                  title: 'Create a Scenario',
                  desc: 'Go to Scenarios → New. Give it a name, attach your target, publish it.',
                },
                {
                  n: '3',
                  title: 'Build Your Flow',
                  desc: 'Open the scenario. Set URL, method, headers, and body. Use {{faker.person.fullName}} to generate unique data per agent.',
                },
                {
                  n: '4',
                  title: 'Set Scale and Run',
                  desc: 'Set the user count (e.g. 100), hit Run. Watch the world map light up in real time.',
                },
                {
                  n: '5',
                  title: 'View Results',
                  desc: 'Check Reports for P50/P95/P99 latencies, status code breakdowns, region distribution, and error samples.',
                },
              ]}
            />
            <Callout type="info">
              The scenario must be in <strong>published</strong> status before the Run button
              activates. Scenarios in <C>draft</C> status cannot be dispatched.
            </Callout>
          </section>

          {/* ARCHITECTURE */}
          <section id="architecture" className="scroll-mt-20 mb-20">
            <SectionHeader title="Architecture" id="architecture" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              SimForge is a monorepo with three runtime services communicating via Redis queues and
              PostgreSQL.
            </p>
            <div className="flex items-center gap-1 overflow-x-auto my-6 p-5 bg-zinc-900 border border-zinc-800 rounded-lg">
              {(
                [
                  { label: 'Dashboard', sub: 'Next.js 16', accent: true, green: false },
                  null,
                  { label: 'Control Plane', sub: 'NestJS/Fastify', accent: false, green: false },
                  null,
                  { label: 'Redis Queue', sub: 'BullMQ', accent: false, green: false },
                  null,
                  { label: 'Worker', sub: 'Exec Plane', accent: true, green: false },
                  null,
                  { label: 'Your API', sub: 'HTTP Target', accent: false, green: true },
                ] as ({ label: string; sub: string; accent: boolean; green: boolean } | null)[]
              ).map((node, i) => {
                if (node === null) {
                  return (
                    <ArrowRight key={i} size={14} className="text-zinc-600 mx-2 flex-shrink-0" />
                  );
                }
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex-shrink-0 rounded-lg p-3 text-center min-w-[90px] border',
                      node.green
                        ? 'bg-green-500/8 border-green-500/25'
                        : node.accent
                          ? 'bg-blue-500/8 border-blue-500/25'
                          : 'bg-zinc-800 border-zinc-700',
                    )}
                  >
                    <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-1">
                      {node.label}
                    </p>
                    <p
                      className={cn(
                        'text-xs font-medium',
                        node.green
                          ? 'text-green-400'
                          : node.accent
                            ? 'text-blue-400'
                            : 'text-zinc-300',
                      )}
                    >
                      {node.sub}
                    </p>
                  </div>
                );
              })}
            </div>
            <Table
              headers={['Service', 'Port', 'Role']}
              rows={[
                [
                  <strong key="a" className="text-zinc-200">
                    Control Plane
                  </strong>,
                  <C key="b">4000</C>,
                  'REST API, orchestration, auth, metrics ingestion, WebSocket relay',
                ],
                [
                  <strong key="c" className="text-zinc-200">
                    Execution Plane
                  </strong>,
                  '—',
                  'BullMQ worker — spawns agents, executes flows, posts metrics',
                ],
                [
                  <strong key="d" className="text-zinc-200">
                    Dashboard
                  </strong>,
                  <C key="e">3000</C>,
                  'Next.js frontend — flow editor, world map, reports',
                ],
                [
                  <strong key="f" className="text-zinc-200">
                    PostgreSQL
                  </strong>,
                  <C key="g">5432</C>,
                  'Persistent storage for runs, metrics, scenarios, targets, collections',
                ],
                [
                  <strong key="h" className="text-zinc-200">
                    Redis
                  </strong>,
                  <C key="i">6379</C>,
                  'BullMQ job queue + pub/sub for real-time events',
                ],
              ]}
            />
          </section>

          <div className="h-px bg-zinc-800/60 my-12" />

          {/* TARGETS */}
          <section id="targets" className="scroll-mt-20 mb-20">
            <SectionHeader eyebrow="Core Concepts" title="Targets" id="targets" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              A <strong className="text-zinc-200">Target</strong> represents the API you want to
              test. It defines the allowed origin, rate limits, simulation mode, and approval
              thresholds.
            </p>
            <Table
              headers={['Field', 'Description', 'Example']}
              rows={[
                ['Name', 'Human-readable label for your API', <C key="a">FlowKey API</C>],
                [
                  'Base URL',
                  'API origin. Only requests to this origin are allowed',
                  <C key="b">https://api.yourapp.com</C>,
                ],
                ['Mode', 'Controls safety level and behavior', <C key="c">sandbox</C>],
                ['Max RPS', 'Global rate limit ceiling across all shards', <C key="d">100</C>],
                [
                  'Max Concurrency',
                  'Maximum concurrent virtual users allowed',
                  <C key="e">1000</C>,
                ],
                [
                  'Approval Threshold',
                  'Runs above this agent count require manual approval',
                  <C key="f">10000</C>,
                ],
              ]}
            />
            <Table
              headers={['Mode', 'Description', 'Use Case']}
              rows={[
                [
                  <C key="a">sandbox</C>,
                  'No real side effects expected',
                  'Staging environments, test APIs',
                ],
                [
                  <C key="b">shadow</C>,
                  'Mirror traffic alongside production',
                  'Dark launch validation',
                ],
                [
                  <C key="c">production</C>,
                  'Real traffic — large runs require approval',
                  'Stress tests, capacity planning',
                ],
              ]}
            />
            <Callout type="warning">
              <strong>Production mode</strong> with high agent counts will create real users, send
              real OTPs, and consume real quota. Always use sandbox mode for development testing.
            </Callout>
          </section>

          {/* SCENARIOS */}
          <section id="scenarios" className="scroll-mt-20 mb-20">
            <SectionHeader title="Scenarios" id="scenarios" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              A <strong className="text-zinc-200">Scenario</strong> defines the test configuration.
              Scenarios must be <strong className="text-zinc-200">published</strong> before they can
              be run.
            </p>
            <Table
              headers={['Status', 'Description']}
              rows={[
                [<C key="a">draft</C>, 'Being configured. Cannot be run.'],
                [<C key="b">published</C>, 'Ready to run. Run button is enabled.'],
                [<C key="c">archived</C>, 'No longer active. Read-only.'],
              ]}
            />
            <Table
              headers={['Traffic Pattern', 'Description', 'Key Fields']}
              rows={[
                [
                  <C key="a">steady</C>,
                  'Constant users throughout the run',
                  <C key="aa">steadyAgents</C>,
                ],
                [
                  <C key="b">ramp</C>,
                  'Linearly ramps from 0 to target',
                  <C key="bb">startAgents, endAgents</C>,
                ],
                [
                  <C key="c">burst</C>,
                  'Sudden spike at a defined moment',
                  <C key="cc">burstAgents, burstAt</C>,
                ],
                [
                  <C key="d">step</C>,
                  'Increases in discrete steps',
                  <C key="dd">steps[] with agents + duration</C>,
                ],
                [
                  <C key="e">viral</C>,
                  'Exponential growth pattern',
                  <C key="ee">startAgents, endAgents, growthRate</C>,
                ],
              ]}
            />
            <Callout type="tip">
              When you set scale from the Run button, it overrides the scenario traffic pattern for
              that specific run. You can test at different scales without modifying the scenario.
            </Callout>
          </section>

          {/* FLOW EDITOR */}
          <section id="flow-editor" className="scroll-mt-20 mb-20">
            <SectionHeader title="Flow Editor" id="flow-editor" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              The flow editor is SimForge&apos;s core interface — a Postman-style multi-step request
              builder. Each step maps to one HTTP call that every virtual agent executes
              sequentially. Your flow is{' '}
              <strong className="text-zinc-200">auto-saved to localStorage</strong> per scenario.
            </p>
            <Table
              headers={['Field', 'Description']}
              rows={[
                [
                  'Method',
                  <span key="m" className="flex items-center gap-1">
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                      <MethodBadge key={m} method={m} />
                    ))}
                  </span>,
                ],
                [
                  'URL',
                  'Full URL including protocol and path. Base URL is extracted automatically.',
                ],
                ['Name', 'Label shown in the step list.'],
                [
                  'Body',
                  'JSON body with faker template variables. Syntax-highlighted in the editor.',
                ],
                [
                  'Headers',
                  <span key="h">
                    Key/value pairs. Values support faker variables like{' '}
                    <C>{'{{faker.string.uuid}}'}</C>.
                  </span>,
                ],
                [
                  'Auth',
                  'None, Bearer token, API Key, or Basic Auth. Bearer supports step references.',
                ],
                ['Extract', 'Rules to capture response values and pass them to subsequent steps.'],
              ]}
            />

            <H3 title="Headers & Auth" id="headers-auth" />
            <CodeBlock
              id="headers"
              label="Common Headers"
              code={`Content-Type      application/json
Idempotency-Key   {{faker.string.uuid}}
Authorization     Bearer {{step.1.response.accessToken}}
X-Device-ID       {{faker.string.uuid}}`}
            />

            <H3 title="Extract Rules" id="extract-rules" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Extract rules capture values from a step&apos;s response and make them available in
              later steps via <C>{'{{step.N.response.variableName}}'}</C>.
            </p>
            <Table
              headers={['Field', 'Description', 'Example']}
              rows={[
                [
                  'Variable Name',
                  'How you reference this value in later steps',
                  <C key="a">registrationId</C>,
                ],
                [
                  'Path',
                  <span key="p">
                    Dot-notation path. Prefix with <C>body.</C> or <C>headers.</C>
                  </span>,
                  <C key="b">body.data.registration_id</C>,
                ],
              ]}
            />
            <CodeBlock
              id="flow3"
              label="3-Step Auth Flow"
              code={`// Step 1 — POST /auth/initiate
Body: {
  "contact": "{{faker.phone.nigeria}}",
  "contact_type": "phone"
}
Extract: registrationId <- body.data.registration_id

// Step 2 — POST /auth/verify-otp
Body: {
  "registration_id": "{{step.1.response.registrationId}}",
  "otp": "000000"
}
Extract: accessToken <- body.data.tokens.access_token

// Step 3 — POST /auth/complete
// Auth tab: Bearer {{step.2.response.accessToken}}
Body: {
  "registration_id": "{{step.1.response.registrationId}}",
  "username":        "{{faker.internet.username.safe}}",
  "login_passcode":  "{{faker.number.digits.6}}",
  "device_id":       "{{faker.string.uuid}}",
  "fcm_token":       "{{faker.string.alphanumeric}}"
}`}
            />
            <Callout type="info">
              Step numbers in <C>{'{{step.N.response.X}}'}</C> are{' '}
              <strong>1-based HTTP step indices</strong>. Step 1 is the first HTTP request, step 2
              is the second, and so on.
            </Callout>
          </section>

          {/* COLLECTIONS */}
          <section id="collections" className="scroll-mt-20 mb-20">
            <SectionHeader title="Collections" id="collections" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Collections are color-coded folders that group related scenarios in the sidebar. A
              scenario can belong to multiple collections.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-400 pl-2">
              <li>
                Click the <strong className="text-zinc-200">folder+</strong> icon next to
                &quot;Collections&quot; in the sidebar
              </li>
              <li>Type a collection name and pick a color</li>
              <li>Press Enter or click Create</li>
              <li>
                Expand the collection and click{' '}
                <strong className="text-zinc-200">Add scenario</strong>
              </li>
            </ol>
          </section>

          {/* RUNS */}
          <section id="runs" className="scroll-mt-20 mb-20">
            <SectionHeader title="Runs & Scale" id="runs" />
            <Table
              headers={['Scale', 'Shards', 'Use Case']}
              rows={[
                [<C key="a">1–10</C>, '1', 'Smoke test — verify flow works end-to-end'],
                [<C key="b">50–100</C>, '1', 'Light load — find rate limit thresholds'],
                [<C key="c">500</C>, '1', 'Medium load — baseline performance'],
                [<C key="d">1000</C>, '2', 'Heavy load — capacity planning'],
                [<C key="e">5000+</C>, '10+', 'Stress test — find breaking points'],
              ]}
            />
            <Table
              headers={['Status', 'Description']}
              rows={[
                [<C key="a">pending</C>, 'Created, awaiting approval or auto-dispatch'],
                [<C key="b">approved</C>, 'Approved, ready to dispatch'],
                [<C key="c">dispatched</C>, 'Shard jobs queued in Redis'],
                [<C key="d">running</C>, 'Agents actively executing'],
                [<C key="e">completed</C>, 'All shards finished, metrics persisted'],
                [<C key="f">failed</C>, 'One or more shards errored'],
              ]}
            />
            <Callout type="info">
              Runs where <C>agentCount</C> exceeds the target&apos;s <C>approvalThreshold</C>{' '}
              require manual approval before dispatching.
            </Callout>
          </section>

          <div className="h-px bg-zinc-800/60 my-12" />

          {/* FAKER TEMPLATES */}
          <section id="faker-templates" className="scroll-mt-20 mb-20">
            <SectionHeader eyebrow="Faker Templates" title="Faker Templates" id="faker-templates" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Faker templates generate unique, realistic data for every agent independently. Every
              time an agent runs your flow, all faker variables resolve to fresh values. Templates
              use double curly brace syntax and work in request bodies, headers, and URL paths.
            </p>
            <Callout type="tip">
              Click <strong>Insert variable</strong> in the body editor toolbar to browse and insert
              any faker variable with an automatically chosen field name.
            </Callout>
            {FAKER_GROUPS.map((group) => (
              <div key={group.id} id={group.id} className="scroll-mt-20 mb-8">
                <H3 title={group.group} />
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                  {group.items.map((item, i) => (
                    <div
                      key={item.value}
                      className={cn(
                        'flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800/50 transition-colors',
                        i < group.items.length - 1 ? 'border-b border-zinc-800/60' : '',
                      )}
                    >
                      <span className="text-sm text-zinc-400">{item.label}</span>
                      <code className="font-mono text-xs text-yellow-400 bg-yellow-400/5 border border-yellow-400/15 px-2 py-0.5 rounded">
                        {item.value}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Callout type="warning">
              Use <C>{'{{faker.internet.username.safe}}'}</C> when your API requires
              alphanumeric-only usernames matching <C>^[a-zA-Z0-9_]&#123;5,30&#125;</C>. The safe
              variant strips dots and hyphens automatically.
            </Callout>
          </section>

          <div className="h-px bg-zinc-800/60 my-12" />

          {/* VIRTUAL AGENTS */}
          <section id="agents" className="scroll-mt-20 mb-20">
            <SectionHeader eyebrow="Simulation Engine" title="Virtual Agents" id="agents" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Each virtual agent is an isolated state machine that runs your flow independently.
              Agents share no state — every agent generates its own faker data, maintains its own
              extracted variables, and makes its own HTTP requests.
            </p>
            <Steps
              steps={[
                {
                  n: '1',
                  title: 'SPAWNED',
                  desc: 'Agent created with unique ID, session token, entropy seed, and region profile. Emits agent.spawned.',
                },
                {
                  n: '2',
                  title: 'ACTIVE',
                  desc: 'Agent traverses the behavior graph. At each HTTP node it resolves faker templates, makes the request, records latency, extracts values, and transitions to the next node.',
                },
                {
                  n: '3',
                  title: 'COMPLETED / FAILED',
                  desc: 'Agent reaches the abort (done) node and completes, or fails after exhausting retries. Emits agent.completed or agent.failed.',
                },
              ]}
            />
            <H3 title="Think Time" />
            <p className="text-zinc-400 text-sm leading-relaxed">
              Between steps, agents pause for a realistic think time sampled from a Gaussian
              distribution. Default: mean 300ms ± 100ms std dev. This prevents synchronized request
              storms.
            </p>
            <H3 title="Retry Behavior" />
            <p className="text-zinc-400 text-sm leading-relaxed">
              Each step has <C>maxRetries</C> (default: 3). On error the agent retries with
              exponential backoff. After exhausting retries the step emits <C>action.dlq_sent</C>.
            </p>
          </section>

          {/* GLOBAL REGIONS */}
          <section id="regions" className="scroll-mt-20 mb-20">
            <SectionHeader title="Global Regions" id="regions" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              SimForge distributes agents across 11 global regions. Each region profile adds
              realistic latency, geo-specific headers, user agents, and simulated packet loss.
            </p>
            <div className="grid grid-cols-3 gap-2 my-6">
              {REGIONS.map((r) => (
                <div
                  key={r.code}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors"
                >
                  <p className="font-mono text-[10px] text-blue-400 mb-1">{r.code}</p>
                  <p className="text-xs text-zinc-300 mb-1">{r.name}</p>
                  <p className="font-mono text-[10px] text-zinc-600">
                    {r.pct} · P50 {r.p50}
                  </p>
                </div>
              ))}
            </div>
            <Callout type="info">
              Region latency is <strong>simulated on top of actual network latency</strong>. All
              requests originate from the machine running the worker. For true geo-distributed load,
              deploy the execution plane to cloud regions and set the <C>WORKER_REGION</C> env var.
            </Callout>
          </section>

          {/* RATE LIMITING */}
          <section id="rate-limiting" className="scroll-mt-20 mb-20">
            <SectionHeader title="Rate Limiting" id="rate-limiting" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              SimForge implements a token bucket algorithm to respect your target&apos;s{' '}
              <C>maxRps</C> setting. When the target API returns rate limit errors, the bucket
              automatically backs off by 20% and logs <C>[TokenBucket] Backed off to N RPS</C>.
            </p>
            <Callout type="tip">
              The RPS it stabilizes at tells you your API&apos;s real sustained throughput capacity
              under concurrent load. If it drops to 1 RPS quickly, your rate limiter is aggressive.
            </Callout>
          </section>

          {/* DATA EXTRACTION */}
          <section id="extraction" className="scroll-mt-20 mb-20">
            <SectionHeader title="Data Extraction" id="extraction" />
            <Table
              headers={['Path', 'Extracts From', 'Example']}
              rows={[
                [
                  <C key="a">body.data.id</C>,
                  'Response body field',
                  <C key="aa">{'{"data": {"id": "abc"}}'}</C>,
                ],
                [
                  <C key="b">body.data.tokens.access_token</C>,
                  'Deeply nested field',
                  <C key="bb">{'{"data":{"tokens":{"access_token":"eyJ..."}}}'}</C>,
                ],
                [
                  <C key="c">headers.x-request-id</C>,
                  'Response header value',
                  <C key="cc">X-Request-Id: abc123</C>,
                ],
              ]}
            />
            <Callout type="warning">
              If an extraction path does not resolve, the variable is not stored and subsequent
              steps receive an empty string. Verify extract paths against real response structures
              first.
            </Callout>
          </section>

          {/* MULTI-STEP FLOWS */}
          <section id="multi-step" className="scroll-mt-20 mb-20">
            <SectionHeader title="Multi-Step Flows" id="multi-step" />
            <CodeBlock
              id="checkout"
              label="E-commerce Checkout (4 steps)"
              code={`Step 1: POST /users/register
  Body: { name, email, password }
  Extract: userId <- body.data.id
           accessToken <- body.data.token

Step 2: POST /cart/add
  Auth: Bearer {{step.1.response.accessToken}}
  Body: { productId, quantity }
  Extract: cartId <- body.data.cart_id

Step 3: POST /orders
  Body: { cart_id: "{{step.2.response.cartId}}" }
  Extract: orderId <- body.data.order_id

Step 4: GET /orders/{{step.3.response.orderId}}
  Verify order was created successfully`}
            />
            <CodeBlock
              id="wallet"
              label="Wallet Funding (3 steps)"
              code={`Step 1: POST /auth/login
  Body: {
    "phone":    "{{faker.phone.nigeria}}",
    "passcode": "{{faker.number.digits.6}}"
  }
  Extract: accessToken <- body.data.tokens.access_token

Step 2: POST /wallets/initiate-funding
  Auth: Bearer {{step.1.response.accessToken}}
  Body: { "amount": "{{faker.finance.amount}}", "currency": "NGN" }
  Extract: reference <- body.data.reference

Step 3: POST /wallets/confirm
  Body: { "reference": "{{step.2.response.reference}}" }`}
            />
            <Callout type="warning">
              For OTP verification flows, add a SimForge bypass in your staging API. Check for the
              <C>x-simforge: true</C> header that SimForge sends on every request and skip OTP
              validation in non-production environments.
            </Callout>
          </section>

          <div className="h-px bg-zinc-800/60 my-12" />

          {/* REAL-TIME EVENTS */}
          <section id="realtime" className="scroll-mt-20 mb-20">
            <SectionHeader eyebrow="Observability" title="Real-Time Events" id="realtime" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              SimForge emits events via WebSocket as agents execute. The dashboard subscribes to the
              <C>/realtime</C> Socket.IO namespace and displays live updates on the world map and
              charts.
            </p>
            <section id="event-types" className="scroll-mt-20">
              <H3 title="Event Types" id="event-types" />
              <Table
                headers={['Event', 'Fired When', 'Key Payload Fields']}
                rows={EVENT_TYPES.map((e) => [
                  <C key={e.event}>{e.event}</C>,
                  e.when,
                  <span key={e.fields} className="font-mono text-[11px] text-zinc-500">
                    {e.fields}
                  </span>,
                ])}
              />
            </section>
          </section>

          {/* METRICS */}
          <section id="metrics" className="scroll-mt-20 mb-20">
            <SectionHeader title="Metrics" id="metrics" />
            <div className="grid grid-cols-4 gap-3 my-6">
              {[
                { label: 'Total Requests', value: '150', sub: '50 agents', color: 'text-blue-400' },
                { label: 'Success Rate', value: '100%', sub: '0 errors', color: 'text-green-400' },
                { label: 'P95 Latency', value: '2.4s', sub: 'P50: 1.1s', color: 'text-yellow-400' },
                { label: 'Peak RPS', value: '43', sub: 'token limited', color: 'text-blue-400' },
              ].map((m) => (
                <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-600 mb-2">{m.label}</p>
                  <p className={cn('font-mono text-2xl font-bold leading-none mb-1', m.color)}>
                    {m.value}
                  </p>
                  <p className="text-[10px] text-zinc-600">{m.sub}</p>
                </div>
              ))}
            </div>
            <Table
              headers={['Field', 'Type', 'Description']}
              rows={[
                [
                  <C key="a">total_requests</C>,
                  'bigint',
                  'Total HTTP requests made by all agents in the shard',
                ],
                [
                  <C key="b">total_errors</C>,
                  'bigint',
                  "Total failed requests (DLQ'd after exhausting retries)",
                ],
                [
                  <C key="c">completed_agents</C>,
                  'int',
                  'Agents that finished all steps successfully',
                ],
                [
                  <C key="d">failed_agents</C>,
                  'int',
                  'Agents that crashed or failed to initialize',
                ],
                [<C key="e">p50_ms</C>, 'int', 'Median latency across all requests in this shard'],
                [<C key="f">p95_ms</C>, 'int', '95th percentile latency'],
                [<C key="g">p99_ms</C>, 'int', '99th percentile latency'],
                [<C key="h">peak_rps</C>, 'int', 'Maximum requests per second observed'],
                [<C key="i">region_breakdown</C>, 'jsonb', 'Request count by region code'],
                [<C key="j">status_breakdown</C>, 'jsonb', 'Request count by HTTP status code'],
                [<C key="k">error_samples</C>, 'jsonb', 'Array of error messages with counts'],
              ]}
            />
          </section>

          {/* REPORTS */}
          <section id="reports" className="scroll-mt-20 mb-20">
            <SectionHeader title="Reports" id="reports" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              The Reports page reads from PostgreSQL to display aggregated metrics for any past run.
              Navigate to <strong className="text-zinc-200">Reports</strong> in the sidebar, select
              a scenario, then a run.
            </p>
            <ul className="space-y-2 text-sm text-zinc-400 pl-4 list-disc">
              {[
                ['Summary cards', 'total requests, success rate, peak RPS, P95 latency'],
                ['Latency percentiles', 'P50/P95/P99 with visual progress bars'],
                ['Traffic by region', 'request distribution across 11 regions'],
                ['Status code breakdown', 'color-coded: 2xx green, 4xx orange, 5xx red'],
                ['Top countries', 'top 10 countries by request volume'],
                ['Error samples', 'deduplicated error messages with occurrence counts'],
              ].map(([label, desc]) => (
                <li key={label}>
                  <strong className="text-zinc-200">{label}</strong> — {desc}
                </li>
              ))}
            </ul>
          </section>

          <div className="h-px bg-zinc-800/60 my-12" />

          {/* API REFERENCE */}
          <section id="api-reference" className="scroll-mt-20 mb-20">
            <SectionHeader eyebrow="Reference" title="API Reference" id="api-reference" />
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Control plane REST API at <C>http://localhost:4000</C>. Swagger docs at{' '}
              <C>http://localhost:4000/api/docs</C>. All endpoints except <C>/api/auth/*</C> require
              a Bearer token.
            </p>
            <CodeBlock
              id="login"
              label="POST /api/auth/login"
              code={`{ "email": "you@example.com", "password": "your_password" }
// Response: { "accessToken": "eyJ...", "user": { ... } }`}
            />
            <CodeBlock
              id="endpoints"
              label="All Endpoints"
              code={`// Targets
GET    /api/targets
POST   /api/targets
GET    /api/targets/:id
PATCH  /api/targets/:id/verify

// Scenarios
GET    /api/scenarios
POST   /api/scenarios
GET    /api/scenarios/:id
PATCH  /api/scenarios/:id/publish
POST   /api/scenarios/:id/runs        Submit a run
GET    /api/scenarios/:id/runs        Run history

// Metrics
GET    /api/metrics/runs/:runId
GET    /api/metrics/scenarios/:id/runs
POST   /api/metrics/shards            Worker posts here

// Collections
GET    /api/collections
POST   /api/collections
PUT    /api/collections/:id
DELETE /api/collections/:id
POST   /api/collections/:id/scenarios/:scenarioId
DELETE /api/collections/:id/scenarios/:scenarioId

// Runs
PATCH  /api/runs/:id/complete`}
            />
            <CodeBlock
              id="runbody"
              label="POST /api/scenarios/:id/runs — Request Body"
              code={`{
  "agentCount":  100,
  "baseUrl":     "https://api.yourapp.com",
  "entryNodeId": "step_0",
  "flowSteps": {
    "step_0": {
      "id": "step_0", "type": "http", "label": "Register",
      "action": {
        "method": "POST", "pathTemplate": "/users",
        "headers": { "Content-Type": "application/json" },
        "bodyTemplate": "{\\"email\\":\\"{{faker.internet.email}}\\"}"
      },
      "transitions": [{ "targetNodeId": "done", "weight": 1, "guard": null }],
      "cooldownMs": 0,
      "thinkTimeMs": { "meanMs": 300, "stdDevMs": 100 },
      "maxRetries": 3,
      "extractRules": { "userId": "body.data.id" }
    },
    "done": { "id": "done", "type": "abort", "transitions": [] }
  }
}`}
            />
          </section>

          {/* TROUBLESHOOTING */}
          <section id="troubleshooting" className="scroll-mt-20 mb-20">
            <SectionHeader title="Troubleshooting" id="troubleshooting" />
            <div className="space-y-3">
              {TROUBLESHOOTING.map((item, i) => (
                <details
                  key={i}
                  className="group bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle size={13} className="text-yellow-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-zinc-200">{item.q}</span>
                    </div>
                    <ChevronRight
                      size={13}
                      className="text-zinc-600 group-open:rotate-90 transition-transform flex-shrink-0"
                    />
                  </summary>
                  <div className="px-4 pb-4 pt-2 border-t border-zinc-800">
                    <p className="text-sm text-zinc-400 leading-relaxed">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-20 mb-20">
            <SectionHeader title="FAQ" id="faq" />
            <div className="space-y-3">
              {FAQ.map((item, i) => (
                <details
                  key={i}
                  className="group bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <HelpCircle size={13} className="text-blue-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-zinc-200">{item.q}</span>
                    </div>
                    <ChevronRight
                      size={13}
                      className="text-zinc-600 group-open:rotate-90 transition-transform flex-shrink-0"
                    />
                  </summary>
                  <div className="px-4 pb-4 pt-2 border-t border-zinc-800">
                    <p className="text-sm text-zinc-400 leading-relaxed">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-zinc-800 pt-8 mt-12 flex items-center justify-between">
            <p className="font-mono text-[11px] text-zinc-600">
              SimForge · Built by{' '}
              <a
                href="https://github.com/chibuike-kt"
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                @chibuike-kt
              </a>{' '}
              · Lagos, Nigeria
            </p>
            <Link
              href="/register"
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded transition-colors"
            >
              Get started <ArrowRight size={11} />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
