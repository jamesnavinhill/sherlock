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
  const badges = [packName, purposeName, artifactType].filter(Boolean);
  if (badges.length === 0 && !hint) {
    return null;
  }

  return (
    <div className={className}>
      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="px-2 py-1 border border-zinc-700 osint-meta-label-strong text-zinc-300"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}
      {hint ? <p className="osint-body-quiet">{hint}</p> : null}
    </div>
  );
};
