import React from 'react';
import { Building2, FileText, Globe, Network, Shapes, User } from 'lucide-react';

import type { Artifact, Entity, Headline } from '@/types';
import { getEntityToneClass } from '@/utils/entityPalette';
import {
  CHROME_THIN_NESTED_ACTION_ITEM_CLASS,
  CHROME_THIN_NESTED_ITEM_BUTTON_CLASS,
} from '@/components/ui/chrome';
import type { GlobalInspectorSection } from './globalInspectorTypes';

export interface InspectorEntityConnection {
  entity: Entity;
  count: number;
}

interface BuildEntityInspectorSectionsArgs {
  entityName: string;
  details: Entity | null;
  detailsTitle: string;
  emptyDetailsMessage: string;
  mentionsTitle: string;
  mentions: Artifact[];
  connections: InspectorEntityConnection[];
  openSection: 'details' | 'mentions' | 'connections' | null;
  toggleSection: (sectionId: 'details' | 'mentions' | 'connections') => void;
  onOpenMention: (report: Artifact) => void;
  getMentionLabel: (report: Artifact) => string;
}

interface BuildHeadlineInspectorSectionsArgs {
  headline: Headline;
  openSection: 'content' | 'source' | null;
  toggleSection: (sectionId: 'content' | 'source') => void;
}

const renderConnectionIcon = (entityType: Entity['type']) => {
  if (entityType === 'PERSON') {
    return <User className={`mr-2 h-3 w-3 ${getEntityToneClass(entityType)} entity-tone-text`} />;
  }
  if (entityType === 'ORGANIZATION') {
    return (
      <Building2 className={`mr-2 h-3 w-3 ${getEntityToneClass(entityType)} entity-tone-text`} />
    );
  }
  return <Shapes className={`mr-2 h-3 w-3 ${getEntityToneClass(entityType)} entity-tone-text`} />;
};

const renderSentimentBadge = (sentiment: Entity['sentiment']) => {
  if (!sentiment) return null;

  return (
    <span
      className={`osint-pill-shape inline-flex items-center border px-2 py-1 osint-meta-label ${
        sentiment === 'NEGATIVE'
          ? 'border-osint-danger/40 bg-osint-danger/10 osint-danger-text'
            : sentiment === 'POSITIVE'
            ? 'border-green-500 text-green-500'
            : 'border-[color:var(--osint-shell-border)] text-[color:var(--osint-text-meta)]'
      }`}
    >
      {sentiment}
    </span>
  );
};

export const buildEntityInspectorSections = ({
  entityName,
  details,
  detailsTitle,
  emptyDetailsMessage,
  mentionsTitle,
  mentions,
  connections,
  openSection,
  toggleSection,
  onOpenMention,
  getMentionLabel,
}: BuildEntityInspectorSectionsArgs): GlobalInspectorSection[] => [
  {
    id: 'details',
    title: detailsTitle,
    isOpen: openSection === 'details',
    onToggle: () => toggleSection('details'),
    content:
      details?.role || details?.sentiment ? (
        <div className="osint-raised-surface p-4 space-y-3">
          {details.role ? (
              <div>
                <div className="mb-1 osint-meta-label">Role</div>
              <div className="osint-body-small text-[color:var(--osint-text-strong)]">
                {details.role}
              </div>
              </div>
          ) : null}
          {details.sentiment ? (
            <div>
              <div className="mb-1 osint-meta-label">Sentiment</div>
              {renderSentimentBadge(details.sentiment)}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="p-2 osint-body-quiet">{emptyDetailsMessage}</p>
      ),
  },
  {
    id: 'mentions',
    title: mentionsTitle,
    icon: FileText,
    count: mentions.length,
    isOpen: openSection === 'mentions',
    onToggle: () => toggleSection('mentions'),
    content: (
      <div className="space-y-1">
        {mentions.length > 0 ? (
          mentions.map((report) => (
            <button
              key={report.id || report.topic}
              type="button"
              onClick={() => onOpenMention(report)}
              className={`${CHROME_THIN_NESTED_ITEM_BUTTON_CLASS} flex items-center gap-2`}
              title={getMentionLabel(report)}
            >
              <FileText className="h-3 w-3 text-current opacity-70" />
              <span className="min-w-0 truncate osint-body-quiet leading-5" style={{ color: 'inherit' }}>
                {getMentionLabel(report)}
              </span>
            </button>
          ))
        ) : (
          <p className="p-2 osint-body-quiet">No direct mentions found.</p>
        )}
      </div>
    ),
  },
  {
    id: 'connections',
    title: 'Network Connections',
    icon: Network,
    count: connections.length,
    isOpen: openSection === 'connections',
    onToggle: () => toggleSection('connections'),
    content: (
      <div className="space-y-1">
        {connections.length > 0 ? (
          connections.map((connection, index) => (
            <div
              key={`${entityName}-${connection.entity.name}-${index}`}
              className={`${CHROME_THIN_NESTED_ACTION_ITEM_CLASS} flex items-center justify-between gap-3`}
            >
              <div className="flex max-w-[70%] items-center truncate">
                {renderConnectionIcon(connection.entity.type)}
                <span
                  className="truncate osint-body-quiet leading-5"
                  style={{ color: 'inherit' }}
                  title={connection.entity.name}
                >
                  {connection.entity.name}
                </span>
              </div>
              <span className="osint-meta-label tabular-nums text-[color:var(--osint-text-meta)]">
                {connection.count}
              </span>
            </div>
          ))
        ) : (
          <p className="p-2 osint-body-quiet">No connections established.</p>
        )}
      </div>
    ),
  },
];

export const buildHeadlineInspectorSections = ({
  headline,
  openSection,
  toggleSection,
}: BuildHeadlineInspectorSectionsArgs): GlobalInspectorSection[] => [
  {
    id: 'content',
    title: 'Captured Content',
    isOpen: openSection === 'content',
    onToggle: () => toggleSection('content'),
    content: (
      <div className="osint-raised-surface p-4">
        <p className="osint-body-small text-[color:var(--osint-text-strong)]">
          &quot;{headline.content}&quot;
        </p>
        <div className="mt-4 border-t border-[color:var(--osint-shell-border)] pt-4 osint-body-quiet">
          <span>TS: {headline.timestamp}</span>
        </div>
      </div>
    ),
  },
  {
    id: 'source',
    title: 'Source Link',
    icon: Globe,
    isOpen: openSection === 'source',
    onToggle: () => toggleSection('source'),
    content: headline.url ? (
      <a
        href={headline.url}
        target="_blank"
        rel="noopener noreferrer"
        className="osint-raised-surface flex items-center justify-between p-4 transition-all hover:border-osint-primary hover:bg-[color:var(--osint-shell-panel-bg)]"
        style={{ color: 'var(--osint-primary)' }}
      >
        <div className="flex items-center overflow-hidden">
          <Globe className="mr-3 h-4 w-4 text-[color:var(--osint-text-meta)]" />
          <span className="truncate osint-meta-value" style={{ color: 'inherit' }}>
            {headline.url}
          </span>
        </div>
      </a>
    ) : (
      <p className="p-2 osint-body-quiet">No source URL is attached to this signal.</p>
    ),
  },
];
