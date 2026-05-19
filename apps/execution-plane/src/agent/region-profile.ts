import { SeededRandom } from './seeded-random';

export interface RegionProfile {
  regionCode: string;
  countryCode: string;
  label: string;
  p50: number;
  p95: number;
  jitterMs: number;
  packetLossRate: number;
  retryRate: number;
  timeoutRate: number;
  keepAlive: boolean;
  http2: boolean;
  userAgents: string[];
  headers: Record<string, string>;
}

// Full profile data per region
const REGION_DATA: Record<
  string,
  {
    label: string;
    countries: string[];
    p50: number;
    p95: number;
    jitterMs: number;
    packetLossRate: number;
    retryRate: number;
    timeoutRate: number;
    keepAlive: boolean;
    http2: boolean;
    userAgents: string[];
    headers: Record<string, string>;
  }
> = {
  NA_WEST: {
    label: 'N. America West',
    countries: ['US', 'CA'],
    p50: 25,
    p95: 60,
    jitterMs: 5,
    packetLossRate: 0.0005,
    retryRate: 0.01,
    timeoutRate: 0.001,
    keepAlive: true,
    http2: true,
    userAgents: [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    ],
    headers: { 'Accept-Language': 'en-US,en;q=0.9', 'Accept-Encoding': 'gzip, deflate, br' },
  },
  NA_EAST: {
    label: 'N. America East',
    countries: ['US', 'CA', 'MX'],
    p50: 20,
    p95: 55,
    jitterMs: 4,
    packetLossRate: 0.0005,
    retryRate: 0.01,
    timeoutRate: 0.001,
    keepAlive: true,
    http2: true,
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ],
    headers: { 'Accept-Language': 'en-US,en;q=0.9', 'Accept-Encoding': 'gzip, deflate, br' },
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
    p50: 18,
    p95: 45,
    jitterMs: 4,
    packetLossRate: 0.0003,
    retryRate: 0.008,
    timeoutRate: 0.001,
    keepAlive: true,
    http2: true,
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    ],
    headers: {
      'Accept-Language': 'en-GB,en;q=0.9,fr;q=0.8,de;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      DNT: '1',
    },
  },
  EU_EAST: {
    label: 'Eastern Europe',
    countries: ['PL', 'UA', 'RO', 'CZ', 'HU', 'SK', 'BG', 'RS', 'HR', 'BY', 'MD'],
    p50: 35,
    p95: 90,
    jitterMs: 12,
    packetLossRate: 0.002,
    retryRate: 0.03,
    timeoutRate: 0.005,
    keepAlive: true,
    http2: false,
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ],
    headers: { 'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8', 'Accept-Encoding': 'gzip, deflate' },
  },
  ASIA_EAST: {
    label: 'East Asia',
    countries: ['JP', 'KR', 'TW', 'CN', 'MN'],
    p50: 15,
    p95: 40,
    jitterMs: 3,
    packetLossRate: 0.0002,
    retryRate: 0.005,
    timeoutRate: 0.0008,
    keepAlive: true,
    http2: true,
    userAgents: [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ],
    headers: {
      'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  },
  ASIA_SE: {
    label: 'Southeast Asia',
    countries: ['SG', 'TH', 'VN', 'ID', 'MY', 'PH', 'MM', 'KH'],
    p50: 65,
    p95: 160,
    jitterMs: 25,
    packetLossRate: 0.008,
    retryRate: 0.06,
    timeoutRate: 0.012,
    keepAlive: false,
    http2: false,
    userAgents: [
      'Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 12; SAMSUNG SM-A325F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
    ],
    headers: { 'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8', 'Accept-Encoding': 'gzip, deflate' },
  },
  ASIA_SOUTH: {
    label: 'South Asia',
    countries: ['IN', 'PK', 'BD', 'LK', 'NP'],
    p50: 80,
    p95: 220,
    jitterMs: 40,
    packetLossRate: 0.012,
    retryRate: 0.08,
    timeoutRate: 0.018,
    keepAlive: false,
    http2: false,
    userAgents: [
      'Mozilla/5.0 (Linux; Android 12; Redmi 10C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 11; Infinix X688B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ],
    headers: {
      'Accept-Language': 'hi-IN,hi;q=0.9,en-IN;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate',
    },
  },
  ASIA_CENTRAL: {
    label: 'Middle East & Central Asia',
    countries: ['SA', 'AE', 'TR', 'IR', 'IQ', 'KZ', 'UZ', 'KW', 'QA', 'BH', 'JO', 'LB', 'SY'],
    p50: 55,
    p95: 140,
    jitterMs: 20,
    packetLossRate: 0.004,
    retryRate: 0.04,
    timeoutRate: 0.008,
    keepAlive: true,
    http2: false,
    userAgents: [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ],
    headers: { 'Accept-Language': 'ar-SA,ar;q=0.9,en;q=0.8', 'Accept-Encoding': 'gzip, deflate' },
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
    p50: 120,
    p95: 350,
    jitterMs: 60,
    packetLossRate: 0.02,
    retryRate: 0.12,
    timeoutRate: 0.025,
    keepAlive: false,
    http2: false,
    userAgents: [
      'Mozilla/5.0 (Linux; Android 10; Tecno KF6i) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 9; Itel A56) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ],
    headers: { 'Accept-Language': 'en-NG,en;q=0.9', 'Accept-Encoding': 'gzip, deflate' },
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
    p50: 70,
    p95: 180,
    jitterMs: 30,
    packetLossRate: 0.006,
    retryRate: 0.05,
    timeoutRate: 0.01,
    keepAlive: true,
    http2: false,
    userAgents: [
      'Mozilla/5.0 (Linux; Android 13; Moto G84 5G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
    headers: {
      'Accept-Language': 'pt-BR,pt;q=0.9,es;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate',
    },
  },
  OCEANIA: {
    label: 'Oceania',
    countries: ['AU', 'NZ'],
    p50: 30,
    p95: 80,
    jitterMs: 8,
    packetLossRate: 0.001,
    retryRate: 0.015,
    timeoutRate: 0.002,
    keepAlive: true,
    http2: true,
    userAgents: [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    ],
    headers: { 'Accept-Language': 'en-AU,en;q=0.9', 'Accept-Encoding': 'gzip, deflate, br' },
  },
};

const DEFAULT_DISTRIBUTION: { regionCode: string; agentPct: number }[] = [
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

/**
 * Pick a region for an agent based on distribution weights.
 * Uses a seeded random so runs are deterministic.
 */
export function pickRegionProfile(
  rng: SeededRandom,
  distribution?: { regionCode: string; agentPct: number }[],
): RegionProfile {
  const dist = distribution ?? DEFAULT_DISTRIBUTION;
  const roll = rng.next();
  let cumulative = 0;

  for (const entry of dist) {
    cumulative += entry.agentPct;
    if (roll <= cumulative) {
      const data = REGION_DATA[entry.regionCode];
      if (!data) continue;
      // Pick a random country from the region
      const countryCode = data.countries[Math.floor(rng.next() * data.countries.length)];
      return {
        regionCode: entry.regionCode,
        countryCode,
        label: data.label,
        p50: data.p50,
        p95: data.p95,
        jitterMs: data.jitterMs,
        packetLossRate: data.packetLossRate,
        retryRate: data.retryRate,
        timeoutRate: data.timeoutRate,
        keepAlive: data.keepAlive,
        http2: data.http2,
        userAgents: data.userAgents,
        headers: data.headers,
      };
    }
  }

  // Fallback to NA_WEST
  const fallback = REGION_DATA['NA_WEST'];
  return {
    regionCode: 'NA_WEST',
    countryCode: 'US',
    label: fallback.label,
    p50: fallback.p50,
    p95: fallback.p95,
    jitterMs: fallback.jitterMs,
    packetLossRate: fallback.packetLossRate,
    retryRate: fallback.retryRate,
    timeoutRate: fallback.timeoutRate,
    keepAlive: fallback.keepAlive,
    http2: fallback.http2,
    userAgents: fallback.userAgents,
    headers: fallback.headers,
  };
}

/**
 * Build region-specific request headers for a given profile.
 */
export function applyRegionProfile(
  profile: RegionProfile,
  rng: SeededRandom,
): Record<string, string> {
  const ua = profile.userAgents[Math.floor(rng.next() * profile.userAgents.length)];
  return {
    'User-Agent': ua,
    ...profile.headers,
  };
}
