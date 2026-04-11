import React from 'react';

interface MainContentDotGridProps {
  className?: string;
  testId?: string;
}

export const MainContentDotGrid: React.FC<MainContentDotGridProps> = ({
  className = '',
  testId,
}) => (
  <div
    data-testid={testId}
    className={`absolute inset-0 pointer-events-none ${className}`.trim()}
    style={{
      opacity: 'var(--osint-main-bg-dot-opacity, 0.2)',
      backgroundImage:
        'var(--osint-main-bg-image, radial-gradient(color-mix(in oklab, var(--osint-ink) 26%, var(--osint-border)) 1px, transparent 1px))',
      backgroundSize: '20px 20px',
    }}
  />
);
