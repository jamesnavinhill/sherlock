import type { ReactNode } from 'react';

import { Heading, Text } from '../typography';

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
          <Heading level="inline">{title}</Heading>
          <Text variant="quiet">{description}</Text>
        </div>
        {meta}
      </div>
      {children}
    </div>
  );
}
