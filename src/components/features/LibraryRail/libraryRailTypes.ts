import type { LucideIcon } from 'lucide-react';
import type React from 'react';

export type LibraryRailEntryVariant = 'row' | 'card' | 'disclosure';

export interface LibraryRailEntryAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  className?: string;
}

export interface LibraryRailEntry {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  actions?: LibraryRailEntryAction[];
  variant?: LibraryRailEntryVariant;
  isActive?: boolean;
}

export interface LibraryRailSection {
  id: string;
  title: React.ReactNode;
  icon?: LucideIcon;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  entries?: LibraryRailEntry[];
  content?: React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  chevronClassName?: string;
}
