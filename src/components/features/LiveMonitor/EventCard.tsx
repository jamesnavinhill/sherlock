import React from 'react';
import { MonitorEvent } from '../../../types';
import {
    AlertCircle, MessageSquare, Newspaper, Landmark,
    ExternalLink, ChevronUp, Save, Microscope, Link as LinkIcon
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
    onInvestigate
}) => {
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'SOCIAL': return <MessageSquare className="w-4 h-4 text-zinc-400" />;
            case 'NEWS': return <Newspaper className="w-4 h-4 text-white" />;
            case 'OFFICIAL': return <Landmark className="w-4 h-4 text-zinc-300" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'POSITIVE': return 'text-green-500 border-green-900 bg-green-900/10';
            case 'NEGATIVE': return 'text-red-500 border-red-900 bg-red-900/10';
            default: return 'text-zinc-500 border-zinc-700 bg-zinc-900/50';
        }
    };

    return (
        <div
            className={`bg-black/80 backdrop-blur-sm border p-5 flex flex-col gap-3 animate-in slide-in-from-top-4 fade-in duration-500 transition-all shadow-lg ${isExpanded
                ? 'border-osint-primary bg-zinc-900/95 md:col-span-2 2xl:col-span-1'
                : 'border-zinc-800 hover:border-osint-primary hover:bg-zinc-900/90 cursor-pointer group'
                }`}
            onClick={() => !isExpanded && onToggle()}
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                    {getTypeIcon(event.type)}
                    <span className="text-xs font-mono font-bold text-zinc-400">{event.type}</span>
                    {isSaved && (
                        <span className="text-[9px] font-mono text-green-500 flex items-center">
                            <Save className="w-3 h-3 mr-1" /> SAVED
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 border ${getSentimentColor(event.sentiment)}`}>
                        {event.sentiment}
                    </span>
                    {isExpanded && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggle(); }}
                            className="text-zinc-500 hover:text-white"
                        >
                            <ChevronUp className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                <h4 className="text-sm font-bold text-zinc-200 mb-2 font-mono truncate">{event.sourceName}</h4>
                <p className={`text-zinc-300 font-medium leading-relaxed font-mono text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>
                    "{event.content}"
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
                            className="flex items-center text-xs font-mono text-osint-primary hover:text-white transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <LinkIcon className="w-3 h-3 mr-2" />
                            {event.url.length > 50 ? event.url.substring(0, 50) + '...' : event.url}
                            <ExternalLink className="w-3 h-3 ml-2" />
                        </a>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] text-zinc-600 font-mono uppercase">
                            {event.timestamp}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onInvestigate(); }}
                            className="flex items-center px-4 py-2 bg-osint-primary text-black font-mono text-xs font-bold uppercase hover:bg-white transition-colors"
                        >
                            <Microscope className="w-3 h-3 mr-2" />
                            Investigate This
                        </button>
                    </div>
                </div>
            )}

            {/* Collapsed Footer */}
            {!isExpanded && (
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between mt-auto">
                    <div className="text-[10px] text-zinc-600 font-mono uppercase">
                        {event.timestamp}
                    </div>
                    <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-zinc-400 flex items-center font-mono uppercase">
                            Click to Expand
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
