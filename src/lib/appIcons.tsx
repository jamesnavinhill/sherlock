/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Atom,
  BadgeHelp,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Building2,
  ChartColumn,
  Compass,
  Database,
  Eye,
  FileCode2,
  FileSearch,
  FileText,
  Files,
  FlaskConical,
  Folder,
  FolderKanban,
  FolderOpen,
  Globe,
  GraduationCap,
  Landmark,
  Lightbulb,
  Link2,
  Lock,
  Map as MapIcon,
  MessageSquare,
  Microscope,
  Network,
  Newspaper,
  Puzzle,
  Radar,
  ScrollText,
  Shield,
  Sparkles,
  Star,
  Target,
  User,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const APP_ICON_REGISTRY = {
  folder: { label: 'Folder', icon: Folder },
  'folder-open': { label: 'Open Folder', icon: FolderOpen },
  'folder-board': { label: 'Board Folder', icon: FolderKanban },
  briefcase: { label: 'Briefcase', icon: Briefcase },
  bot: { label: 'Bot', icon: Bot },
  brain: { label: 'Brain', icon: Brain },
  'file-text': { label: 'Document', icon: FileText },
  'file-search': { label: 'Research File', icon: FileSearch },
  'file-code': { label: 'Code File', icon: FileCode2 },
  files: { label: 'Files', icon: Files },
  message: { label: 'Message', icon: MessageSquare },
  network: { label: 'Network', icon: Network },
  radar: { label: 'Radar', icon: Radar },
  globe: { label: 'Globe', icon: Globe },
  compass: { label: 'Compass', icon: Compass },
  map: { label: 'Map', icon: MapIcon },
  building: { label: 'Building', icon: Building2 },
  landmark: { label: 'Landmark', icon: Landmark },
  shield: { label: 'Shield', icon: Shield },
  lock: { label: 'Lock', icon: Lock },
  flask: { label: 'Flask', icon: FlaskConical },
  microscope: { label: 'Microscope', icon: Microscope },
  atom: { label: 'Atom', icon: Atom },
  book: { label: 'Book', icon: BookOpen },
  newspaper: { label: 'Newspaper', icon: Newspaper },
  chart: { label: 'Chart', icon: ChartColumn },
  target: { label: 'Target', icon: Target },
  eye: { label: 'Eye', icon: Eye },
  sparkles: { label: 'Sparkles', icon: Sparkles },
  star: { label: 'Star', icon: Star },
  lightbulb: { label: 'Lightbulb', icon: Lightbulb },
  puzzle: { label: 'Puzzle', icon: Puzzle },
  help: { label: 'Help', icon: BadgeHelp },
  link: { label: 'Link', icon: Link2 },
  user: { label: 'Person', icon: User },
  users: { label: 'Group', icon: Users },
  database: { label: 'Database', icon: Database },
  scroll: { label: 'Scroll', icon: ScrollText },
  graduate: { label: 'Graduate', icon: GraduationCap },
} as const;

export type AppIconId = keyof typeof APP_ICON_REGISTRY;

export const APP_ICON_IDS = Object.keys(APP_ICON_REGISTRY) as AppIconId[];

export const APP_ICON_OPTIONS = APP_ICON_IDS.map((id) => ({
  id,
  label: APP_ICON_REGISTRY[id].label,
}));

const iconDataUrlCache = new Map<string, string>();

export const isAppIconId = (value: string | null | undefined): value is AppIconId =>
  !!value && value in APP_ICON_REGISTRY;

export const getAppIconRecord = (iconId?: string | null) =>
  isAppIconId(iconId) ? APP_ICON_REGISTRY[iconId] : APP_ICON_REGISTRY.folder;

export const getAppIconComponent = (iconId?: string | null): LucideIcon =>
  getAppIconRecord(iconId).icon;

export const getAppIconLabel = (iconId?: string | null) => getAppIconRecord(iconId).label;

export const getDefaultWorkspaceIconId = (): AppIconId => 'folder';

export const getDefaultGraphNodeIconId = (input: {
  type: 'REPORT' | 'ENTITY';
  subtype?: string | null;
}): AppIconId => {
  if (input.type === 'REPORT') return 'file-text';

  switch (input.subtype) {
    case 'PERSON':
      return 'user';
    case 'ORGANIZATION':
      return 'building';
    case 'CONCEPT':
      return 'lightbulb';
    case 'SOURCE':
      return 'globe';
    default:
      return 'network';
  }
};

export const getDefaultWorkspaceLibraryIconId = (input: {
  kind: string;
  workspaceItemKind?: string | null;
  entityType?: string | null;
}): AppIconId => {
  switch (input.kind) {
    case 'ARTIFACT':
      return 'file-text';
    case 'FINDING':
      return 'sparkles';
    case 'ENTITY':
      return getDefaultGraphNodeIconId({
        type: 'ENTITY',
        subtype: input.entityType,
      });
    case 'SOURCE':
      return 'link';
    case 'SIGNAL':
    case 'HEADLINE':
      return 'radar';
    case 'NOTE':
      return 'scroll';
    case 'LINK':
      return 'link';
    case 'FILE':
      return 'files';
    case 'MEDIA':
      return 'eye';
    case 'EXCERPT':
      return 'book';
    default:
      return input.workspaceItemKind === 'FILE' ? 'files' : 'folder-board';
  }
};

export const buildAppIconSvgDataUrl = (
  iconId: string | null | undefined,
  input?: {
    color?: string;
    size?: number;
    strokeWidth?: number;
  }
) => {
  const resolvedId = isAppIconId(iconId) ? iconId : getDefaultWorkspaceIconId();
  const color = input?.color || '#e4e4e7';
  const size = input?.size || 24;
  const strokeWidth = input?.strokeWidth || 1.8;
  const cacheKey = `${resolvedId}:${color}:${size}:${strokeWidth}`;
  const cached = iconDataUrlCache.get(cacheKey);
  if (cached) return cached;

  const Icon = getAppIconComponent(resolvedId);
  const markup = renderToStaticMarkup(
    <Icon color={color} size={size} strokeWidth={strokeWidth} aria-hidden="true" />
  );
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  iconDataUrlCache.set(cacheKey, dataUrl);
  return dataUrl;
};

export const AppIcon: React.FC<{
  className?: string;
  iconId?: string | null;
  size?: number;
  strokeWidth?: number;
}> = ({ className, iconId, size = 18, strokeWidth = 1.8 }) => {
  return React.createElement(getAppIconComponent(iconId), {
    className,
    size,
    strokeWidth,
    'aria-hidden': true,
  });
};
