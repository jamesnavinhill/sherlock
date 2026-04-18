/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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

import { TABLER_RAW_ICON_BY_SLUG } from './tablerIconSvgMap';

export type AppIconPackId = 'lucide' | 'pixelart' | 'tabler';
export type AppIconId = string;

export type AppIconOption = {
  group: string;
  id: AppIconId;
  label: string;
  pack: AppIconPackId;
  searchText: string;
};

export type AppIconMetadata = {
  group: string;
  label: string;
  pack: AppIconPackId;
  searchTerms?: string[];
};

type LucideRecord = AppIconMetadata & {
  component: LucideIcon;
  renderer: 'lucide';
};

type SvgDefinition = {
  body: string;
  fill: string;
  stroke: string;
  strokeLinecap?: string;
  strokeLinejoin?: string;
  strokeWidth?: number;
  viewBox: string;
};

type SvgRecord = AppIconMetadata & {
  getSvgDefinition: () => SvgDefinition;
  renderer: 'svg';
};

type AppIconRecord = LucideRecord | SvgRecord;

type TablerIconSlug = Extract<keyof typeof TABLER_RAW_ICON_BY_SLUG, string>;
type PixelArtIconName = Extract<keyof typeof pixelartIconSet.icons, string>;

type TablerCuratedMetadata = Omit<AppIconMetadata, 'pack'> & {
  slug: TablerIconSlug;
};

type PixelArtCuratedMetadata = Omit<AppIconMetadata, 'pack'> & {
  iconName: PixelArtIconName;
};

const createLucideIcon = (
  label: string,
  component: LucideIcon,
  group: string,
  searchTerms?: string[]
): LucideRecord => ({
  label,
  component,
  group,
  pack: 'lucide',
  renderer: 'lucide',
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
} as const satisfies Record<string, LucideRecord>;

const TABLER_CURATED_METADATA = {
  'tabler:folder': { label: 'Folder', group: 'Core', searchTerms: ['workspace'], slug: 'folder' },
  'tabler:folder-open': {
    label: 'Open Folder',
    group: 'Core',
    searchTerms: ['workspace'],
    slug: 'folder-open',
  },
  'tabler:briefcase': {
    label: 'Briefcase',
    group: 'Core',
    searchTerms: ['case'],
    slug: 'briefcase-2',
  },
  'tabler:robot': { label: 'Robot', group: 'Analysis', searchTerms: ['bot', 'agent'], slug: 'robot' },
  'tabler:brain': { label: 'Brain', group: 'Analysis', searchTerms: ['thinking'], slug: 'brain' },
  'tabler:file-text': {
    label: 'Document',
    group: 'Core',
    searchTerms: ['report', 'note'],
    slug: 'file-text',
  },
  'tabler:file-search': {
    label: 'Research File',
    group: 'Analysis',
    searchTerms: ['investigate'],
    slug: 'file-search',
  },
  'tabler:file-code': {
    label: 'Code File',
    group: 'Data',
    searchTerms: ['source'],
    slug: 'file-code-2',
  },
  'tabler:files': {
    label: 'Files',
    group: 'Core',
    searchTerms: ['documents'],
    slug: 'files',
  },
  'tabler:message': {
    label: 'Message',
    group: 'Comms',
    searchTerms: ['chat'],
    slug: 'message-circle',
  },
  'tabler:network': {
    label: 'Network Topology',
    group: 'Analysis',
    searchTerms: ['graph', 'nodes'],
    slug: 'topology-star-3',
  },
  'tabler:radar': {
    label: 'Radar',
    group: 'Analysis',
    searchTerms: ['signal', 'monitor'],
    slug: 'radar-2',
  },
  'tabler:world': {
    label: 'World',
    group: 'Places',
    searchTerms: ['globe'],
    slug: 'world',
  },
  'tabler:compass': {
    label: 'Compass',
    group: 'Places',
    searchTerms: ['direction'],
    slug: 'compass',
  },
  'tabler:map': { label: 'Map', group: 'Places', searchTerms: ['location'], slug: 'map-2' },
  'tabler:building': {
    label: 'Skyscraper',
    group: 'Places',
    searchTerms: ['organization', 'office'],
    slug: 'building-skyscraper',
  },
  'tabler:landmark': {
    label: 'Bank',
    group: 'Places',
    searchTerms: ['landmark', 'government'],
    slug: 'building-bank',
  },
  'tabler:shield-lock': {
    label: 'Shield Lock',
    group: 'Security',
    searchTerms: ['protect'],
    slug: 'shield-lock',
  },
  'tabler:lock': { label: 'Lock', group: 'Security', searchTerms: ['secure'], slug: 'lock' },
  'tabler:flask': {
    label: 'Flask',
    group: 'Analysis',
    searchTerms: ['lab', 'science'],
    slug: 'flask-2',
  },
  'tabler:microscope': {
    label: 'Microscope',
    group: 'Analysis',
    searchTerms: ['research'],
    slug: 'microscope',
  },
  'tabler:atom': { label: 'Atom', group: 'Analysis', searchTerms: ['science'], slug: 'atom-2' },
  'tabler:book': {
    label: 'Book',
    group: 'Knowledge',
    searchTerms: ['reference'],
    slug: 'book-2',
  },
  'tabler:news': {
    label: 'News',
    group: 'Knowledge',
    searchTerms: ['newspaper', 'media'],
    slug: 'news',
  },
  'tabler:chart': {
    label: 'Chart',
    group: 'Data',
    searchTerms: ['analytics', 'graph'],
    slug: 'chart-bar',
  },
  'tabler:target': {
    label: 'Target Arrow',
    group: 'Analysis',
    searchTerms: ['goal'],
    slug: 'target-arrow',
  },
  'tabler:eye': { label: 'Eye', group: 'Analysis', searchTerms: ['observe'], slug: 'eye' },
  'tabler:sparkles': {
    label: 'Sparkles',
    group: 'Analysis',
    searchTerms: ['highlight', 'magic'],
    slug: 'sparkles',
  },
  'tabler:star': { label: 'Star', group: 'Analysis', searchTerms: ['favorite'], slug: 'star' },
  'tabler:bulb': {
    label: 'Bulb',
    group: 'Analysis',
    searchTerms: ['idea', 'lightbulb'],
    slug: 'bulb',
  },
  'tabler:puzzle': {
    label: 'Puzzle',
    group: 'Analysis',
    searchTerms: ['problem'],
    slug: 'puzzle-2',
  },
  'tabler:help': {
    label: 'Help Circle',
    group: 'Comms',
    searchTerms: ['question'],
    slug: 'help-circle',
  },
  'tabler:link': {
    label: 'Link',
    group: 'Knowledge',
    searchTerms: ['source', 'url'],
    slug: 'link',
  },
  'tabler:user': {
    label: 'User',
    group: 'People',
    searchTerms: ['person', 'profile'],
    slug: 'user',
  },
  'tabler:users': {
    label: 'Users Group',
    group: 'People',
    searchTerms: ['team', 'group'],
    slug: 'users-group',
  },
  'tabler:database': {
    label: 'Database',
    group: 'Data',
    searchTerms: ['storage'],
    slug: 'database',
  },
  'tabler:script': {
    label: 'Script',
    group: 'Knowledge',
    searchTerms: ['scroll', 'note'],
    slug: 'script',
  },
  'tabler:school': {
    label: 'School',
    group: 'Knowledge',
    searchTerms: ['graduate', 'education'],
    slug: 'school',
  },
} as const satisfies Record<string, TablerCuratedMetadata>;

const CURATED_PIXELART_METADATA = {
  'pixel:folder': {
    label: 'Folder',
    group: 'Core',
    iconName: 'folder',
    searchTerms: ['workspace'],
  },
  'pixel:briefcase': {
    label: 'Briefcase',
    group: 'Core',
    iconName: 'briefcase',
    searchTerms: ['case'],
  },
  'pixel:robot': {
    label: 'Robot',
    group: 'Analysis',
    iconName: 'robot',
    searchTerms: ['bot', 'agent'],
  },
  'pixel:robot-face': {
    label: 'Robot Face',
    group: 'Analysis',
    iconName: 'robot-face-happy',
    searchTerms: ['bot', 'assistant'],
  },
  'pixel:file': {
    label: 'File',
    group: 'Core',
    iconName: 'file',
    searchTerms: ['document'],
  },
  'pixel:file-text': {
    label: 'File Text',
    group: 'Core',
    iconName: 'file-text',
    searchTerms: ['report', 'note'],
  },
  'pixel:message': {
    label: 'Message',
    group: 'Comms',
    iconName: 'message',
    searchTerms: ['chat'],
  },
  'pixel:globe': {
    label: 'Globe',
    group: 'Places',
    iconName: 'globe',
    searchTerms: ['world'],
  },
  'pixel:map': {
    label: 'Map',
    group: 'Places',
    iconName: 'map',
    searchTerms: ['location'],
  },
  'pixel:building': {
    label: 'Building',
    group: 'Places',
    iconName: 'building',
    searchTerms: ['organization'],
  },
  'pixel:building-skyscraper': {
    label: 'Skyscraper',
    group: 'Places',
    iconName: 'building-skyscraper',
    searchTerms: ['city', 'office'],
  },
  'pixel:shield': {
    label: 'Shield',
    group: 'Security',
    iconName: 'shield',
    searchTerms: ['protect'],
  },
  'pixel:lock': {
    label: 'Lock',
    group: 'Security',
    iconName: 'lock',
    searchTerms: ['secure'],
  },
  'pixel:book-open': {
    label: 'Open Book',
    group: 'Knowledge',
    iconName: 'book-open',
    searchTerms: ['reference'],
  },
  'pixel:notebook': {
    label: 'Notebook',
    group: 'Knowledge',
    iconName: 'notebook',
    searchTerms: ['notes'],
  },
  'pixel:chart': {
    label: 'Chart Bar Big',
    group: 'Data',
    iconName: 'chart-bar-big',
    searchTerms: ['analytics', 'graph'],
  },
  'pixel:target': {
    label: 'Target',
    group: 'Analysis',
    iconName: 'target',
    searchTerms: ['goal'],
  },
  'pixel:eye': {
    label: 'Eye',
    group: 'Analysis',
    iconName: 'eye',
    searchTerms: ['observe'],
  },
  'pixel:lightbulb': {
    label: 'Lightbulb',
    group: 'Analysis',
    iconName: 'lightbulb-on',
    searchTerms: ['idea'],
  },
  'pixel:link': {
    label: 'Link',
    group: 'Knowledge',
    iconName: 'link',
    searchTerms: ['source', 'url'],
  },
  'pixel:user': {
    label: 'User',
    group: 'People',
    iconName: 'user',
    searchTerms: ['person', 'profile'],
  },
  'pixel:users': {
    label: 'Users',
    group: 'People',
    iconName: 'users',
    searchTerms: ['group', 'team'],
  },
  'pixel:database': {
    label: 'Database',
    group: 'Data',
    iconName: 'database',
    searchTerms: ['storage'],
  },
  'pixel:script': {
    label: 'Script Text',
    group: 'Knowledge',
    iconName: 'script-text',
    searchTerms: ['scroll', 'note'],
  },
} as const satisfies Record<string, PixelArtCuratedMetadata>;

const TABLER_SVG_CACHE = new Map<string, SvgDefinition>();
const iconDataUrlCache = new Map<string, string>();
const CSS_VAR_PATTERN = /var\((--[^),\s]+)(?:,[^)]+)?\)/g;

const normalizeTablerSlug = (value: string): TablerIconSlug | null => {
  if (value in TABLER_RAW_ICON_BY_SLUG) {
    return value as TablerIconSlug;
  }

  const normalized = value
    .replace(/([a-z])(\d+)/g, '$1-$2')
    .replace(/(\d+)([a-z])/g, '$1-$2');

  if (normalized in TABLER_RAW_ICON_BY_SLUG) {
    return normalized as TablerIconSlug;
  }

  return null;
};

const parseRawSvg = (rawSvg: string): SvgDefinition => ({
  body: rawSvg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''),
  fill: rawSvg.match(/\sfill="([^"]+)"/)?.[1] || 'none',
  stroke: rawSvg.match(/\sstroke="([^"]+)"/)?.[1] || 'currentColor',
  strokeLinecap: rawSvg.match(/\sstroke-linecap="([^"]+)"/)?.[1],
  strokeLinejoin: rawSvg.match(/\sstroke-linejoin="([^"]+)"/)?.[1],
  strokeWidth: Number(rawSvg.match(/\sstroke-width="([^"]+)"/)?.[1] || '2'),
  viewBox: rawSvg.match(/\sviewBox="([^"]+)"/)?.[1] || '0 0 24 24',
});

const getTablerSvgDefinition = (slug: TablerIconSlug): SvgDefinition => {
  const cached = TABLER_SVG_CACHE.get(slug);
  if (cached) return cached;

  const parsed = parseRawSvg(TABLER_RAW_ICON_BY_SLUG[slug]);
  TABLER_SVG_CACHE.set(slug, parsed);
  return parsed;
};

const getPixelArtSvgDefinition = (iconName: PixelArtIconName): SvgDefinition => {
  const icon = pixelartIconSet.icons[iconName];
  if (!icon) {
    throw new Error(`Unknown Pixelarticons icon: ${iconName}`);
  }

  return {
    body: icon.body,
    fill: 'currentColor',
    stroke: 'none',
    viewBox: `0 0 ${pixelartIconSet.width} ${pixelartIconSet.height}`,
  };
};

const buildSvgMarkup = (
  definition: SvgDefinition,
  input: {
    color?: string;
    size: number;
    strokeWidth?: number;
  }
) => {
  const fill =
    definition.fill === 'none'
      ? 'none'
      : input.color || (definition.fill === 'currentColor' ? 'currentColor' : definition.fill);
  const stroke =
    definition.stroke === 'none'
      ? 'none'
      : input.color || (definition.stroke === 'currentColor' ? 'currentColor' : definition.stroke);
  const strokeWidth = definition.stroke === 'none' ? undefined : input.strokeWidth ?? definition.strokeWidth;

  const attributes = [
    'xmlns="http://www.w3.org/2000/svg"',
    `width="${input.size}"`,
    `height="${input.size}"`,
    `viewBox="${definition.viewBox}"`,
    `fill="${fill}"`,
    `stroke="${stroke}"`,
    strokeWidth ? `stroke-width="${strokeWidth}"` : '',
    definition.strokeLinecap ? `stroke-linecap="${definition.strokeLinecap}"` : '',
    definition.strokeLinejoin ? `stroke-linejoin="${definition.strokeLinejoin}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `<svg ${attributes}>${definition.body}</svg>`;
};

const getTablerRecord = (iconId: string): SvgRecord | null => {
  const curated = TABLER_CURATED_METADATA[iconId as keyof typeof TABLER_CURATED_METADATA];
  const slug = normalizeTablerSlug(curated?.slug || iconId.slice('tabler:'.length));
  if (!slug) return null;

  const searchTerms = curated?.searchTerms || [slug, ...String(slug).split('-')];
  return {
    label: curated?.label || humanizeIconName(String(slug)),
    getSvgDefinition: () => getTablerSvgDefinition(slug),
    group: curated?.group || deriveAppIconGroup(searchTerms),
    pack: 'tabler',
    renderer: 'svg',
    searchTerms,
  };
};

const getPixelArtRecord = (iconId: string): SvgRecord | null => {
  const curated = CURATED_PIXELART_METADATA[iconId as keyof typeof CURATED_PIXELART_METADATA];
  const iconName = (curated?.iconName || iconId.slice('pixel:'.length)) as PixelArtIconName;

  if (!(iconName in pixelartIconSet.icons)) return null;

  const searchTerms = curated?.searchTerms || [iconName, ...String(iconName).split('-')];
  return {
    label: curated?.label || humanizeIconName(String(iconName)),
    getSvgDefinition: () => getPixelArtSvgDefinition(iconName),
    group: curated?.group || deriveAppIconGroup(searchTerms),
    pack: 'pixelart',
    renderer: 'svg',
    searchTerms,
  };
};

const getAppIconRecord = (iconId?: string | null): AppIconRecord => {
  if (iconId && iconId in LUCIDE_ICON_REGISTRY) {
    return LUCIDE_ICON_REGISTRY[iconId as keyof typeof LUCIDE_ICON_REGISTRY];
  }

  if (iconId?.startsWith('tabler:')) {
    const record = getTablerRecord(iconId);
    if (record) return record;
  }

  if (iconId?.startsWith('pixel:')) {
    const record = getPixelArtRecord(iconId);
    if (record) return record;
  }

  return LUCIDE_ICON_REGISTRY.folder;
};

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

export const getAppIconPackLabel = (pack: AppIconPackId) =>
  APP_ICON_PACKS.find((option) => option.id === pack)?.label || 'Icons';

export const isAppIconId = (value: string | null | undefined): value is AppIconId => {
  if (!value) return false;
  if (value in LUCIDE_ICON_REGISTRY) return true;
  if (value.startsWith('tabler:')) return !!getTablerRecord(value);
  if (value.startsWith('pixel:')) return !!getPixelArtRecord(value);
  return false;
};

export const getAppIconMetadata = (iconId?: string | null): AppIconMetadata => {
  const { group, label, pack, searchTerms } = getAppIconRecord(iconId);
  return { group, label, pack, searchTerms };
};

export const getAppIconLabel = (iconId?: string | null) => getAppIconMetadata(iconId).label;

export const getAppIconPack = (iconId?: string | null): AppIconPackId => getAppIconMetadata(iconId).pack;

export const listAppIconIds = (): AppIconId[] => {
  const ids = new Set<AppIconId>();

  for (const id of Object.keys(LUCIDE_ICON_REGISTRY)) {
    ids.add(id);
  }

  for (const slug of Object.keys(TABLER_RAW_ICON_BY_SLUG)) {
    ids.add(`tabler:${slug}`);
  }

  for (const id of Object.keys(TABLER_CURATED_METADATA)) {
    ids.add(id);
  }

  for (const iconName of Object.keys(pixelartIconSet.icons)) {
    ids.add(`pixel:${iconName}`);
  }

  for (const id of Object.keys(CURATED_PIXELART_METADATA)) {
    ids.add(id);
  }

  return Array.from(ids);
};

const renderAppIconElement = (input: {
  className?: string;
  color?: string;
  iconId?: string | null;
  size?: number;
  strokeWidth?: number;
}) => {
  const record = getAppIconRecord(input.iconId);
  const size = input.size || 18;

  if (record.renderer === 'svg') {
    const markup = buildSvgMarkup(record.getSvgDefinition(), {
      color: input.color,
      size,
      strokeWidth: input.strokeWidth,
    });

    return (
      <span
        aria-hidden
        className={input.className}
        dangerouslySetInnerHTML={{ __html: markup }}
        style={{ display: 'inline-flex', height: size, lineHeight: 0, width: size }}
      />
    );
  }

  const Component = record.component;
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

  const record = getAppIconRecord(resolvedId);
  const markup =
    record.renderer === 'svg'
      ? buildSvgMarkup(record.getSvgDefinition(), {
          color,
          size,
          strokeWidth,
        })
      : renderToStaticMarkup(
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
