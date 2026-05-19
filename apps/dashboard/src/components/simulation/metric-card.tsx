'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accent?: boolean;
  icon?: React.ReactNode;
  live?: boolean;
}

export function MetricCard({
  label,
  value,
  subValue,
  trend,
  trendValue,
  accent,
  icon,
  live,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 relative overflow-hidden transition-all',
        accent ? 'bg-blue-500/5 border-blue-500/20' : 'bg-zinc-900 border-zinc-800',
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
        <div className="flex items-center gap-2">
          {live && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-green-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
              </span>
              LIVE
            </span>
          )}
          {icon && <div className="text-zinc-600">{icon}</div>}
        </div>
      </div>

      {/* Value */}
      <div className="space-y-1">
        <p
          className={cn(
            'text-2xl font-semibold tracking-tight tabular-nums',
            accent ? 'text-blue-400' : 'text-white',
          )}
        >
          {value}
        </p>

        {(subValue || trend) && (
          <div className="flex items-center gap-2">
            {trend && trendValue && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  trend === 'up'
                    ? 'text-green-400'
                    : trend === 'down'
                      ? 'text-red-400'
                      : 'text-zinc-500',
                )}
              >
                {trend === 'up' ? (
                  <TrendingUp size={11} />
                ) : trend === 'down' ? (
                  <TrendingDown size={11} />
                ) : (
                  <Minus size={11} />
                )}
                {trendValue}
              </span>
            )}
            {subValue && <span className="text-xs text-zinc-600">{subValue}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
