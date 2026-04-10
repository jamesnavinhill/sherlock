/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Icon as IconifyIcon } from '@iconify/react/offline';
import { icons as pixelartIconSet } from '@iconify-json/pixelarticons';
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
import {
  IconAtom2,
  IconBook2,
  IconBrain,
  IconBriefcase2,
  IconBulb,
  IconBuildingBank,
  IconBuildingSkyscraper,
  IconChartBar,
  IconCompass,
  IconDatabase,
  IconEye,
  IconFileCode2,
  IconFileSearch,
  IconFiles,
  IconFileText,
  IconFlask2,
  IconFolder,
  IconFolderOpen,
  IconHelpCircle,
  IconLink,
  IconLock,
  IconMap2,
  IconMessageCircle,
  IconMicroscope,
  IconNews,
  IconPuzzle2,
  IconRadar2,
  IconRobot,
  IconSchool,
  IconScript,
  IconShieldLock,
  IconSparkles,
  IconStar,
  IconTargetArrow,
  IconTopologyStar3,
  IconUser,
  IconUsersGroup,
  IconWorld,
} from '@tabler/icons-react';
import type { IconifyIcon as IconifyIconData } from '@iconify/types';

export type AppIconPackId = 'lucide' | 'pixelart' | 'tabler';

type TablerLikeIcon = React.ComponentType<{
  'aria-hidden'?: boolean;
  className?: string;
  color?: string;
  size?: number | string;
  stroke?: number | string;
  title?: string;
}>;

type AppIconRecord = {
      group: string;
      label: string;
      pack: AppIconPackId;
      searchTerms?: string[];
} & (
  | {
      component: LucideIcon;
      renderer: 'lucide';
    }
  | {
      component: TablerLikeIcon;
      renderer: 'tabler';
    }
  | {
      icon: IconifyIconData;
      renderer: 'iconify';
    }
);

const createLucideIcon = (
  label: string,
  component: LucideIcon,
  group: string,
  searchTerms?: string[]
): AppIconRecord => ({
  label,
  component,
  group,
  pack: 'lucide',
  renderer: 'lucide',
  searchTerms,
});

const createTablerIcon = (
  label: string,
  component: TablerLikeIcon,
  group: string,
  searchTerms?: string[]
): AppIconRecord => ({
  label,
  component,
  group,
  pack: 'tabler',
  renderer: 'tabler',
  searchTerms,
});

const getPixelArtIconData = (name: string): IconifyIconData => {
  const icon = pixelartIconSet.icons[name as keyof typeof pixelartIconSet.icons];
  if (!icon) {
    throw new Error(`Unknown Pixelarticons icon: ${name}`);
  }
  return {
    ...icon,
    height: pixelartIconSet.height,
    width: pixelartIconSet.width,
  };
};

const createPixelArtIcon = (
  label: string,
  iconName: string,
  group: string,
  searchTerms?: string[]
): AppIconRecord => ({
  label,
  group,
  icon: getPixelArtIconData(iconName),
  pack: 'pixelart',
  renderer: 'iconify',
  searchTerms,
});

const LUCIDE_ICON_REGISTRY = {
  folder: createLucideIcon('Folder', Folder, 'Core', ['workspace']),
  'folder-open': createLucideIcon('Open Folder', FolderOpen, 'Core', ['workspace']),
  'folder-board': createLucideIcon('Board Folder', FolderKanban, 'Core', ['canvas', 'board']),
  briefcase: createLucideIcon('Briefcase', Briefcase, 'Core', ['case', 'investigation']),
  bot: createLucideIcon('Bot', Bot, 'Analysis', ['agent', 'assistant']),
  brain: createLucideIcon('Brain', Brain, 'Analysis', ['thinking', 'analysis']),
  'file-text': createLucideIcon('Document', FileText, 'Core', ['report', 'note']),
  'file-search': createLucideIcon('Research File', FileSearch, 'Analysis', ['investigate']),
  'file-code': createLucideIcon('Code File', FileCode2, 'Data', ['source']),
  files: createLucideIcon('Files', Files, 'Core', ['documents']),
  message: createLucideIcon('Message', MessageSquare, 'Comms', ['chat']),
  network: createLucideIcon('Network', Network, 'Analysis', ['graph', 'node']),
  radar: createLucideIcon('Radar', Radar, 'Analysis', ['signal', 'monitor']),
  globe: createLucideIcon('Globe', Globe, 'Places', ['world']),
  compass: createLucideIcon('Compass', Compass, 'Places', ['direction']),
  map: createLucideIcon('Map', MapIcon, 'Places', ['location']),
  building: createLucideIcon('Building', Building2, 'Places', ['organization']),
  landmark: createLucideIcon('Landmark', Landmark, 'Places', ['government']),
  shield: createLucideIcon('Shield', Shield, 'Security', ['protect']),
  lock: createLucideIcon('Lock', Lock, 'Security', ['secure']),
  flask: createLucideIcon('Flask', FlaskConical, 'Analysis', ['lab', 'science']),
  microscope: createLucideIcon('Microscope', Microscope, 'Analysis', ['research']),
  atom: createLucideIcon('Atom', Atom, 'Analysis', ['science']),
  book: createLucideIcon('Book', BookOpen, 'Knowledge', ['reference']),
  newspaper: createLucideIcon('Newspaper', Newspaper, 'Knowledge', ['news', 'media']),
  chart: createLucideIcon('Chart', ChartColumn, 'Data', ['analytics']),
  target: createLucideIcon('Target', Target, 'Analysis', ['goal']),
  eye: createLucideIcon('Eye', Eye, 'Analysis', ['observe', 'media']),
  sparkles: createLucideIcon('Sparkles', Sparkles, 'Analysis', ['highlight']),
  star: createLucideIcon('Star', Star, 'Analysis', ['favorite']),
  lightbulb: createLucideIcon('Lightbulb', Lightbulb, 'Analysis', ['idea']),
  puzzle: createLucideIcon('Puzzle', Puzzle, 'Analysis', ['problem']),
  help: createLucideIcon('Help', BadgeHelp, 'Comms', ['question']),
  link: createLucideIcon('Link', Link2, 'Knowledge', ['source', 'url']),
  user: createLucideIcon('Person', User, 'People', ['profile']),
  users: createLucideIcon('Group', Users, 'People', ['team']),
  database: createLucideIcon('Database', Database, 'Data', ['storage']),
  scroll: createLucideIcon('Scroll', ScrollText, 'Knowledge', ['note']),
  graduate: createLucideIcon('Graduate', GraduationCap, 'Knowledge', ['school', 'education']),
} as const satisfies Record<string, AppIconRecord>;

const TABLER_ICON_REGISTRY = {
  'tabler:folder': createTablerIcon('Folder', IconFolder, 'Core', ['workspace']),
  'tabler:folder-open': createTablerIcon('Open Folder', IconFolderOpen, 'Core', ['workspace']),
  'tabler:briefcase': createTablerIcon('Briefcase', IconBriefcase2, 'Core', ['case']),
  'tabler:robot': createTablerIcon('Robot', IconRobot, 'Analysis', ['bot', 'agent']),
  'tabler:brain': createTablerIcon('Brain', IconBrain, 'Analysis', ['thinking']),
  'tabler:file-text': createTablerIcon('Document', IconFileText, 'Core', ['report', 'note']),
  'tabler:file-search': createTablerIcon(
    'Research File',
    IconFileSearch,
    'Analysis',
    ['investigate']
  ),
  'tabler:file-code': createTablerIcon('Code File', IconFileCode2, 'Data', ['source']),
  'tabler:files': createTablerIcon('Files', IconFiles, 'Core', ['documents']),
  'tabler:message': createTablerIcon('Message', IconMessageCircle, 'Comms', ['chat']),
  'tabler:network': createTablerIcon(
    'Network Topology',
    IconTopologyStar3,
    'Analysis',
    ['graph', 'nodes']
  ),
  'tabler:radar': createTablerIcon('Radar', IconRadar2, 'Analysis', ['signal', 'monitor']),
  'tabler:world': createTablerIcon('World', IconWorld, 'Places', ['globe']),
  'tabler:compass': createTablerIcon('Compass', IconCompass, 'Places', ['direction']),
  'tabler:map': createTablerIcon('Map', IconMap2, 'Places', ['location']),
  'tabler:building': createTablerIcon(
    'Skyscraper',
    IconBuildingSkyscraper,
    'Places',
    ['organization', 'office']
  ),
  'tabler:landmark': createTablerIcon(
    'Bank',
    IconBuildingBank,
    'Places',
    ['landmark', 'government']
  ),
  'tabler:shield-lock': createTablerIcon(
    'Shield Lock',
    IconShieldLock,
    'Security',
    ['protect']
  ),
  'tabler:lock': createTablerIcon('Lock', IconLock, 'Security', ['secure']),
  'tabler:flask': createTablerIcon('Flask', IconFlask2, 'Analysis', ['lab', 'science']),
  'tabler:microscope': createTablerIcon(
    'Microscope',
    IconMicroscope,
    'Analysis',
    ['research']
  ),
  'tabler:atom': createTablerIcon('Atom', IconAtom2, 'Analysis', ['science']),
  'tabler:book': createTablerIcon('Book', IconBook2, 'Knowledge', ['reference']),
  'tabler:news': createTablerIcon('News', IconNews, 'Knowledge', ['newspaper', 'media']),
  'tabler:chart': createTablerIcon('Chart', IconChartBar, 'Data', ['analytics', 'graph']),
  'tabler:target': createTablerIcon('Target Arrow', IconTargetArrow, 'Analysis', ['goal']),
  'tabler:eye': createTablerIcon('Eye', IconEye, 'Analysis', ['observe']),
  'tabler:sparkles': createTablerIcon(
    'Sparkles',
    IconSparkles,
    'Analysis',
    ['highlight', 'magic']
  ),
  'tabler:star': createTablerIcon('Star', IconStar, 'Analysis', ['favorite']),
  'tabler:bulb': createTablerIcon('Bulb', IconBulb, 'Analysis', ['idea', 'lightbulb']),
  'tabler:puzzle': createTablerIcon('Puzzle', IconPuzzle2, 'Analysis', ['problem']),
  'tabler:help': createTablerIcon('Help Circle', IconHelpCircle, 'Comms', ['question']),
  'tabler:link': createTablerIcon('Link', IconLink, 'Knowledge', ['source', 'url']),
  'tabler:user': createTablerIcon('User', IconUser, 'People', ['person', 'profile']),
  'tabler:users': createTablerIcon('Users Group', IconUsersGroup, 'People', ['team', 'group']),
  'tabler:database': createTablerIcon('Database', IconDatabase, 'Data', ['storage']),
  'tabler:script': createTablerIcon('Script', IconScript, 'Knowledge', ['scroll', 'note']),
  'tabler:school': createTablerIcon('School', IconSchool, 'Knowledge', ['graduate', 'education']),
} as const satisfies Record<string, AppIconRecord>;

const PIXELART_ICON_REGISTRY = {
  'pixel:folder': createPixelArtIcon('Folder', 'folder', 'Core', ['workspace']),
  'pixel:briefcase': createPixelArtIcon('Briefcase', 'briefcase', 'Core', ['case']),
  'pixel:robot': createPixelArtIcon('Robot', 'robot', 'Analysis', ['bot', 'agent']),
  'pixel:robot-face': createPixelArtIcon(
    'Robot Face',
    'robot-face-happy',
    'Analysis',
    ['bot', 'assistant']
  ),
  'pixel:file': createPixelArtIcon('File', 'file', 'Core', ['document']),
  'pixel:file-text': createPixelArtIcon('File Text', 'file-text', 'Core', ['report', 'note']),
  'pixel:message': createPixelArtIcon('Message', 'message', 'Comms', ['chat']),
  'pixel:globe': createPixelArtIcon('Globe', 'globe', 'Places', ['world']),
  'pixel:map': createPixelArtIcon('Map', 'map', 'Places', ['location']),
  'pixel:building': createPixelArtIcon('Building', 'building', 'Places', ['organization']),
  'pixel:building-skyscraper': createPixelArtIcon(
    'Skyscraper',
    'building-skyscraper',
    'Places',
    ['city', 'office']
  ),
  'pixel:shield': createPixelArtIcon('Shield', 'shield', 'Security', ['protect']),
  'pixel:lock': createPixelArtIcon('Lock', 'lock', 'Security', ['secure']),
  'pixel:book-open': createPixelArtIcon(
    'Open Book',
    'book-open',
    'Knowledge',
    ['reference']
  ),
  'pixel:notebook': createPixelArtIcon('Notebook', 'notebook', 'Knowledge', ['notes']),
  'pixel:chart': createPixelArtIcon(
    'Chart Bar Big',
    'chart-bar-big',
    'Data',
    ['analytics', 'graph']
  ),
  'pixel:target': createPixelArtIcon('Target', 'target', 'Analysis', ['goal']),
  'pixel:eye': createPixelArtIcon('Eye', 'eye', 'Analysis', ['observe']),
  'pixel:lightbulb': createPixelArtIcon(
    'Lightbulb',
    'lightbulb-on',
    'Analysis',
    ['idea']
  ),
  'pixel:link': createPixelArtIcon('Link', 'link', 'Knowledge', ['source', 'url']),
  'pixel:user': createPixelArtIcon('User', 'user', 'People', ['person', 'profile']),
  'pixel:users': createPixelArtIcon('Users', 'users', 'People', ['group', 'team']),
  'pixel:database': createPixelArtIcon('Database', 'database', 'Data', ['storage']),
  'pixel:script': createPixelArtIcon('Script Text', 'script-text', 'Knowledge', ['scroll', 'note']),
} as const satisfies Record<string, AppIconRecord>;

const APP_ICON_REGISTRY = {
  ...TABLER_ICON_REGISTRY,
  ...PIXELART_ICON_REGISTRY,
  ...LUCIDE_ICON_REGISTRY,
} as const;

export type AppIconId = keyof typeof APP_ICON_REGISTRY;

export const APP_ICON_PACKS = [
  {
    id: 'tabler',
    label: 'Tabler',
    shortLabel: 'Core',
    description: 'Primary workhorse pack for broad app content.',
  },
  {
    id: 'pixelart',
    label: 'Pixel Art',
    shortLabel: 'Special Sauce',
    description: 'High-character pixel icons for standout board moments.',
  },
  {
    id: 'lucide',
    label: 'Sherlock Defaults',
    shortLabel: 'Defaults',
    description: 'Existing curated set used across the app today.',
  },
] as const satisfies ReadonlyArray<{
  description: string;
  id: AppIconPackId;
  label: string;
  shortLabel: string;
}>;

const APP_ICON_PACK_ORDER = APP_ICON_PACKS.map((pack) => pack.id);

export const APP_ICON_IDS = Object.keys(APP_ICON_REGISTRY) as AppIconId[];

export const isAppIconId = (value: string | null | undefined): value is AppIconId =>
  !!value && value in APP_ICON_REGISTRY;

export const getAppIconRecord = (iconId?: string | null) =>
  isAppIconId(iconId) ? APP_ICON_REGISTRY[iconId] : APP_ICON_REGISTRY.folder;

export const getAppIconLabel = (iconId?: string | null) => getAppIconRecord(iconId).label;

export const getAppIconPack = (iconId?: string | null): AppIconPackId => getAppIconRecord(iconId).pack;

export const getAppIconPackLabel = (pack: AppIconPackId) =>
  APP_ICON_PACKS.find((option) => option.id === pack)?.label || 'Icons';

export const APP_ICON_OPTIONS = APP_ICON_IDS.map((id) => {
  const record = APP_ICON_REGISTRY[id];
  const searchText = [record.label, record.group, getAppIconPackLabel(record.pack), ...(record.searchTerms || [])]
    .join(' ')
    .toLowerCase();

  return {
    id,
    group: record.group,
    label: record.label,
    pack: record.pack,
    searchText,
  };
}).sort((left, right) => {
  const packOrder =
    APP_ICON_PACK_ORDER.indexOf(left.pack) - APP_ICON_PACK_ORDER.indexOf(right.pack);
  if (packOrder !== 0) return packOrder;
  return left.label.localeCompare(right.label);
});

const iconDataUrlCache = new Map<string, string>();
const CSS_VAR_PATTERN = /var\((--[^),\s]+)(?:,[^)]+)?\)/g;

const renderAppIconElement = (input: {
  className?: string;
  color?: string;
  iconId?: string | null;
  size?: number;
  strokeWidth?: number;
}) => {
  const record = getAppIconRecord(input.iconId);
  const size = input.size || 18;

  if (record.renderer === 'iconify') {
    return (
      <IconifyIcon
        icon={record.icon}
        className={input.className}
        color={input.color}
        height={size}
        width={size}
      />
    );
  }

  if (record.renderer === 'tabler') {
    const Component = record.component as TablerLikeIcon;
    return (
      <Component
        aria-hidden
        className={input.className}
        color={input.color}
        size={size}
        stroke={input.strokeWidth}
      />
    );
  }

  const Component = record.component as LucideIcon;
  return (
    <Component
      aria-hidden
      className={input.className}
      color={input.color}
      size={size}
      strokeWidth={input.strokeWidth}
    />
  );
};

export const resolveAppIconColor = (
  color: string | null | undefined,
  root: Element | null = typeof document !== 'undefined' ? document.documentElement : null
) => {
  const trimmed = color?.trim();
  if (!trimmed) return '#e4e4e7';
  if (!trimmed.includes('var(')) return trimmed;
  if (typeof window === 'undefined' || !root) return '#e4e4e7';

  const resolved = trimmed.replace(CSS_VAR_PATTERN, (_, variableName: string) => {
    const value = window.getComputedStyle(root).getPropertyValue(variableName).trim();
    return value || '#e4e4e7';
  });

  return resolved.includes('var(') ? '#e4e4e7' : resolved;
};

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
  const color = resolveAppIconColor(input?.color);
  const size = input?.size || 24;
  const strokeWidth = input?.strokeWidth || 1.8;
  const cacheKey = `${resolvedId}:${color}:${size}:${strokeWidth}`;
  const cached = iconDataUrlCache.get(cacheKey);
  if (cached) return cached;

  const markup = renderToStaticMarkup(
    renderAppIconElement({
      color,
      iconId: resolvedId,
      size,
      strokeWidth,
    })
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
}> = ({ className, iconId, size = 18, strokeWidth = 1.8 }) =>
  renderAppIconElement({
    className,
    iconId,
    size,
    strokeWidth,
  });
