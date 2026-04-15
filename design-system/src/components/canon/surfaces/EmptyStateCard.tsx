import type { ReactNode } from 'react';

export interface EmptyStateCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function EmptyStateCard({ icon, title, description, actions }: EmptyStateCardProps) {
  return (
    <div className="ds-empty-state-card">
      {icon}
      <div className="ds-title-inline">{title}</div>
      <p className="ds-body-quiet">{description}</p>
      {actions}
    </div>
  );
}
