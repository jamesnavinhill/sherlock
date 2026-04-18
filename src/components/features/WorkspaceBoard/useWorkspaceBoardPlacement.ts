import { useCallback, useEffect, useRef } from 'react';
import type { DragEvent, MutableRefObject } from 'react';
import type { Editor } from 'tldraw';

import type {
  Artifact,
  Headline,
  Workspace,
  WorkspaceBoard,
  WorkspaceBoardItemReference,
} from '@/types';
import { buildWorkspaceBoardDocumentPath } from '@/app/routes';
import {
  boardRefKey,
  type WorkspaceLibraryEntry,
} from '@/services/workspace/library';
import { buildArtifactPackageEntries } from '@/services/workspace/artifactBoard';
import {
  buildBoardCardSpec,
  findBoardShapeIdsForReference,
  placeStandaloneIconOnBoard,
} from '@/services/workspace/boardShapes';
import { placeEntryOnBoard } from './workspaceBoardUtils';

const PACKAGE_GUTTER_X = 32;
const PACKAGE_GUTTER_Y = 32;
const PACKAGE_STACK_GAP = 96;

const getBoardContentBounds = (editor: Editor) => {
  const bounds = editor
    .getCurrentPageShapes()
    .map((shape) => editor.getShapePageBounds(shape.id as never))
    .filter((entry): entry is NonNullable<typeof entry> => !!entry);

  if (bounds.length === 0) return null;

  return {
    minX: Math.min(...bounds.map((entry) => entry.x)),
    maxY: Math.max(...bounds.map((entry) => entry.y + entry.h)),
  };
};

const resolveArtifactPackageOrigin = (editor: Editor) => {
  const viewport = editor.getViewportPageBounds();
  const existingBounds = getBoardContentBounds(editor);

  if (!existingBounds) {
    return {
      x: viewport.x + 48,
      y: viewport.y + 48,
    };
  }

  return {
    x: existingBounds.minX,
    y: existingBounds.maxY + PACKAGE_STACK_GAP,
  };
};

const placeEntryGrid = (input: {
  editor: Editor;
  entries: WorkspaceLibraryEntry[];
  maxColumns: number;
  startX: number;
  startY: number;
  themeMode: 'dark' | 'light';
}) => {
  if (input.entries.length === 0) {
    return {
      height: 0,
      shapeIds: [] as string[],
      width: 0,
    };
  }

  const firstCard = buildBoardCardSpec(input.entries[0]);
  const columns = Math.max(1, Math.min(input.maxColumns, input.entries.length));
  const shapeIds: string[] = [];

  input.entries.forEach((entry, index) => {
    const card = buildBoardCardSpec(entry);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const placed = placeEntryOnBoard(
      input.editor,
      entry,
      input.startX + column * (card.w + PACKAGE_GUTTER_X),
      input.startY + row * (card.h + PACKAGE_GUTTER_Y),
      input.themeMode
    );
    shapeIds.push(placed.shapeId as string);
  });

  const rows = Math.ceil(input.entries.length / columns);

  return {
    width: columns * firstCard.w + (columns - 1) * PACKAGE_GUTTER_X,
    height: rows * firstCard.h + (rows - 1) * PACKAGE_GUTTER_Y,
    shapeIds,
  };
};

interface UseWorkspaceBoardPlacementInput {
  activeBoard: WorkspaceBoard | null;
  activeWorkspace: Workspace | null;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  clearQueuedBoardPlacement: () => void;
  editorRef: MutableRefObject<Editor | null>;
  libraryMap: Map<string, WorkspaceLibraryEntry>;
  navigate: (path: string) => void;
  queuedBoardPlacement: {
    workspaceId: string;
    boardId?: string;
    item: WorkspaceBoardItemReference;
    mode?: 'PLACE' | 'FOCUS_OR_PLACE';
  } | null;
  themeMode: 'dark' | 'light';
  workspaceArtifacts: Artifact[];
  workspaceHeadlines: Headline[];
}

export const useWorkspaceBoardPlacement = ({
  activeBoard,
  activeWorkspace,
  addToast,
  clearQueuedBoardPlacement,
  editorRef,
  libraryMap,
  navigate,
  queuedBoardPlacement,
  themeMode,
  workspaceArtifacts,
  workspaceHeadlines,
}: UseWorkspaceBoardPlacementInput) => {
  const autoPlacementRef = useRef<{ boardId: string | null; index: number }>({
    boardId: null,
    index: 0,
  });

  useEffect(() => {
    autoPlacementRef.current = {
      boardId: activeBoard?.id || null,
      index: 0,
    };
  }, [activeBoard?.id]);

  useEffect(() => {
    if (!activeWorkspace || !activeBoard) return;
    if (!editorRef.current || !queuedBoardPlacement) return;
    if (queuedBoardPlacement.workspaceId !== activeWorkspace.id) return;
    if (queuedBoardPlacement.boardId && queuedBoardPlacement.boardId !== activeBoard.id) {
      navigate(buildWorkspaceBoardDocumentPath(activeWorkspace.id, queuedBoardPlacement.boardId));
      return;
    }

    const queuedEntry = libraryMap.get(boardRefKey(queuedBoardPlacement.item));
    if (queuedEntry) {
      if (queuedBoardPlacement.mode === 'FOCUS_OR_PLACE') {
        const matchingShapeIds = findBoardShapeIdsForReference(
          editorRef.current.getCurrentPageShapes(),
          queuedBoardPlacement.item
        );

        if (matchingShapeIds.length > 0) {
          const focusBounds = matchingShapeIds
            .map((shapeId) => editorRef.current?.getShapePageBounds(shapeId as never))
            .filter((entry): entry is NonNullable<typeof entry> => !!entry);

          editorRef.current.setSelectedShapes(matchingShapeIds as never);
          if (focusBounds.length > 0) {
            const minX = Math.min(...focusBounds.map((entry) => entry.x));
            const minY = Math.min(...focusBounds.map((entry) => entry.y));
            const maxX = Math.max(...focusBounds.map((entry) => entry.x + entry.w));
            const maxY = Math.max(...focusBounds.map((entry) => entry.y + entry.h));

            editorRef.current.zoomToBounds(
              {
                x: minX,
                y: minY,
                w: maxX - minX,
                h: maxY - minY,
              },
              { targetZoom: 1, animation: { duration: 180 } }
            );
          }

          clearQueuedBoardPlacement();
          return;
        }
      }

      if (activeBoard.presentationMode) {
        addToast('Board is in presentation mode. Disable it before placing new items.', 'INFO');
        clearQueuedBoardPlacement();
        return;
      }

      const viewport = editorRef.current.getViewportPageBounds();
      const card = buildBoardCardSpec(queuedEntry);
      placeEntryOnBoard(
        editorRef.current,
        queuedEntry,
        viewport.x + viewport.w / 2 - card.w / 2,
        viewport.y + viewport.h / 2 - card.h / 2,
        themeMode
      );
    }

    clearQueuedBoardPlacement();
  }, [
    activeBoard,
    activeWorkspace,
    addToast,
    clearQueuedBoardPlacement,
    editorRef,
    libraryMap,
    navigate,
    queuedBoardPlacement,
    themeMode,
  ]);

  const handleAddBoardIcon = useCallback(
    (iconId: string) => {
      if (!editorRef.current || !activeBoard) return;
      if (activeBoard.presentationMode) {
        addToast('Disable presentation mode before editing this board.', 'INFO');
        return;
      }

      const viewport = editorRef.current.getViewportPageBounds();
      const iconSize = 56;
      const slotWidth = iconSize + 40;
      const slotHeight = iconSize + 40;
      const usableWidth = Math.max(slotWidth, viewport.w - 96);
      const columns = Math.max(1, Math.floor(usableWidth / slotWidth));
      const placementIndex = autoPlacementRef.current.index;
      const autoPosition = {
        x: viewport.x + 48 + (placementIndex % columns) * slotWidth,
        y: viewport.y + 48 + Math.floor(placementIndex / columns) * slotHeight,
      };

      autoPlacementRef.current = {
        boardId: activeBoard.id,
        index: placementIndex + 1,
      };

      placeStandaloneIconOnBoard(editorRef.current, {
        iconId,
        themeMode,
        x: autoPosition.x,
        y: autoPosition.y,
      });
    },
    [activeBoard, addToast, editorRef, themeMode]
  );

  const handleDropEntry = useCallback(
    (entry: WorkspaceLibraryEntry, clientX?: number, clientY?: number) => {
      if (!editorRef.current || !activeBoard) return;
      if (activeBoard.presentationMode) {
        addToast('Disable presentation mode before editing this board.', 'INFO');
        return;
      }

      const card = buildBoardCardSpec(entry);
      const point =
        clientX !== undefined && clientY !== undefined
          ? editorRef.current.screenToPage({ x: clientX, y: clientY })
          : null;
      const viewport = editorRef.current.getViewportPageBounds();
      const slotWidth = card.w + 48;
      const slotHeight = card.h + 48;
      const usableWidth = Math.max(slotWidth, viewport.w - 96);
      const columns = Math.max(1, Math.floor(usableWidth / slotWidth));
      const placementIndex = autoPlacementRef.current.index;
      const autoPosition = {
        x: viewport.x + 48 + (placementIndex % columns) * slotWidth,
        y: viewport.y + 48 + Math.floor(placementIndex / columns) * slotHeight,
      };

      if (!point) {
        autoPlacementRef.current = {
          boardId: activeBoard.id,
          index: placementIndex + 1,
        };
      }

      placeEntryOnBoard(
        editorRef.current,
        entry,
        point?.x ?? autoPosition.x,
        point?.y ?? autoPosition.y,
        themeMode
      );
    },
    [activeBoard, addToast, editorRef, themeMode]
  );

  const handleAddArtifactPackage = useCallback(
    (entry: WorkspaceLibraryEntry) => {
      if (!editorRef.current || !activeBoard || !activeWorkspace) return;
      if (entry.refKind !== 'ARTIFACT') return;
      if (activeBoard.presentationMode) {
        addToast('Disable presentation mode before editing this board.', 'INFO');
        return;
      }

      const artifact = workspaceArtifacts.find(
        (candidate): candidate is Artifact & { id: string; workspaceId: string } =>
          candidate.id === entry.refId &&
          candidate.workspaceId === activeWorkspace.id
      );
      if (!artifact) {
        addToast('Artifact package could not be resolved from the current workspace.', 'ERROR');
        return;
      }

      const packageEntries = buildArtifactPackageEntries({
        artifact,
        libraryMap,
        workspaceSignals: workspaceHeadlines,
      });
      if (!packageEntries) {
        addToast('Artifact package could not be assembled for board placement.', 'ERROR');
        return;
      }

      const origin = resolveArtifactPackageOrigin(editorRef.current);
      const placedArtifact = placeEntryOnBoard(
        editorRef.current,
        packageEntries.artifactEntry,
        origin.x,
        origin.y,
        themeMode
      );

      const artifactCard = placedArtifact.card;
      const artifactBounds = editorRef.current.getShapePageBounds(placedArtifact.shapeId as never);
      const artifactRight = artifactBounds
        ? artifactBounds.x + artifactBounds.w
        : origin.x + artifactCard.w;
      const artifactBottom = artifactBounds
        ? artifactBounds.y + artifactBounds.h
        : origin.y + artifactCard.h;
      const rightColumnX = artifactRight + 128;
      let rightColumnY = origin.y + 48;
      const lowerLeftY = artifactBottom + 80;
      const findingBlock = placeEntryGrid({
        editor: editorRef.current,
        entries: packageEntries.findingEntries,
        maxColumns: 2,
        startX: rightColumnX,
        startY: rightColumnY,
        themeMode,
      });
      rightColumnY += findingBlock.height > 0 ? findingBlock.height + PACKAGE_GUTTER_Y : 0;

      const entityBlock = placeEntryGrid({
        editor: editorRef.current,
        entries: packageEntries.entityEntries,
        maxColumns: 2,
        startX: rightColumnX,
        startY: rightColumnY,
        themeMode,
      });
      rightColumnY += entityBlock.height > 0 ? entityBlock.height + PACKAGE_GUTTER_Y : 0;

      placeEntryGrid({
        editor: editorRef.current,
        entries: packageEntries.sourceEntries,
        maxColumns: 3,
        startX: origin.x,
        startY: lowerLeftY,
        themeMode,
      });

      const rightColumnSignalsY = rightColumnY + (entityBlock.height > 0 ? PACKAGE_GUTTER_Y : 0);
      placeEntryGrid({
        editor: editorRef.current,
        entries: packageEntries.signalEntries,
        maxColumns: 3,
        startX: rightColumnX,
        startY: rightColumnSignalsY,
        themeMode,
      });
      editorRef.current.setSelectedShapes([placedArtifact.shapeId as never]);
    },
    [
      activeBoard,
      activeWorkspace,
      addToast,
      editorRef,
      libraryMap,
      themeMode,
      workspaceArtifacts,
      workspaceHeadlines,
    ]
  );

  const handleCanvasDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData('application/json+sherlock-entry');
      if (!raw) return;

      try {
        const ref = JSON.parse(raw) as WorkspaceBoardItemReference;
        const entry = libraryMap.get(boardRefKey(ref));
        if (entry) {
          handleDropEntry(entry, event.clientX, event.clientY);
        }
      } catch {
        // Ignore malformed drag payloads.
      }
    },
    [handleDropEntry, libraryMap]
  );

  return {
    handleAddArtifactPackage,
    handleAddBoardIcon,
    handleCanvasDrop,
    handleDropEntry,
  };
};
