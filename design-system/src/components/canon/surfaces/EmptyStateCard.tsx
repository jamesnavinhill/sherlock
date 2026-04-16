import type { ReactNode } from 'react';

import { Heading, Text } from '../typography';

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
      <Heading level="inline">{title}</Heading>
      <Text variant="quiet">{description}</Text>
      {actions}
    </div>
  );
}
