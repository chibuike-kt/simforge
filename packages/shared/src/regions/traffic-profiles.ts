import { RegionTrafficProfile } from '../types/simulation.types';

export const TRAFFIC_PROFILES: Record<string, RegionTrafficProfile> = {
  NA_WEST: {
    code: 'NA_WEST',
    label: 'North America West',
    countries: ['US', 'CA'],
    rpsWeight: 0.18,
    latency: { p50: 25, p95: 60, p99: 120, jitter: 5 },
    connection: {
      timeoutRate: 0.001,
      retryRate: 0.01,
      packetLossRate: 0.0005,
      keepAlive: true,
      http2: true,
    },
    device: { mobilePct: 0.38, desktopPct: 0.58, botPct: 0.04 },
    userAgents: [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    ],
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  },

  NA_EAST: {
    code: 'NA_EAST',
    label: 'North America East',
    countries: ['US', 'CA', 'MX'],
    rpsWeight: 0.15,
    latency: { p50: 20, p95: 55, p99: 100, jitter: 4 },
    connection: {
      timeoutRate: 0.001,
      retryRate: 0.01,
      packetLossRate: 0.0005,
      keepAlive: true,
      http2: true,
    },
    device: { mobilePct: 0.4, desktopPct: 0.56, botPct: 0.04 },
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36',
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ],
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  },

  EU_WEST: {
    code: 'EU_WEST',
    label: 'Western Europe',
    countries: ['GB', 'FR', 'DE', 'NL', 'BE', 'IE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI'],
    rpsWeight: 0.22,
    latency: { p50: 18, p95: 45, p99: 90, jitter: 4 },
    connection: {
      timeoutRate: 0.001,
      retryRate: 0.008,
      packetLossRate: 0.0003,
      keepAlive: true,
      http2: true,
    },
    device: { mobilePct: 0.45, desktopPct: 0.52, botPct: 0.03 },
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    ],
    headers: {
      'Accept-Language': 'en-GB,en;q=0.9,fr;q=0.8,de;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      DNT: '1',
    },
  },

  EU_EAST: {
    code: 'EU_EAST',
    label: 'Eastern Europe',
    countries: ['PL', 'UA', 'RO', 'CZ', 'HU', 'SK', 'BG', 'RS', 'HR', 'BY', 'MD'],
    rpsWeight: 0.08,
    latency: { p50: 35, p95: 90, p99: 180, jitter: 12 },
    connection: {
      timeoutRate: 0.005,
      retryRate: 0.03,
      packetLossRate: 0.002,
      keepAlive: true,
      http2: false,
    },
    device: { mobilePct: 0.52, desktopPct: 0.45, botPct: 0.03 },
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ],
    headers: {
      'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  },

  ASIA_EAST: {
    code: 'ASIA_EAST',
    label: 'East Asia',
    countries: ['JP', 'KR', 'TW'],
    rpsWeight: 0.12,
    latency: { p50: 15, p95: 40, p99: 80, jitter: 3 },
    connection: {
      timeoutRate: 0.0008,
      retryRate: 0.005,
      packetLossRate: 0.0002,
      keepAlive: true,
      http2: true,
    },
    device: { mobilePct: 0.55, desktopPct: 0.43, botPct: 0.02 },
    userAgents: [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
    headers: {
      'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  },

  ASIA_SE: {
    code: 'ASIA_SE',
    label: 'Southeast Asia',
    countries: ['SG', 'TH', 'VN', 'ID', 'MY', 'PH', 'MM', 'KH', 'LA'],
    rpsWeight: 0.09,
    latency: { p50: 65, p95: 160, p99: 320, jitter: 25 },
    connection: {
      timeoutRate: 0.012,
      retryRate: 0.06,
      packetLossRate: 0.008,
      keepAlive: false,
      http2: false,
    },
    device: { mobilePct: 0.72, desktopPct: 0.26, botPct: 0.02 },
    userAgents: [
      'Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 12; SAMSUNG SM-A325F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    ],
    headers: {
      'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  },

  ASIA_SOUTH: {
    code: 'ASIA_SOUTH',
    label: 'South Asia',
    countries: ['IN', 'PK', 'BD', 'LK', 'NP'],
    rpsWeight: 0.1,
    latency: { p50: 80, p95: 220, p99: 450, jitter: 40 },
    connection: {
      timeoutRate: 0.018,
      retryRate: 0.08,
      packetLossRate: 0.012,
      keepAlive: false,
      http2: false,
    },
    device: { mobilePct: 0.78, desktopPct: 0.2, botPct: 0.02 },
    userAgents: [
      'Mozilla/5.0 (Linux; Android 12; Redmi 10C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 11; Infinix X688B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 10; Nokia 5.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ],
    headers: {
      'Accept-Language': 'hi-IN,hi;q=0.9,en-IN;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  },

  ASIA_CENTRAL: {
    code: 'ASIA_CENTRAL',
    label: 'Middle East & Central Asia',
    countries: ['SA', 'AE', 'TR', 'IR', 'IQ', 'KZ', 'UZ', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'SY'],
    rpsWeight: 0.05,
    latency: { p50: 55, p95: 140, p99: 280, jitter: 20 },
    connection: {
      timeoutRate: 0.008,
      retryRate: 0.04,
      packetLossRate: 0.004,
      keepAlive: true,
      http2: false,
    },
    device: { mobilePct: 0.65, desktopPct: 0.33, botPct: 0.02 },
    userAgents: [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
    headers: {
      'Accept-Language': 'ar-SA,ar;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  },

  AFRICA: {
    code: 'AFRICA',
    label: 'Africa',
    countries: ['NG', 'ZA', 'KE', 'EG', 'GH', 'ET', 'TZ', 'UG', 'SN', 'CI', 'CM', 'MZ', 'ZM', 'ZW'],
    rpsWeight: 0.04,
    latency: { p50: 120, p95: 350, p99: 700, jitter: 60 },
    connection: {
      timeoutRate: 0.025,
      retryRate: 0.12,
      packetLossRate: 0.02,
      keepAlive: false,
      http2: false,
    },
    device: { mobilePct: 0.82, desktopPct: 0.16, botPct: 0.02 },
    userAgents: [
      'Mozilla/5.0 (Linux; Android 10; Tecno KF6i) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 9; Itel A56) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 11; TECNO Spark 8C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ],
    headers: {
      'Accept-Language': 'en-NG,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate',
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
    },
  },

  LATAM: {
    code: 'LATAM',
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
    rpsWeight: 0.06,
    latency: { p50: 70, p95: 180, p99: 360, jitter: 30 },
    connection: {
      timeoutRate: 0.01,
      retryRate: 0.05,
      packetLossRate: 0.006,
      keepAlive: true,
      http2: false,
    },
    device: { mobilePct: 0.68, desktopPct: 0.3, botPct: 0.02 },
    userAgents: [
      'Mozilla/5.0 (Linux; Android 13; Moto G84 5G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 12; Redmi 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
    headers: {
      'Accept-Language': 'pt-BR,pt;q=0.9,es;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  },

  OCEANIA: {
    code: 'OCEANIA',
    label: 'Oceania',
    countries: ['AU', 'NZ', 'PG', 'FJ'],
    rpsWeight: 0.03,
    latency: { p50: 30, p95: 80, p99: 150, jitter: 8 },
    connection: {
      timeoutRate: 0.002,
      retryRate: 0.015,
      packetLossRate: 0.001,
      keepAlive: true,
      http2: true,
    },
    device: { mobilePct: 0.48, desktopPct: 0.5, botPct: 0.02 },
    userAgents: [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
    headers: {
      'Accept-Language': 'en-AU,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  },
};

// Default distribution — mirrors real internet traffic
export const DEFAULT_REGION_DISTRIBUTION: { regionCode: string; agentPct: number }[] = [
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
