import type { ReactNode } from 'react';

export interface ActionCardProps {
  title: string;
  description: string;
  meta?: ReactNode;
  children?: ReactNode;
}

export function ActionCard({ title, description, meta, children }: ActionCardProps) {
  return (
    <div className="ds-action-card">
      <div className="ds-action-card-header">
        <div>
          <div className="ds-title-inline">{title}</div>
          <p className="ds-body-quiet">{description}</p>
        </div>
        {meta}
      </div>
      {children}
    </div>
  );
}
