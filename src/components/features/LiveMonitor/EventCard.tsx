import React from 'react';
import type { MonitorEvent } from '../../../types';
import {
  CHROME_CARD_SECTION_CLASS,
  CHROME_CARD_SECTION_SUBTLE_CLASS,
  CHROME_CARD_SURFACE_CLASS,
} from '../../ui/chrome';
import {
  AlertCircle,
  MessageSquare,
  Newspaper,
  Landmark,
  ExternalLink,
  ChevronUp,
  Save,
  Microscope,
  Link as LinkIcon,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from 'lucide-react';

interface EventCardProps {
  event: MonitorEvent;
  isExpanded: boolean;
  isSaved: boolean;
  onToggle: () => void;
  onInvestigate: () => void;
}

/**
 * Individual event card component for the Live Monitor feed.
 * Displays event content with expandable details and actions.
 */
export const EventCard: React.FC<EventCardProps> = ({
  event,
  isExpanded,
  isSaved,
  onToggle,
  onInvestigate,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SOCIAL':
        return <MessageSquare className="w-4 h-4 text-zinc-400" />;
      case 'NEWS':
        return <Newspaper className="w-4 h-4 text-white" />;
      case 'OFFICIAL':
        return <Landmark className="w-4 h-4 text-zinc-300" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'text-osint-success border-osint-success/30 bg-osint-success/10';
      case 'NEGATIVE':
        return 'osint-danger-text border-osint-danger/30 bg-osint-danger/10';
      default:
        return 'text-zinc-500 border-zinc-700 bg-zinc-900/50';
    }
  };

  const getThreatInfo = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return {
          color: 'osint-danger-text border-osint-danger/30 bg-osint-danger/10',
          icon: ShieldAlert,
        };
      case 'CAUTION':
        return {
          color: 'text-osint-warn border-osint-warn/30 bg-osint-warn/10',
          icon: ShieldQuestion,
        };
      default:
        return {
          color: 'text-osint-primary border-osint-primary/30 bg-osint-primary/10',
          icon: ShieldCheck,
        };
    }
  };

  const threat = getThreatInfo(event.threatLevel || 'INFO');
  const ThreatIcon = threat.icon;

  return (
    <div
      className={`${CHROME_CARD_SURFACE_CLASS} flex flex-col gap-3 p-5 transition-all animate-in slide-in-from-top-4 fade-in duration-500 ${
        isExpanded
          ? 'bg-[var(--osint-rail-interaction-active-bg)] shadow-[var(--osint-rail-interaction-shadow)] border-osint-primary md:col-span-2 2xl:col-span-1'
          : 'hover:bg-[var(--osint-rail-interaction-hover-bg)] hover:shadow-[var(--osint-rail-interaction-shadow)] hover:border-osint-primary cursor-pointer group'
      }`}
      onClick={() => !isExpanded && onToggle()}
    >
      {/* Header */}
      <div className={`${CHROME_CARD_SECTION_CLASS} flex items-start justify-between gap-3 px-3 py-3`}>
        <div className="flex items-center space-x-2">
          {getTypeIcon(event.type)}
          <span className="osint-meta-label text-zinc-400">{event.type}</span>
          {isSaved && (
            <span className="osint-meta-label flex items-center text-osint-success">
              <Save className="w-3 h-3 mr-1" /> SAVED
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`osint-meta-label flex items-center border px-2 py-0.5 ${threat.color}`}
          >
            <ThreatIcon className="w-3 h-3 mr-1" />
            {event.threatLevel || 'INFO'}
          </span>
          <span
            className={`osint-meta-label border px-2 py-0.5 ${getSentimentColor(event.sentiment)}`}
          >
            {event.sentiment}
          </span>
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="text-zinc-500 hover:text-white"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h4 className={`osint-title-inline mb-2 truncate transition-colors ${isExpanded ? 'text-osint-primary' : 'group-hover:text-osint-primary'}`}>{event.sourceName}</h4>
        <p
          className={`osint-body-small ${isExpanded ? '' : 'line-clamp-3'}`}
        >
          &quot;{event.content}&quot;
        </p>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div
          className={`${CHROME_CARD_SECTION_SUBTLE_CLASS} space-y-4 px-3 py-3 animate-in fade-in slide-in-from-top-2 duration-200`}
        >
          {/* Source Link */}
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="osint-meta-value flex items-center text-osint-primary transition-colors hover:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <LinkIcon className="w-3 h-3 mr-2" />
              {event.url.length > 50 ? event.url.substring(0, 50) + '...' : event.url}
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="osint-meta-label text-zinc-600">{event.timestamp}</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInvestigate();
              }}
              className={`osint-meta-label-strong flex items-center px-4 py-2 transition-colors ${
                event.threatLevel === 'CRITICAL' ? 'osint-button-danger' : 'osint-button-primary'
              }`}
            >
              <Microscope className="w-3 h-3 mr-2" />
              {event.threatLevel === 'CRITICAL' ? 'Open In Synthesis' : 'Investigate Signal'}
            </button>
          </div>
        </div>
      )}

      {/* Collapsed Footer */}
      {!isExpanded && (
        <div
          className={`${CHROME_CARD_SECTION_SUBTLE_CLASS} mt-auto flex items-center justify-between gap-3 px-3 py-3`}
        >
          <div className="osint-meta-label text-zinc-600">{event.timestamp}</div>
          <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="osint-meta-label flex items-center text-zinc-400">
              Review Signal
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
