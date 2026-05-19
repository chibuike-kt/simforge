'use client';

import { useEffect, useState } from 'react';

// Approximate % positions on the 2000x857 simplemaps viewbox
const AGENT_SPAWN_POINTS: Record<string, { x: number; y: number; label: string }> = {
  US: { x: 18, y: 38, label: 'United States' },
  CA: { x: 16, y: 28, label: 'Canada' },
  MX: { x: 19, y: 50, label: 'Mexico' },
  BR: { x: 36, y: 65, label: 'Brazil' },
  AR: { x: 34, y: 78, label: 'Argentina' },
  CO: { x: 28, y: 57, label: 'Colombia' },
  PE: { x: 28, y: 65, label: 'Peru' },
  GB: { x: 46, y: 28, label: 'United Kingdom' },
  FR: { x: 48, y: 32, label: 'France' },
  DE: { x: 50, y: 29, label: 'Germany' },
  RU: { x: 65, y: 22, label: 'Russia' },
  CN: { x: 76, y: 38, label: 'China' },
  IN: { x: 70, y: 48, label: 'India' },
  JP: { x: 84, y: 36, label: 'Japan' },
  AU: { x: 84, y: 70, label: 'Australia' },
  ZA: { x: 56, y: 73, label: 'South Africa' },
  NG: { x: 51, y: 56, label: 'Nigeria' },
  EG: { x: 56, y: 44, label: 'Egypt' },
  SA: { x: 61, y: 47, label: 'Saudi Arabia' },
  KR: { x: 82, y: 37, label: 'South Korea' },
};

interface Agent {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  pulse: boolean;
  label: string;
}

export function WorldMap({ active, agentCount }: { active: boolean; agentCount: number }) {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    if (!active && agentCount === 0) {
      setAgents([]);
      return;
    }

    const points = Object.values(AGENT_SPAWN_POINTS);
    const count = Math.min(agentCount || points.length, points.length);
    const selected = [...points].sort(() => Math.random() - 0.5).slice(0, count);

    const newAgents: Agent[] = selected.map((point, i) => ({
      id: i,
      x: point.x + (Math.random() - 0.5) * 2,
      y: point.y + (Math.random() - 0.5) * 2,
      size: 3 + Math.random() * 2,
      opacity: 0.7 + Math.random() * 0.3,
      pulse: Math.random() > 0.3,
      label: point.label,
    }));

    setAgents(newAgents);
  }, [agentCount, active]);

  return (
    <div className="relative w-full h-full min-h-[200px]">
      {/* Map base image */}
      <img
        src="/world-map.svg"
        alt="World map"
        className="absolute inset-0 w-full h-full object-contain"
        style={{
          filter: 'brightness(0) invert(1) sepia(1) saturate(0.3) hue-rotate(180deg) opacity(0.15)',
        }}
        draggable={false}
      />

      {/* Agent overlay SVG */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {agents.map((agent) => (
          <g key={agent.id}>
            {agent.pulse && (
              <>
                <circle
                  cx={agent.x}
                  cy={agent.y}
                  r={agent.size * 0.5}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="0.2"
                  opacity="0"
                >
                  <animate
                    attributeName="r"
                    from={agent.size * 0.4}
                    to={agent.size * 1.8}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.6"
                    to="0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={agent.x}
                  cy={agent.y}
                  r={agent.size * 0.5}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="0.15"
                  opacity="0"
                >
                  <animate
                    attributeName="r"
                    from={agent.size * 0.4}
                    to={agent.size * 2.5}
                    dur="2s"
                    begin="0.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.4"
                    to="0"
                    dur="2s"
                    begin="0.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}
            <circle
              cx={agent.x}
              cy={agent.y}
              r={agent.size * 0.3}
              fill="#3b82f6"
              opacity={agent.opacity}
            />
            <circle cx={agent.x} cy={agent.y} r={agent.size * 0.15} fill="#93c5fd" opacity="0.9" />
          </g>
        ))}
      </svg>
    </div>
  );
}
