/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Icon as IconifyIcon } from '@iconify/react/offline';
import { icons as pixelartIconSet } from '@iconify-json/pixelarticons';
import * as TablerIcons from '@tabler/icons-react';
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

const APP_ICON_UPPERCASE_TOKENS: Record<string, string> = {
  '2fa': '2FA',
  '3d': '3D',
  '4g': '4G',
  '4k': '4K',
  '5g': '5G',
  ai: 'AI',
  api: 'API',
  cpu: 'CPU',
  id: 'ID',
  ip: 'IP',
  qa: 'QA',
  qr: 'QR',
  ui: 'UI',
  url: 'URL',
  usb: 'USB',
  ux: 'UX',
  vpn: 'VPN',
  vr: 'VR',
  wifi: 'WiFi',
  www: 'WWW',
};

const formatIconToken = (token: string): string => {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return '';
  if (APP_ICON_UPPERCASE_TOKENS[normalized]) {
    return APP_ICON_UPPERCASE_TOKENS[normalized];
  }
  if (/^\d+[a-z]+$/i.test(token)) {
    const [, digits = '', suffix = ''] = token.match(/^(\d+)([a-z]+)$/i) || [];
    return `${digits}${formatIconToken(suffix)}`;
  }
  if (/^[ivxlcdm]+$/i.test(token) && token.length <= 4) {
    return token.toUpperCase();
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const humanizeIconName = (value: string) =>
  value
    .split('-')
    .map((token) => formatIconToken(token))
    .filter(Boolean)
    .join(' ');

const pascalToKebabCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

const APP_ICON_GROUP_RULES: Array<{ group: string; keywords: string[] }> = [
  {
    group: 'People',
    keywords: ['address-book', 'contact', 'people', 'person', 'team', 'user', 'users'],
  },
  {
    group: 'Comms',
    keywords: ['bell', 'chat', 'mail', 'message', 'phone'],
  },
  {
    group: 'Security',
    keywords: ['alert', 'bug', 'fingerprint', 'firewall', 'key', 'lock', 'shield'],
  },
  {
    group: 'Places',
    keywords: [
      'building',
      'compass',
      'globe',
      'home',
      'landmark',
      'map',
      'route',
      'satellite',
      'world',
    ],
  },
  {
    group: 'Data',
    keywords: [
      'analytics',
      'api',
      'binary',
      'chart',
      'cloud',
      'code',
      'cpu',
      'database',
      'file-database',
      'server',
      'timeline',
    ],
  },
  {
    group: 'Knowledge',
    keywords: [
      'book',
      'bookmark',
      'books',
      'document',
      'file-text',
      'news',
      'notebook',
      'notes',
      'school',
    ],
  },
  {
    group: 'Analysis',
    keywords: [
      'ai',
      'analyze',
      'aperture',
      'brain',
      'camera',
      'eye',
      'filter',
      'flask',
      'microscope',
      'network',
      'puzzle',
      'radar',
      'robot',
      'scan',
      'spark',
      'star',
      'target',
      'telescope',
    ],
  },
];

const deriveAppIconGroup = (values: string[]) => {
  const haystack = values.join(' ').toLowerCase();
  for (const rule of APP_ICON_GROUP_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.group;
    }
  }
  return 'Core';
};

const getTablerIconComponent = (exportName: string): TablerLikeIcon => {
  const component = TablerIcons[exportName as keyof typeof TablerIcons];
  if (!component) {
    throw new Error(`Unknown Tabler icon export: ${exportName}`);
  }
  return component as TablerLikeIcon;
};

const createNamedTablerIcon = (
  exportName: string,
  label: string,
  group: string,
  searchTerms?: string[]
) => createTablerIcon(label, getTablerIconComponent(exportName), group, searchTerms);

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

const CURATED_TABLER_ICON_REGISTRY = {
  'tabler:folder': createNamedTablerIcon('IconFolder', 'Folder', 'Core', ['workspace']),
  'tabler:folder-open': createNamedTablerIcon('IconFolderOpen', 'Open Folder', 'Core', ['workspace']),
  'tabler:briefcase': createNamedTablerIcon('IconBriefcase2', 'Briefcase', 'Core', ['case']),
  'tabler:robot': createNamedTablerIcon('IconRobot', 'Robot', 'Analysis', ['bot', 'agent']),
  'tabler:brain': createNamedTablerIcon('IconBrain', 'Brain', 'Analysis', ['thinking']),
  'tabler:file-text': createNamedTablerIcon('IconFileText', 'Document', 'Core', ['report', 'note']),
  'tabler:file-search': createNamedTablerIcon(
    'IconFileSearch',
    'Research File',
    'Analysis',
    ['investigate']
  ),
  'tabler:file-code': createNamedTablerIcon('IconFileCode2', 'Code File', 'Data', ['source']),
  'tabler:files': createNamedTablerIcon('IconFiles', 'Files', 'Core', ['documents']),
  'tabler:message': createNamedTablerIcon('IconMessageCircle', 'Message', 'Comms', ['chat']),
  'tabler:network': createNamedTablerIcon(
    'IconTopologyStar3',
    'Network Topology',
    'Analysis',
    ['graph', 'nodes']
  ),
  'tabler:radar': createNamedTablerIcon('IconRadar2', 'Radar', 'Analysis', ['signal', 'monitor']),
  'tabler:world': createNamedTablerIcon('IconWorld', 'World', 'Places', ['globe']),
  'tabler:compass': createNamedTablerIcon('IconCompass', 'Compass', 'Places', ['direction']),
  'tabler:map': createNamedTablerIcon('IconMap2', 'Map', 'Places', ['location']),
  'tabler:building': createNamedTablerIcon(
    'IconBuildingSkyscraper',
    'Skyscraper',
    'Places',
    ['organization', 'office']
  ),
  'tabler:landmark': createNamedTablerIcon(
    'IconBuildingBank',
    'Bank',
    'Places',
    ['landmark', 'government']
  ),
  'tabler:shield-lock': createNamedTablerIcon(
    'IconShieldLock',
    'Shield Lock',
    'Security',
    ['protect']
  ),
  'tabler:lock': createNamedTablerIcon('IconLock', 'Lock', 'Security', ['secure']),
  'tabler:flask': createNamedTablerIcon('IconFlask2', 'Flask', 'Analysis', ['lab', 'science']),
  'tabler:microscope': createNamedTablerIcon(
    'IconMicroscope',
    'Microscope',
    'Analysis',
    ['research']
  ),
  'tabler:atom': createNamedTablerIcon('IconAtom2', 'Atom', 'Analysis', ['science']),
  'tabler:book': createNamedTablerIcon('IconBook2', 'Book', 'Knowledge', ['reference']),
  'tabler:news': createNamedTablerIcon('IconNews', 'News', 'Knowledge', ['newspaper', 'media']),
  'tabler:chart': createNamedTablerIcon('IconChartBar', 'Chart', 'Data', ['analytics', 'graph']),
  'tabler:target': createNamedTablerIcon('IconTargetArrow', 'Target Arrow', 'Analysis', ['goal']),
  'tabler:eye': createNamedTablerIcon('IconEye', 'Eye', 'Analysis', ['observe']),
  'tabler:sparkles': createNamedTablerIcon(
    'IconSparkles',
    'Sparkles',
    'Analysis',
    ['highlight', 'magic']
  ),
  'tabler:star': createNamedTablerIcon('IconStar', 'Star', 'Analysis', ['favorite']),
  'tabler:bulb': createNamedTablerIcon('IconBulb', 'Bulb', 'Analysis', ['idea', 'lightbulb']),
  'tabler:puzzle': createNamedTablerIcon('IconPuzzle2', 'Puzzle', 'Analysis', ['problem']),
  'tabler:help': createNamedTablerIcon('IconHelpCircle', 'Help Circle', 'Comms', ['question']),
  'tabler:link': createNamedTablerIcon('IconLink', 'Link', 'Knowledge', ['source', 'url']),
  'tabler:user': createNamedTablerIcon('IconUser', 'User', 'People', ['person', 'profile']),
  'tabler:users': createNamedTablerIcon('IconUsersGroup', 'Users Group', 'People', ['team', 'group']),
  'tabler:database': createNamedTablerIcon('IconDatabase', 'Database', 'Data', ['storage']),
  'tabler:script': createNamedTablerIcon('IconScript', 'Script', 'Knowledge', ['scroll', 'note']),
  'tabler:school': createNamedTablerIcon('IconSchool', 'School', 'Knowledge', ['graduate', 'education']),
} as const satisfies Record<string, AppIconRecord>;

const GENERATED_TABLER_ICON_EXPORT_NAMES = [
  'IconAddressBook',
  'IconAi',
  'IconAiAgent',
  'IconAiAgents',
  'IconAiGateway',
  'IconAlarm',
  'IconAlertCircle',
  'IconAlertTriangle',
  'IconAnalyze',
  'IconApi',
  'IconApiBook',
  'IconAperture',
  'IconAtom2',
  'IconBell',
  'IconBinary',
  'IconBook',
  'IconBook2',
  'IconBookmark',
  'IconBookmarks',
  'IconBooks',
  'IconBrain',
  'IconBriefcase',
  'IconBriefcase2',
  'IconBuilding',
  'IconBuildingBank',
  'IconBuildingBroadcastTower',
  'IconBuildingCastle',
  'IconBuildingFactory',
  'IconBuildingFortress',
  'IconBuildingHospital',
  'IconBuildingLighthouse',
  'IconBuildingMonument',
  'IconBuildingSkyscraper',
  'IconCalendar',
  'IconCalendarEvent',
  'IconCalendarSearch',
  'IconCamera',
  'IconCameraAi',
  'IconChartArcs',
  'IconChartAreaLine',
  'IconChartBar',
  'IconChartBubble',
  'IconChartCandle',
  'IconChartDonut',
  'IconChartDots',
  'IconChartHistogram',
  'IconChartPie',
  'IconChecklist',
  'IconClock',
  'IconCloud',
  'IconCloudDataConnection',
  'IconCloudLock',
  'IconCode',
  'IconCodeCircle',
  'IconCodeDots',
  'IconCodeblock',
  'IconCompass',
  'IconCpu',
  'IconDatabase',
  'IconDatabaseExport',
  'IconDatabaseImport',
  'IconDatabaseSearch',
  'IconEye',
  'IconEyeQuestion',
  'IconEyeSearch',
  'IconFile',
  'IconFileAnalytics',
  'IconFileCertificate',
  'IconFileChart',
  'IconFileCode2',
  'IconFileDatabase',
  'IconFileDescription',
  'IconFileSearch',
  'IconFileText',
  'IconFileTextAi',
  'IconFileTextShield',
  'IconFilter',
  'IconFingerprint',
  'IconFingerprintScan',
  'IconFlag',
  'IconFlask2',
  'IconFolder',
  'IconFolderCode',
  'IconFolderOpen',
  'IconFolderRoot',
  'IconFolderSearch',
  'IconFolderStar',
  'IconFolders',
  'IconGlobe',
  'IconHelpCircle',
  'IconHome',
  'IconHomeShield',
  'IconKey',
  'IconLink',
  'IconListDetails',
  'IconLock',
  'IconMail',
  'IconMailSearch',
  'IconMap2',
  'IconMapPin',
  'IconMapRoute',
  'IconMapShield',
  'IconMessage2',
  'IconMessageCircle',
  'IconMessageChatbot',
  'IconMicroscope',
  'IconNews',
  'IconNotebook',
  'IconNotes',
  'IconPhone',
  'IconPhoneCall',
  'IconPuzzle2',
  'IconRadar2',
  'IconRobot',
  'IconRobotFace',
  'IconRoute',
  'IconRouteScan',
  'IconSatellite',
  'IconScan',
  'IconScanEye',
  'IconSchool',
  'IconSearch',
  'IconServer',
  'IconServer2',
  'IconServerSpark',
  'IconShield',
  'IconShieldCheck',
  'IconShieldLock',
  'IconShieldQuestion',
  'IconSparkles',
  'IconSparkles2',
  'IconStar',
  'IconTarget',
  'IconTargetArrow',
  'IconTelescope',
  'IconTimeline',
  'IconTimelineEvent',
  'IconTopologyComplex',
  'IconTopologyFullHierarchy',
  'IconTopologyStar3',
  'IconUser',
  'IconUserCircle',
  'IconUserScan',
  'IconUserShield',
  'IconUsers',
  'IconUsersGroup',
  'IconWorld',
  'IconWorldSearch',
  'IconZoomQuestion',
] as const;

const GENERATED_TABLER_ICON_REGISTRY: Record<string, AppIconRecord> = Object.fromEntries(
  GENERATED_TABLER_ICON_EXPORT_NAMES.map((exportName) => {
    const slug = pascalToKebabCase(exportName.replace(/^Icon/, ''));
    const searchTerms = [slug, ...slug.split('-')];
    return [
      `tabler:${slug}`,
      createTablerIcon(
        humanizeIconName(slug),
        getTablerIconComponent(exportName),
        deriveAppIconGroup(searchTerms),
        searchTerms
      ),
    ];
  })
);

const TABLER_ICON_REGISTRY = {
  ...GENERATED_TABLER_ICON_REGISTRY,
  ...CURATED_TABLER_ICON_REGISTRY,
} as const satisfies Record<string, AppIconRecord>;

const CURATED_PIXELART_ICON_REGISTRY = {
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

const GENERATED_PIXELART_ICON_REGISTRY: Record<string, AppIconRecord> = Object.fromEntries(
  Object.keys(pixelartIconSet.icons).map((iconName) => {
    const searchTerms = [iconName, ...iconName.split('-')];
    return [
      `pixel:${iconName}`,
      createPixelArtIcon(
        humanizeIconName(iconName),
        iconName,
        deriveAppIconGroup(searchTerms),
        searchTerms
      ),
    ];
  })
);

const PIXELART_ICON_REGISTRY = {
  ...GENERATED_PIXELART_ICON_REGISTRY,
  ...CURATED_PIXELART_ICON_REGISTRY,
} as const satisfies Record<string, AppIconRecord>;

const APP_ICON_REGISTRY = {
  ...TABLER_ICON_REGISTRY,
  ...PIXELART_ICON_REGISTRY,
  ...LUCIDE_ICON_REGISTRY,
} as const;

export type AppIconId = string;

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
