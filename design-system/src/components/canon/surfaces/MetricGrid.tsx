import type { ReactNode } from 'react';

export interface MetricGridProps {
  items: Array<{ label: string; value: ReactNode }>;
}

export function MetricGrid({ items }: MetricGridProps) {
  return (
    <div className="ds-token-pairs">
      {items.map((item) => (
        <div key={item.label}>
          <div className="ds-meta-label">{item.label}</div>
          <div className="ds-meta-value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
