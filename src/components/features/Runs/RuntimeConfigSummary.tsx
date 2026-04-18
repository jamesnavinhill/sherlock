import React from 'react';

interface RuntimeConfigSummaryProps {
  artifactType?: string;
  className?: string;
  hint?: string;
  packName?: string;
  purposeName?: string;
}

export const RuntimeConfigSummary: React.FC<RuntimeConfigSummaryProps> = ({
  artifactType,
  className = 'border border-zinc-800 bg-zinc-950/50 p-4 space-y-3',
  hint,
  packName,
  purposeName,
}) => {
  const badges = [
    packName ? { label: packName, toneClassName: 'osint-pill-graph-2' } : null,
    purposeName ? { label: purposeName, toneClassName: 'osint-pill-graph-3' } : null,
    artifactType ? { label: artifactType, toneClassName: 'osint-pill-graph-1' } : null,
  ].filter((badge): badge is { label: string; toneClassName: string } => !!badge);
  if (badges.length === 0 && !hint) {
    return null;
  }

  return (
    <div className={className}>
      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className={`osint-pill-shape osint-pill-graph px-2 py-1 osint-meta-label-strong ${badge.toneClassName}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      ) : null}
      {hint ? <p className="osint-body-quiet">{hint}</p> : null}
    </div>
  );
};
