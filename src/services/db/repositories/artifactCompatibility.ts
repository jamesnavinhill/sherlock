import {
  buildArtifactFollowUps,
  toLegacyReportArrays,
} from '../../../domain';
import type { Artifact, Entity } from '@/types';
import {
  normalizeHumanText,
  unwrapArrayContainer,
} from '../../../utils/textNormalization';
import { parseStoredJson } from './json';

export interface RawArtifactPayload {
  summary?: string;
  entities?: unknown;
  sources?: unknown;
  keyFindings?: unknown;
  agendas?: unknown;
  leads?: unknown;
  sections?: unknown;
  followUps?: unknown;
  methodology?: unknown;
}

export interface ArtifactMetadataPayload {
  provenance?: Artifact['provenance'];
  [key: string]: unknown;
}

export interface ParsedLegacyArtifactPayload {
  rawPayload: RawArtifactPayload;
  entities: Entity[];
  sources: Artifact['sources'];
  agendas: string[];
  leads: string[];
  followUpTexts: string[];
  methodology?: string;
}

const toEntityList = (value: unknown): Entity[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): Entity | null => {
      if (typeof item === 'string') {
        return { name: item, type: 'UNKNOWN' };
      }
      if (!item || typeof item !== 'object') return null;
      const entity = item as Partial<Entity>;
      if (!entity.name || typeof entity.name !== 'string') return null;
      return {
        name: entity.name,
        type:
          entity.type === 'PERSON' || entity.type === 'ORGANIZATION'
            ? entity.type
            : 'UNKNOWN',
        role: typeof entity.role === 'string' ? entity.role : undefined,
        sentiment:
          entity.sentiment === 'POSITIVE' ||
          entity.sentiment === 'NEGATIVE' ||
          entity.sentiment === 'NEUTRAL'
            ? entity.sentiment
            : undefined,
      };
    })
    .filter((item): item is Entity => !!item);
};

const toStringList = (value: unknown): string[] => {
  const list = unwrapArrayContainer(value, [
    'signals',
    'agendas',
    'items',
    'results',
    'data',
    'list',
  ]);
  const items =
    list.length > 0
      ? list
      : value && typeof value === 'object' && !Array.isArray(value)
        ? [value]
        : [];

  return items
    .map((item) => normalizeHumanText(item).trim())
    .filter((item) => item.length > 0);
};

const toSourceList = (value: unknown): Artifact['sources'] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): { title: string; url: string } | null => {
      if (!item || typeof item !== 'object') return null;
      const source = item as { title?: unknown; url?: unknown; uri?: unknown };
      const title =
        typeof source.title === 'string' && source.title.trim().length > 0
          ? source.title.trim()
          : 'Untitled Source';
      const rawUrl =
        typeof source.url === 'string'
          ? source.url
          : typeof source.uri === 'string'
            ? source.uri
            : '';
      if (!rawUrl) return null;
      return { title, url: rawUrl };
    })
    .filter((item): item is { title: string; url: string } => !!item);
};

export const parseLegacyArtifactPayload = (
  rawText: string | null | undefined
): ParsedLegacyArtifactPayload => {
  const rawPayload =
    rawText && rawText.length > 0
      ? parseStoredJson<RawArtifactPayload | null>(
          rawText,
          null,
          'artifact raw payload'
        ) || {}
      : {};

  return {
    rawPayload,
    entities: toEntityList(rawPayload.entities),
    sources: toSourceList(rawPayload.sources),
    agendas: toStringList(rawPayload.agendas),
    leads: toStringList(rawPayload.leads),
    followUpTexts: toStringList(rawPayload.followUps),
    methodology:
      typeof rawPayload.methodology === 'string'
        ? rawPayload.methodology
        : undefined,
  };
};

export const buildLegacyArtifactArrays = (
  artifact: Artifact
): Pick<Artifact, 'agendas' | 'leads' | 'followUps'> => {
  const fallbackArtifact: Artifact = {
    ...artifact,
    followUps:
      artifact.followUps && artifact.followUps.length > 0
        ? artifact.followUps
        : buildArtifactFollowUps({ leads: artifact.leads }),
  };

  return toLegacyReportArrays(fallbackArtifact);
};
