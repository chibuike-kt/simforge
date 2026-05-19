'use client';

import { useEffect, useRef, useState } from 'react';

interface AgentNode {
  id: string;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  age: number;
  region: string;
}

interface Connection {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  opacity: number;
}

// Approximate world regions as x/y percentages on a flat map
const REGIONS = [
  { name: 'us-east', x: 22, y: 38 },
  { name: 'us-west', x: 12, y: 35 },
  { name: 'us-central', x: 18, y: 36 },
  { name: 'eu-west', x: 46, y: 28 },
  { name: 'eu-central', x: 50, y: 26 },
  { name: 'eu-north', x: 50, y: 20 },
  { name: 'ap-south', x: 68, y: 48 },
  { name: 'ap-southeast', x: 76, y: 52 },
  { name: 'ap-northeast', x: 82, y: 32 },
  { name: 'sa-east', x: 28, y: 62 },
  { name: 'af-south', x: 52, y: 62 },
  { name: 'me-south', x: 60, y: 42 },
];

// Simplified world landmass paths (SVG path data)
const LAND_PATHS = [
  // North America
  'M 8,20 L 12,18 L 18,16 L 24,18 L 28,22 L 30,28 L 28,35 L 24,40 L 20,42 L 16,40 L 12,36 L 8,30 L 6,24 Z',
  // South America
  'M 22,45 L 28,44 L 32,48 L 34,55 L 32,65 L 28,72 L 24,70 L 20,62 L 20,52 Z',
  // Europe
  'M 44,18 L 50,16 L 56,18 L 58,24 L 54,30 L 50,32 L 46,30 L 42,24 Z',
  // Africa
  'M 46,34 L 54,32 L 60,36 L 62,46 L 60,58 L 54,66 L 48,64 L 44,56 L 42,46 L 44,38 Z',
  // Asia
  'M 56,16 L 68,14 L 80,18 L 88,24 L 86,34 L 80,40 L 72,42 L 64,40 L 58,34 L 54,26 Z',
  // Australia
  'M 76,58 L 84,56 L 88,62 L 86,68 L 80,70 L 74,66 L 72,60 Z',
];

interface WorldMapProps {
  active?: boolean;
  agentCount?: number;
}

export function WorldMap({ active = false, agentCount = 0 }: WorldMapProps) {
  const [nodes, setNodes] = useState<AgentNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const frameRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setNodes([]);
      setConnections([]);
      return;
    }

    let running = true;

    function tick(timestamp: number) {
      if (!running) return;

      setNodes((prev) => {
        const updated = prev
          .map((n) => ({
            ...n,
            age: n.age + 1,
            opacity: n.age < 10 ? n.age / 10 : n.age > 60 ? Math.max(0, n.opacity - 0.02) : 0.7,
            scale: n.age < 10 ? 0.5 + (n.age / 10) * 0.5 : 1,
          }))
          .filter((n) => n.opacity > 0);

        // Spawn new nodes based on agent count
        const spawnRate = Math.max(200, 2000 - agentCount / 10);
        if (timestamp - lastSpawnRef.current > spawnRate && updated.length < 40) {
          lastSpawnRef.current = timestamp;
          const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
          const jitter = () => (Math.random() - 0.5) * 6;
          const newNode: AgentNode = {
            id: `${Date.now()}-${Math.random()}`,
            x: region.x + jitter(),
            y: region.y + jitter(),
            opacity: 0,
            scale: 0.5,
            age: 0,
            region: region.name,
          };

          // Occasionally add a connection between two random nodes
          if (updated.length > 1 && Math.random() > 0.6) {
            const from = updated[Math.floor(Math.random() * updated.length)];
            setConnections((prev) => [
              ...prev.filter((c) => c.opacity > 0),
              {
                id: `${Date.now()}`,
                x1: from.x,
                y1: from.y,
                x2: newNode.x,
                y2: newNode.y,
                progress: 0,
                opacity: 0.6,
              },
            ]);
          }

          return [...updated, newNode];
        }

        return updated;
      });

      setConnections((prev) =>
        prev
          .map((c) => ({
            ...c,
            progress: Math.min(1, c.progress + 0.04),
            opacity: c.progress > 0.8 ? c.opacity - 0.03 : c.opacity,
          }))
          .filter((c) => c.opacity > 0),
      );

      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [active, agentCount]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg viewBox="0 0 100 80" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[...Array(10)].map((_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={(i + 1) * 8}
            x2="100"
            y2={(i + 1) * 8}
            stroke="#27272a"
            strokeWidth="0.2"
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <line
            key={`v${i}`}
            x1={(i + 1) * 8}
            y1="0"
            x2={(i + 1) * 8}
            y2="80"
            stroke="#27272a"
            strokeWidth="0.2"
          />
        ))}

        {/* Land masses */}
        {LAND_PATHS.map((d, i) => (
          <path key={i} d={d} fill="#27272a" stroke="#3f3f46" strokeWidth="0.3" />
        ))}

        {/* Region dots (always visible, dimmed when inactive) */}
        {REGIONS.map((region) => (
          <circle
            key={region.name}
            cx={region.x}
            cy={region.y}
            r="0.6"
            fill={active ? '#3b82f6' : '#3f3f46'}
            opacity={active ? 0.4 : 0.3}
          />
        ))}

        {/* Connections */}
        {connections.map((conn) => {
          const currentX = conn.x1 + (conn.x2 - conn.x1) * conn.progress;
          const currentY = conn.y1 + (conn.y2 - conn.y1) * conn.progress;
          return (
            <g key={conn.id} opacity={conn.opacity}>
              <line
                x1={conn.x1}
                y1={conn.y1}
                x2={currentX}
                y2={currentY}
                stroke="#3b82f6"
                strokeWidth="0.3"
              />
              <circle cx={currentX} cy={currentY} r="0.5" fill="#3b82f6" />
            </g>
          );
        })}

        {/* Agent spawn nodes */}
        {nodes.map((node) => (
          <g key={node.id} opacity={node.opacity}>
            {/* Ripple */}
            <circle
              cx={node.x}
              cy={node.y}
              r={1.5 * node.scale}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.3"
              opacity={0.3}
            />
            {/* Core dot */}
            <circle cx={node.x} cy={node.y} r={0.6 * node.scale} fill="#3b82f6" />
          </g>
        ))}
      </svg>

      {/* Overlay label */}
      {active && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400" />
          </span>
          <span className="text-[10px] font-medium text-zinc-500">
            {agentCount.toLocaleString()} agents active
          </span>
        </div>
      )}

      {!active && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-zinc-600">No active simulation</p>
        </div>
      )}
    </div>
  );
}
