import type { ReactNode } from 'react';

interface FieldRowProps {
  label: string;
  value?: string;
  description?: string;
  children: ReactNode;
}

export function FieldRow({ label, value, description, children }: FieldRowProps) {
  return (
    <label className="ds-field-row">
      <div className="ds-field-row-header">
        <span className="ds-meta-label">{label}</span>
        {value ? <span className="ds-meta-value">{value}</span> : null}
      </div>
      {description ? <p className="ds-body-quiet">{description}</p> : null}
      {children}
    </label>
  );
}
