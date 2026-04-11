import React from 'react';

interface SystemStatusBeaconProps {
  active: boolean;
  activeLabel?: string;
  idleLabel?: string;
  dotTestId?: string;
}

const DOT_DELAYS = [0, 120, 240];

export const SystemStatusBeacon: React.FC<SystemStatusBeaconProps> = ({
  active,
  activeLabel = 'SCANNING_NETWORK',
  idleLabel = 'SYSTEM_IDLE',
  dotTestId,
}) => (
  <div className="text-center">
    <div className="mb-3 flex items-center justify-center gap-2">
      {DOT_DELAYS.map((delay) => (
        <span
          key={delay}
          data-testid={dotTestId}
          className={`h-2 w-2 rounded-none bg-osint-primary ${active ? 'animate-pulse' : ''}`}
          style={active ? { animationDelay: `${delay}ms` } : undefined}
        />
      ))}
    </div>
    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-300">
      {active ? activeLabel : idleLabel}
    </span>
  </div>
);
