import React, { useState } from 'react';
import { Tldraw, type TLEditorSnapshot, type TLStoreSnapshot } from 'tldraw';
import { Shapes } from 'lucide-react';

import { getTldrawLicenseKey } from '@/config/tldraw';
import type { WorkspaceBoard } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { boardTldrawComponents } from './workspaceBoardUtils';

interface BoardCanvasPaneProps {
  activeBoard: WorkspaceBoard | null;
  hydratedSnapshot?: TLEditorSnapshot | TLStoreSnapshot;
  onCanvasDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onEditorMount: React.ComponentProps<typeof Tldraw>['onMount'];
}

interface BoardCanvasInstanceProps {
  boardId: string;
  hydratedSnapshot?: TLEditorSnapshot | TLStoreSnapshot;
  onEditorMount: React.ComponentProps<typeof Tldraw>['onMount'];
}

const tldrawLicenseKey = getTldrawLicenseKey();

const BoardCanvasInstance: React.FC<BoardCanvasInstanceProps> = ({
  boardId,
  hydratedSnapshot,
  onEditorMount,
}) => {
  const [initialSnapshot] = useState(() => hydratedSnapshot);

  return (
    <Tldraw
      key={boardId}
      className="h-full w-full"
      components={boardTldrawComponents}
      licenseKey={tldrawLicenseKey}
      snapshot={initialSnapshot}
      onMount={onEditorMount}
    />
  );
};

export const BoardCanvasPane: React.FC<BoardCanvasPaneProps> = ({
  activeBoard,
  hydratedSnapshot,
  onCanvasDrop,
  onEditorMount,
}) => {
  return (
    <main className="relative z-0 flex-1 overflow-hidden bg-osint-dark">
      <div
        className="sherlock-board-canvas absolute inset-0 z-0"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onCanvasDrop}
      >
        {activeBoard ? (
          <BoardCanvasInstance
            key={activeBoard.id}
            boardId={activeBoard.id}
            hydratedSnapshot={hydratedSnapshot}
            onEditorMount={onEditorMount}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={Shapes}
              title="Preparing Board"
              description="Sherlock is preparing the primary board for this workspace."
            />
          </div>
        )}
      </div>
    </main>
  );
};
