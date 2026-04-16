import type { ReactNode } from 'react';

import { Eyebrow, MetaValue } from '../typography';

export interface MetricGridProps {
  items: Array<{ label: string; value: ReactNode }>;
}

export function MetricGrid({ items }: MetricGridProps) {
  return (
    <div className="ds-token-pairs">
      {items.map((item) => (
        <div key={item.label}>
          <Eyebrow as="div">{item.label}</Eyebrow>
          <MetaValue as="div">{item.value}</MetaValue>
        </div>
      ))}
    </div>
  );
}
