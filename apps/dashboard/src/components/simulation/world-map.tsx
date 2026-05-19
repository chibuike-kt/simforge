'use client';

import { useEffect, useState, useMemo } from 'react';

const TRAFFIC_PROFILES: Record<
  string,
  { label: string; countries: string[]; latency: { p50: number }; device: { mobilePct: number } }
> = {
  NA_WEST: {
    label: 'N. America West',
    countries: ['US', 'CA'],
    latency: { p50: 25 },
    device: { mobilePct: 0.38 },
  },
  NA_EAST: {
    label: 'N. America East',
    countries: ['US', 'CA', 'MX'],
    latency: { p50: 20 },
    device: { mobilePct: 0.4 },
  },
  EU_WEST: {
    label: 'Western Europe',
    countries: [
      'GB',
      'FR',
      'DE',
      'NL',
      'BE',
      'IE',
      'CH',
      'AT',
      'SE',
      'NO',
      'DK',
      'FI',
      'PT',
      'ES',
      'IT',
    ],
    latency: { p50: 18 },
    device: { mobilePct: 0.45 },
  },
  EU_EAST: {
    label: 'Eastern Europe',
    countries: ['PL', 'UA', 'RO', 'CZ', 'HU', 'SK', 'BG', 'RS', 'HR', 'BY', 'MD'],
    latency: { p50: 35 },
    device: { mobilePct: 0.52 },
  },
  ASIA_EAST: {
    label: 'East Asia',
    countries: ['JP', 'KR', 'TW', 'CN', 'MN'],
    latency: { p50: 15 },
    device: { mobilePct: 0.55 },
  },
  ASIA_SE: {
    label: 'Southeast Asia',
    countries: ['SG', 'TH', 'VN', 'ID', 'MY', 'PH', 'MM', 'KH'],
    latency: { p50: 65 },
    device: { mobilePct: 0.72 },
  },
  ASIA_SOUTH: {
    label: 'South Asia',
    countries: ['IN', 'PK', 'BD', 'LK', 'NP'],
    latency: { p50: 80 },
    device: { mobilePct: 0.78 },
  },
  ASIA_CENTRAL: {
    label: 'Middle East & Central Asia',
    countries: ['SA', 'AE', 'TR', 'IR', 'IQ', 'KZ', 'UZ', 'KW', 'QA', 'BH', 'JO', 'LB', 'SY'],
    latency: { p50: 55 },
    device: { mobilePct: 0.65 },
  },
  AFRICA: {
    label: 'Africa',
    countries: [
      'NG',
      'ZA',
      'KE',
      'EG',
      'GH',
      'ET',
      'TZ',
      'UG',
      'SN',
      'CI',
      'CM',
      'MZ',
      'ZM',
      'ZW',
      'SD',
      'DZ',
      'MA',
      'LY',
      'ML',
      'NE',
      'TD',
      'SO',
    ],
    latency: { p50: 120 },
    device: { mobilePct: 0.82 },
  },
  LATAM: {
    label: 'Latin America',
    countries: [
      'BR',
      'MX',
      'CO',
      'AR',
      'PE',
      'CL',
      'VE',
      'EC',
      'BO',
      'PY',
      'UY',
      'GT',
      'CR',
      'PA',
      'DO',
      'CU',
    ],
    latency: { p50: 70 },
    device: { mobilePct: 0.68 },
  },
  OCEANIA: {
    label: 'Oceania',
    countries: ['AU', 'NZ'],
    latency: { p50: 30 },
    device: { mobilePct: 0.48 },
  },
};

const DEFAULT_REGION_DISTRIBUTION = [
  { regionCode: 'NA_WEST', agentPct: 0.18 },
  { regionCode: 'NA_EAST', agentPct: 0.15 },
  { regionCode: 'EU_WEST', agentPct: 0.22 },
  { regionCode: 'EU_EAST', agentPct: 0.08 },
  { regionCode: 'ASIA_EAST', agentPct: 0.12 },
  { regionCode: 'ASIA_SE', agentPct: 0.09 },
  { regionCode: 'ASIA_SOUTH', agentPct: 0.1 },
  { regionCode: 'ASIA_CENTRAL', agentPct: 0.05 },
  { regionCode: 'AFRICA', agentPct: 0.04 },
  { regionCode: 'LATAM', agentPct: 0.06 },
  { regionCode: 'OCEANIA', agentPct: 0.03 },
];

const COUNTRY_POSITIONS: Record<string, { x: number; y: number }> = {
  US: { x: 16, y: 40 },
  CA: { x: 15, y: 28 },
  MX: { x: 18, y: 52 },
  BR: { x: 35, y: 66 },
  AR: { x: 32, y: 78 },
  CO: { x: 27, y: 58 },
  PE: { x: 27, y: 65 },
  CL: { x: 30, y: 76 },
  VE: { x: 30, y: 55 },
  EC: { x: 25, y: 62 },
  BO: { x: 31, y: 68 },
  PY: { x: 33, y: 72 },
  UY: { x: 34, y: 76 },
  GT: { x: 20, y: 52 },
  CR: { x: 22, y: 54 },
  PA: { x: 23, y: 55 },
  DO: { x: 26, y: 50 },
  CU: { x: 23, y: 48 },
  GB: { x: 46, y: 27 },
  FR: { x: 48, y: 31 },
  DE: { x: 50, y: 28 },
  NL: { x: 49, y: 26 },
  BE: { x: 49, y: 27 },
  IE: { x: 45, y: 26 },
  CH: { x: 50, y: 30 },
  AT: { x: 51, y: 29 },
  SE: { x: 52, y: 21 },
  NO: { x: 50, y: 19 },
  DK: { x: 50, y: 24 },
  FI: { x: 54, y: 19 },
  PT: { x: 45, y: 34 },
  ES: { x: 47, y: 33 },
  IT: { x: 51, y: 33 },
  PL: { x: 52, y: 26 },
  UA: { x: 55, y: 27 },
  RO: { x: 54, y: 29 },
  CZ: { x: 51, y: 27 },
  HU: { x: 52, y: 28 },
  SK: { x: 52, y: 27 },
  BG: { x: 54, y: 30 },
  RS: { x: 53, y: 29 },
  HR: { x: 52, y: 30 },
  BY: { x: 54, y: 24 },
  MD: { x: 55, y: 28 },
  RU: { x: 68, y: 20 },
  SA: { x: 61, y: 47 },
  AE: { x: 63, y: 48 },
  TR: { x: 57, y: 33 },
  IR: { x: 63, y: 40 },
  IQ: { x: 61, y: 39 },
  KZ: { x: 66, y: 30 },
  UZ: { x: 66, y: 35 },
  KW: { x: 61, y: 44 },
  QA: { x: 63, y: 47 },
  BH: { x: 62, y: 46 },
  JO: { x: 58, y: 40 },
  LB: { x: 57, y: 38 },
  SY: { x: 58, y: 37 },
  JP: { x: 83, y: 34 },
  KR: { x: 81, y: 36 },
  TW: { x: 80, y: 42 },
  CN: { x: 76, y: 36 },
  MN: { x: 74, y: 27 },
  SG: { x: 78, y: 56 },
  TH: { x: 76, y: 50 },
  VN: { x: 78, y: 50 },
  ID: { x: 79, y: 60 },
  MY: { x: 78, y: 55 },
  PH: { x: 81, y: 51 },
  MM: { x: 74, y: 46 },
  KH: { x: 77, y: 52 },
  IN: { x: 70, y: 46 },
  PK: { x: 67, y: 41 },
  BD: { x: 73, y: 44 },
  LK: { x: 71, y: 52 },
  NP: { x: 71, y: 41 },
  NG: { x: 51, y: 56 },
  ZA: { x: 55, y: 76 },
  KE: { x: 59, y: 60 },
  EG: { x: 57, y: 43 },
  GH: { x: 49, y: 57 },
  ET: { x: 60, y: 56 },
  TZ: { x: 59, y: 64 },
  UG: { x: 58, y: 60 },
  SN: { x: 45, y: 53 },
  CI: { x: 48, y: 57 },
  CM: { x: 52, y: 57 },
  MZ: { x: 58, y: 70 },
  ZM: { x: 57, y: 67 },
  ZW: { x: 57, y: 70 },
  SD: { x: 57, y: 51 },
  DZ: { x: 49, y: 43 },
  MA: { x: 46, y: 40 },
  LY: { x: 52, y: 43 },
  ML: { x: 48, y: 50 },
  NE: { x: 51, y: 50 },
  TD: { x: 54, y: 51 },
  SO: { x: 62, y: 58 },
  AU: { x: 84, y: 70 },
  NZ: { x: 90, y: 78 },
};

// Cross-region connections — major internet traffic routes
const CROSS_REGION_CONNECTIONS: [string, string][] = [
  ['US', 'GB'],
  ['US', 'DE'],
  ['US', 'JP'],
  ['US', 'BR'],
  ['GB', 'DE'],
  ['GB', 'FR'],
  ['GB', 'IN'],
  ['DE', 'RU'],
  ['DE', 'SG'],
  ['JP', 'KR'],
  ['JP', 'SG'],
  ['JP', 'CN'],
  ['SG', 'IN'],
  ['SG', 'AU'],
  ['IN', 'AE'],
  ['IN', 'GB'],
  ['BR', 'DE'],
  ['BR', 'US'],
  ['NG', 'GB'],
  ['ZA', 'GB'],
  ['AU', 'US'],
  ['AU', 'SG'],
  ['AE', 'GB'],
  ['AE', 'SG'],
  ['CN', 'US'],
  ['CN', 'DE'],
];

interface AgentDot {
  id: number;
  country: string;
  x: number;
  y: number;
  intensity: number;
  pulse: boolean;
  dur: number;
  dur2: number;
}

interface Connection {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  intensity: number;
  animDur: number;
  dashOffset: number;
}

function dotColor(intensity: number): string {
  if (intensity > 0.7) return `rgba(59,130,246,${0.5 + intensity * 0.5})`;
  if (intensity > 0.4) return `rgba(96,165,250,${0.4 + intensity * 0.5})`;
  return `rgba(147,197,253,${0.3 + intensity * 0.4})`;
}

function curvedPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.15;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

export function WorldMap({
  active,
  agentCount,
  regions,
}: {
  active: boolean;
  agentCount: number;
  regions?: { regionCode: string; agentPct: number }[];
}) {
  const [dots, setDots] = useState<AgentDot[]>([]);
  const [activeRegions, setActiveRegions] = useState<
    { regionCode: string; agentPct: number; intensity: number }[]
  >([]);

  useEffect(() => {
    if (!active && agentCount === 0) {
      setDots([]);
      setActiveRegions([]);
      return;
    }

    const distribution = regions ?? DEFAULT_REGION_DISTRIBUTION;
    const maxPct = Math.max(...distribution.map((d) => d.agentPct));

    const computed = distribution
      .map((r) => {
        const profile = TRAFFIC_PROFILES[r.regionCode];
        if (!profile) return null;
        return {
          regionCode: r.regionCode,
          agentPct: r.agentPct,
          intensity: r.agentPct / maxPct,
          countries: profile.countries,
        };
      })
      .filter(Boolean) as {
      regionCode: string;
      agentPct: number;
      intensity: number;
      countries: string[];
    }[];

    setActiveRegions(
      computed.map(({ regionCode, agentPct, intensity }) => ({ regionCode, agentPct, intensity })),
    );

    const newDots: AgentDot[] = [];
    let id = 0;

    computed.forEach((region) => {
      const agentsInRegion = Math.round((agentCount || 100) * region.agentPct);
      const dotsCount = Math.max(
        1,
        Math.min(region.countries.length, Math.ceil(agentsInRegion / 40)),
      );
      region.countries
        .filter((c) => COUNTRY_POSITIONS[c])
        .slice(0, dotsCount)
        .forEach((country) => {
          const pos = COUNTRY_POSITIONS[country];
          newDots.push({
            id: id++,
            country,
            x: pos.x + (Math.random() - 0.5) * 1.2,
            y: pos.y + (Math.random() - 0.5) * 1.2,
            intensity: region.intensity,
            pulse: Math.random() > 0.3,
            dur: 1.5 + Math.random() * 1.2,
            dur2: 2.2 + Math.random() * 1,
          });
        });
    });

    setDots(newDots);
  }, [agentCount, active, regions]);

  // Build connections between active dots
  const connections = useMemo<Connection[]>(() => {
    if (dots.length === 0) return [];

    const activeCodes = new Set(dots.map((d) => d.country));
    const lines: Connection[] = [];

    CROSS_REGION_CONNECTIONS.forEach(([a, b]) => {
      if (!activeCodes.has(a) || !activeCodes.has(b)) return;
      const dotA = dots.find((d) => d.country === a);
      const dotB = dots.find((d) => d.country === b);
      if (!dotA || !dotB) return;

      lines.push({
        id: `${a}-${b}`,
        x1: dotA.x,
        y1: dotA.y,
        x2: dotB.x,
        y2: dotB.y,
        intensity: (dotA.intensity + dotB.intensity) / 2,
        animDur: 2 + Math.random() * 3,
        dashOffset: Math.random() * 20,
      });
    });

    // Also connect dots within the same region (nearest neighbor)
    const byRegion: Record<string, AgentDot[]> = {};
    dots.forEach((d) => {
      const region = Object.entries(TRAFFIC_PROFILES).find(([, p]) =>
        p.countries.includes(d.country),
      )?.[0];
      if (region) {
        byRegion[region] = byRegion[region] ?? [];
        byRegion[region].push(d);
      }
    });

    Object.values(byRegion).forEach((regionDots) => {
      if (regionDots.length < 2) return;
      for (let i = 0; i < regionDots.length - 1; i++) {
        const a = regionDots[i];
        const b = regionDots[i + 1];
        const key = `${a.country}-${b.country}`;
        if (lines.find((l) => l.id === key)) return;
        lines.push({
          id: key,
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          intensity: (a.intensity + b.intensity) / 2,
          animDur: 1.5 + Math.random() * 2,
          dashOffset: Math.random() * 15,
        });
      }
    });

    return lines;
  }, [dots]);

  return (
    <div className="relative w-full h-full min-h-[200px] select-none">
      {/* Base map */}
      <img
        src="/world-map.svg"
        alt="World map"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ filter: 'brightness(0) invert(1) sepia(1) saturate(0) opacity(0.1)' }}
        draggable={false}
      />

      {/* Agent + connection overlay */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Animated dash gradient for connections */}
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Connection lines */}
        {connections.map((conn) => {
          const opacity = 0.08 + conn.intensity * 0.18;
          const strokeW = 0.05 + conn.intensity * 0.08;
          const path = curvedPath(conn.x1, conn.y1, conn.x2, conn.y2);
          const dashLen = 3 + conn.intensity * 2;
          const gapLen = 4 + conn.intensity * 3;

          return (
            <g key={conn.id}>
              {/* Static base line */}
              <path
                d={path}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={strokeW}
                opacity={opacity}
                strokeDasharray={`${dashLen} ${gapLen}`}
              />
              {/* Animated travelling packet */}
              <path
                d={path}
                fill="none"
                stroke="#93c5fd"
                strokeWidth={strokeW * 1.5}
                opacity={opacity * 2}
                strokeDasharray={`1.5 ${dashLen + gapLen - 1.5}`}
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from={dashLen + gapLen}
                  to="0"
                  dur={`${conn.animDur}s`}
                  repeatCount="indefinite"
                />
              </path>
            </g>
          );
        })}

        {/* Agent dots */}
        {dots.map((dot) => {
          const r = 0.35 + dot.intensity * 0.45;
          const color = dotColor(dot.intensity);
          return (
            <g key={dot.id}>
              {dot.pulse && (
                <>
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={r}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="0.12"
                  >
                    <animate
                      attributeName="r"
                      from={r}
                      to={r * 5}
                      dur={`${dot.dur}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.5"
                      to="0"
                      dur={`${dot.dur}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={r * 0.5}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="0.08"
                  >
                    <animate
                      attributeName="r"
                      from={r * 0.3}
                      to={r * 7}
                      dur={`${dot.dur2}s`}
                      begin="0.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.3"
                      to="0"
                      dur={`${dot.dur2}s`}
                      begin="0.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </>
              )}
              <circle cx={dot.x} cy={dot.y} r={r * 0.65} fill={color} />
              <circle
                cx={dot.x}
                cy={dot.y}
                r={r * 0.28}
                fill="white"
                opacity={0.5 + dot.intensity * 0.5}
              />
            </g>
          );
        })}

        {/* % labels */}
        {activeRegions
          .sort((a, b) => b.intensity - a.intensity)
          .slice(0, 5)
          .map((region) => {
            const profile = TRAFFIC_PROFILES[region.regionCode];
            const firstCountry = profile?.countries.find((c) => COUNTRY_POSITIONS[c]);
            if (!firstCountry) return null;
            const pos = COUNTRY_POSITIONS[firstCountry];
            return (
              <text
                key={region.regionCode}
                x={pos.x}
                y={pos.y - 1.8}
                fontSize="1.6"
                fill="rgba(148,163,184,0.5)"
                textAnchor="middle"
              >
                {Math.round(region.agentPct * 100)}%
              </text>
            );
          })}
      </svg>

      {/* Legend */}
      {activeRegions.length > 0 && (
        <div className="absolute bottom-1 left-0 right-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {activeRegions
            .sort((a, b) => b.intensity - a.intensity)
            .slice(0, 5)
            .map((r) => {
              const profile = TRAFFIC_PROFILES[r.regionCode];
              return (
                <div key={r.regionCode} className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dotColor(r.intensity) }}
                  />
                  <span className="text-[9px] text-zinc-500 whitespace-nowrap">
                    {profile?.label} · {Math.round(r.agentPct * 100)}%
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
