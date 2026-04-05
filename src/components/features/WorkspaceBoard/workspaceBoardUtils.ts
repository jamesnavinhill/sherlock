import type { Editor, TLComponents } from 'tldraw';

import type { WorkspaceBoardItemReference, WorkspaceItem } from '@/types';
import type { ThemeMode } from '@/store/caseStore';
import {
  buildWorkspaceLibraryEntries,
  type WorkspaceLibraryEntry,
} from '@/services/workspace/library';
import { placeEntryOnBoard as placeWorkspaceEntryOnBoard } from '@/services/workspace/boardShapes';
import { CompactStylePanel } from './CompactStylePanel';

export const boardRefKey = (ref: WorkspaceBoardItemReference) => `${ref.refKind}:${ref.refId}`;

export const LEFT_PANEL_SECTION_SCROLL_CLASS =
  'max-h-[min(17rem,calc(100svh-25rem))] overflow-y-auto overscroll-contain pr-1 custom-scrollbar';

export type RightPanelView = 'INSPECTOR' | 'AGENT';

export type CreateModalState =
  | { type: 'NOTE'; title: string; content: string }
  | { type: 'LINK'; title: string; url: string; description: string }
  | null;

export const buildSingleWorkspaceItemEntry = (
  workspaceId: string,
  item: WorkspaceItem
): WorkspaceLibraryEntry | null =>
  buildWorkspaceLibraryEntries({
    workspaceId,
    artifacts: [],
    headlines: [],
    workspaceItems: [item],
  })[0] || null;

export const boardTldrawComponents: TLComponents = {
  StylePanel: CompactStylePanel,
};

export const placeEntryOnBoard = (
  editor: Editor,
  entry: WorkspaceLibraryEntry,
  x: number,
  y: number,
  themeMode: ThemeMode
) => {
  placeWorkspaceEntryOnBoard(editor, entry, x, y, themeMode);
};
