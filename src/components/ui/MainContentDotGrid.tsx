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
    className={`absolute inset-0 pointer-events-none opacity-20 ${className}`.trim()}
    style={{
      backgroundImage: 'radial-gradient(#52525b 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    }}
  />
);
