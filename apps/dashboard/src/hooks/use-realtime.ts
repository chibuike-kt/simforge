'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface SimulationEvent {
  eventType: string;
  workerId: string;
  occurredAt: string;
  runId?: string;
  agentId?: string;
  regionCode?: string;
  countryCode?: string;
  latencyMs?: number;
  actualLatencyMs?: number;
  regionLatencyMs?: number;
  statusCode?: number;
  nodeId?: string;
  shardId?: string;
  completed?: number;
  failed?: number;
  agentCount?: number;
  reason?: string;
  retryCount?: number;
  error?: string;
  behaviorModelId?: string;
  label?: string;
}

export interface RealtimeMetrics {
  rps: number;
  activeAgents: number;
  totalRequests: number;
  totalErrors: number;
  p50: number;
  p95: number;
  regionBreakdown: Record<string, number>; // regionCode -> agent count
  countryBreakdown: Record<string, number>; // countryCode -> request count
}

interface UseRealtimeOptions {
  runId?: string;
  onEvent?: (event: SimulationEvent) => void;
  enabled?: boolean;
}

export function useRealtime({ runId, onEvent, enabled = true }: UseRealtimeOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    rps: 0,
    activeAgents: 0,
    totalRequests: 0,
    totalErrors: 0,
    p50: 0,
    p95: 0,
    regionBreakdown: {},
    countryBreakdown: {},
  });

  // Rolling latency window for p50/p95 calculation
  const latencyWindowRef = useRef<number[]>([]);
  const rpsWindowRef = useRef<{ ts: number }[]>([]);

  const processEvent = useCallback(
    (event: SimulationEvent) => {
      onEvent?.(event);

      setMetrics((prev) => {
        const next = { ...prev };

        switch (event.eventType) {
          case 'agent.spawned': {
            next.activeAgents = prev.activeAgents + 1;
            // Track region breakdown
            if (event.regionCode) {
              next.regionBreakdown = {
                ...prev.regionBreakdown,
                [event.regionCode]: (prev.regionBreakdown[event.regionCode] ?? 0) + 1,
              };
            }
            break;
          }

          case 'agent.completed':
          case 'agent.failed': {
            next.activeAgents = Math.max(0, prev.activeAgents - 1);
            break;
          }

          case 'response.received': {
            next.totalRequests = prev.totalRequests + 1;

            // Track country breakdown
            if (event.countryCode) {
              next.countryBreakdown = {
                ...prev.countryBreakdown,
                [event.countryCode]: (prev.countryBreakdown[event.countryCode] ?? 0) + 1,
              };
            }

            // Update latency window
            if (event.latencyMs) {
              latencyWindowRef.current.push(event.latencyMs);
              if (latencyWindowRef.current.length > 200) {
                latencyWindowRef.current.shift();
              }
              const sorted = [...latencyWindowRef.current].sort((a, b) => a - b);
              const p50idx = Math.floor(sorted.length * 0.5);
              const p95idx = Math.floor(sorted.length * 0.95);
              next.p50 = sorted[p50idx] ?? 0;
              next.p95 = sorted[p95idx] ?? 0;
            }

            // Update RPS window
            const now = Date.now();
            rpsWindowRef.current.push({ ts: now });
            rpsWindowRef.current = rpsWindowRef.current.filter((r) => now - r.ts < 1000);
            next.rps = rpsWindowRef.current.length;
            break;
          }

          case 'action.dlq_sent': {
            next.totalErrors = prev.totalErrors + 1;
            break;
          }

          case 'shard.completed': {
            next.activeAgents = 0;
            break;
          }
        }

        return next;
      });
    },
    [onEvent],
  );

  useEffect(() => {
    if (!enabled) return;

    const socket = io(`${WS_URL}/realtime`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Realtime] Connected:', socket.id);

      // Watch specific run if provided
      if (runId) {
        socket.emit('watch:run', { runId });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Realtime] Disconnected');
    });

    socket.on('simulation:event', processEvent);

    socket.on('watch:run:ack', (data: { runId: string; status: string }) => {
      console.log(`[Realtime] Watching run ${data.runId}`);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Realtime] Connection error:', err.message);
    });

    return () => {
      if (runId) socket.emit('unwatch:run', { runId });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled, runId, processEvent]);

  const watchRun = useCallback((id: string) => {
    socketRef.current?.emit('watch:run', { runId: id });
  }, []);

  const unwatchRun = useCallback((id: string) => {
    socketRef.current?.emit('unwatch:run', { runId: id });
  }, []);

  const resetMetrics = useCallback(() => {
    latencyWindowRef.current = [];
    rpsWindowRef.current = [];
    setMetrics({
      rps: 0,
      activeAgents: 0,
      totalRequests: 0,
      totalErrors: 0,
      p50: 0,
      p95: 0,
      regionBreakdown: {},
      countryBreakdown: {},
    });
  }, []);

  return {
    connected,
    metrics,
    watchRun,
    unwatchRun,
    resetMetrics,
  };
}
