'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { X, Terminal, Circle } from 'lucide-react';
import { useRealtime, SimulationEvent } from '@/hooks/use-realtime';
import { cn } from '@/lib/utils';
import { formatMs } from '@/lib/utils';

interface BottomPanelProps {
  open: boolean;
  height: number;
  onHeightChange: (h: number) => void;
  onClose: () => void;
  isSimulating: boolean;
}

const EVENT_COLORS: Record<string, string> = {
  'agent.spawned': 'text-blue-400',
  'agent.completed': 'text-green-400',
  'agent.failed': 'text-red-400',
  'response.received': 'text-zinc-300',
  'action.dlq_sent': 'text-red-400',
  'action.retried': 'text-yellow-400',
  'shard.started': 'text-blue-300',
  'shard.completed': 'text-green-300',
  'worker.started': 'text-purple-400',
};

const EVENT_ICONS: Record<string, string> = {
  'agent.spawned': '⊕',
  'agent.completed': '✓',
  'agent.failed': '✗',
  'response.received': '←',
  'action.dlq_sent': '✗',
  'action.retried': '↺',
  'shard.started': '▶',
  'shard.completed': '■',
  'worker.started': '⚡',
};

export function BottomPanel({
  open,
  height,
  onHeightChange,
  onClose,
  isSimulating,
}: BottomPanelProps) {
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  useRealtime({
    enabled: open,
    onEvent: useCallback(
      (event: SimulationEvent) => {
        if (paused) return;
        setEvents((prev) => {
          const next = [event, ...prev];
          return next.slice(0, 500); // keep last 500 events
        });
      },
      [paused],
    ),
  });

  // Auto scroll to top (newest events at top)
  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events, paused]);

  // Drag to resize
  function onDragStart(e: React.MouseEvent) {
    dragRef.current = { startY: e.clientY, startH: height };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }

  function onDragMove(e: MouseEvent) {
    if (!dragRef.current) return;
    const delta = dragRef.current.startY - e.clientY;
    const newH = Math.max(120, Math.min(600, dragRef.current.startH + delta));
    onHeightChange(newH);
  }

  function onDragEnd() {
    dragRef.current = null;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
  }

  if (!open) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-zinc-800 flex flex-col z-30"
      style={{ height }}
    >
      {/* Drag handle */}
      <div
        className="h-1 cursor-row-resize hover:bg-blue-500/50 transition-colors flex-shrink-0"
        onMouseDown={onDragStart}
      />

      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-zinc-800/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={11} className="text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">Event Stream</span>
          {isSimulating && (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <Circle size={6} className="fill-green-400 animate-pulse" />
              Live
            </span>
          )}
          <span className="text-[10px] text-zinc-600 ml-2">{events.length} events</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused((p) => !p)}
            className={cn(
              'text-[10px] px-2 py-0.5 rounded border transition-all',
              paused
                ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                : 'text-zinc-500 border-zinc-700 hover:text-zinc-300',
            )}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => setEvents([])}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 hover:border-zinc-700 transition-all"
          >
            Clear
          </button>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Event list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-700">
            {isSimulating ? 'Waiting for events...' : 'Start a simulation to see events'}
          </div>
        ) : (
          <table className="w-full">
            <tbody>
              {events.map((event, i) => {
                const color = EVENT_COLORS[event.eventType] ?? 'text-zinc-500';
                const icon = EVENT_ICONS[event.eventType] ?? '·';
                const time = new Date(event.occurredAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  fractionalSecondDigits: 3,
                });

                return (
                  <tr key={i} className="hover:bg-zinc-800/30 border-b border-zinc-800/20">
                    <td className="px-3 py-0.5 text-zinc-700 whitespace-nowrap w-28">{time}</td>
                    <td className={cn('px-2 py-0.5 whitespace-nowrap w-6', color)}>{icon}</td>
                    <td className={cn('px-2 py-0.5 whitespace-nowrap w-52', color)}>
                      {event.eventType}
                    </td>
                    <td className="px-2 py-0.5 text-zinc-600 whitespace-nowrap w-24">
                      {event.countryCode ?? event.regionCode ?? event.workerId?.slice(0, 8) ?? '—'}
                    </td>
                    <td className="px-2 py-0.5 text-zinc-500 whitespace-nowrap w-20">
                      {event.latencyMs ? formatMs(event.latencyMs) : ''}
                    </td>
                    <td className="px-2 py-0.5 text-zinc-500 whitespace-nowrap">
                      {event.statusCode ? `HTTP ${event.statusCode}` : ''}
                      {event.reason ? event.reason : ''}
                      {event.agentId ? `agent:${event.agentId.slice(0, 8)}` : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
