import React from 'react';
import type { MonitorEvent } from '../../../types';
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
        return 'text-green-500 border-green-900 bg-green-900/10';
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
        return { color: 'text-amber-400 border-amber-500 bg-amber-950/30', icon: ShieldQuestion };
      default:
        return { color: 'text-blue-400 border-blue-500 bg-blue-950/30', icon: ShieldCheck };
    }
  };

  const threat = getThreatInfo(event.threatLevel || 'INFO');
  const ThreatIcon = threat.icon;

  return (
    <div
      className={`osint-raised-surface backdrop-blur-sm p-5 flex flex-col gap-3 animate-in slide-in-from-top-4 fade-in duration-500 transition-all shadow-lg ${
        isExpanded
          ? 'border-osint-primary bg-zinc-900/95 md:col-span-2 2xl:col-span-1'
          : 'border-zinc-800 hover:border-osint-primary hover:bg-zinc-900/90 cursor-pointer group'
      }`}
      onClick={() => !isExpanded && onToggle()}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          {getTypeIcon(event.type)}
          <span className="osint-meta-label text-zinc-400">{event.type}</span>
          {isSaved && (
            <span className="osint-meta-label flex items-center text-green-500">
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
        <h4 className="osint-title-inline mb-2 truncate">{event.sourceName}</h4>
        <p
          className={`osint-body-small ${isExpanded ? '' : 'line-clamp-3'}`}
        >
          &quot;{event.content}&quot;
        </p>
      </div>

      {/* Expanded View */}
      {isExpanded && (
            <div className="pt-4 border-t border-zinc-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
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
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between mt-auto">
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
