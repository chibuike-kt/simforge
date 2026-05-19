'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { MetricPoint } from '@/types';
import { formatNumber } from '@/lib/utils';

interface AgentChartProps {
  data: MetricPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 shadow-xl text-xs">
      <p className="text-zinc-500 mb-1">{label}</p>
      <p className="font-semibold text-white tabular-nums">
        {formatNumber(payload[0].value)} agents
      </p>
    </div>
  );
}

export function AgentChart({ data }: AgentChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="agentGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fill: '#71717a', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#71717a', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatNumber}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="agents"
          stroke="#22c55e"
          strokeWidth={1.5}
          fill="url(#agentGradient)"
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0, fill: '#22c55e' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
