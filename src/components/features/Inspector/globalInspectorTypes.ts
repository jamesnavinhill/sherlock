import type { LucideIcon } from 'lucide-react';
import type React from 'react';

export type GlobalInspectorSubjectKind =
  | 'EMPTY'
  | 'ENTITY'
  | 'ARTIFACT'
  | 'SIGNAL'
  | 'WORKSPACE_ITEM'
  | 'CHAT_SESSION'
  | 'TIMELINE_EVENT'
  | 'BOARD_SELECTION'
  | 'WORKSPACE_CONTEXT';

export interface GlobalInspectorTab {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface GlobalInspectorSection {
  id: string;
  title: React.ReactNode;
  icon?: LucideIcon;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  content: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  chevronClassName?: string;
}

export interface GlobalInspectorEmptyState {
  title: string;
  description: string;
  icon?: LucideIcon;
}
