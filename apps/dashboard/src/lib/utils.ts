import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RunStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getStatusColor(status: RunStatus): string {
  switch (status) {
    case 'running':
      return 'text-blue-400';
    case 'completed':
      return 'text-green-400';
    case 'failed':
      return 'text-red-400';
    case 'cancelled':
      return 'text-zinc-400';
    case 'approved':
      return 'text-yellow-400';
    case 'dispatched':
      return 'text-purple-400';
    case 'pending':
      return 'text-zinc-400';
    default:
      return 'text-zinc-400';
  }
}

export function getStatusBg(status: RunStatus): string {
  switch (status) {
    case 'running':
      return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
    case 'completed':
      return 'bg-green-400/10 text-green-400 border-green-400/20';
    case 'failed':
      return 'bg-red-400/10 text-red-400 border-red-400/20';
    case 'cancelled':
      return 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20';
    case 'approved':
      return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
    case 'dispatched':
      return 'bg-purple-400/10 text-purple-400 border-purple-400/20';
    case 'pending':
      return 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20';
    default:
      return 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20';
  }
}
