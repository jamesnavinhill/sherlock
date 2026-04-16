import type { ReactNode } from 'react';

import { Heading, Text } from '../typography';

export interface PanelNoteProps {
  title: string;
  children: ReactNode;
  meta?: ReactNode;
}

export function PanelNote({ title, children, meta }: PanelNoteProps) {
  return (
    <div className="ds-panel-note">
      <div className="ds-panel-note-header">
        <Heading level="inline">{title}</Heading>
        {meta}
      </div>
      <Text as="div" variant="quiet">
        {children}
      </Text>
    </div>
  );
}
