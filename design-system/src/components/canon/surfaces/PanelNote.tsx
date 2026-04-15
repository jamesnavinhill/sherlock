import type { ReactNode } from 'react';

export interface PanelNoteProps {
  title: string;
  children: ReactNode;
  meta?: ReactNode;
}

export function PanelNote({ title, children, meta }: PanelNoteProps) {
  return (
    <div className="ds-panel-note">
      <div className="ds-panel-note-header">
        <div className="ds-title-inline">{title}</div>
        {meta}
      </div>
      <div className="ds-body-quiet">{children}</div>
    </div>
  );
}
