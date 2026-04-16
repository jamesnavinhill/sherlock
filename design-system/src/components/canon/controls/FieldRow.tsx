import type { ReactNode } from 'react';

import { Eyebrow, MetaValue, Text } from '../typography';

export interface FieldRowProps {
  label: string;
  value?: string;
  description?: string;
  children: ReactNode;
}

export function FieldRow({ label, value, description, children }: FieldRowProps) {
  return (
    <label className="ds-field-row">
      <div className="ds-field-row-header">
        <Eyebrow>{label}</Eyebrow>
        {value ? <MetaValue>{value}</MetaValue> : null}
      </div>
      {description ? <Text variant="quiet">{description}</Text> : null}
      {children}
    </label>
  );
}
