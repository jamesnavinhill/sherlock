import React from 'react';
import { Tldraw, type TLEditorSnapshot, type TLStoreSnapshot } from 'tldraw';
import { Shapes } from 'lucide-react';

import type { WorkspaceBoard } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { boardTldrawComponents } from './workspaceBoardUtils';

interface BoardCanvasPaneProps {
  activeBoard: WorkspaceBoard | null;
  hydratedSnapshot?: TLEditorSnapshot | TLStoreSnapshot;
  onCanvasDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onEditorMount: React.ComponentProps<typeof Tldraw>['onMount'];
}

export const BoardCanvasPane: React.FC<BoardCanvasPaneProps> = ({
  activeBoard,
  hydratedSnapshot,
  onCanvasDrop,
  onEditorMount,
}) => (
  <main className="relative flex-1 overflow-hidden bg-osint-dark">
    <div
      className="sherlock-board-canvas absolute inset-0"
      onDragOver={(event) => event.preventDefault()}
      onDrop={onCanvasDrop}
    >
      {activeBoard ? (
        <Tldraw
          key={activeBoard.id}
          className="h-full w-full"
          components={boardTldrawComponents}
          snapshot={hydratedSnapshot}
          onMount={onEditorMount}
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
