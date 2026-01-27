import React from 'react';
import { Link2, ExternalLink } from 'lucide-react';
import type { Source } from '../../types';

interface SourceListProps {
    sources: Source[];
    className?: string;
    maxItems?: number;
}

/**
 * Reusable source list component for displaying verified sources
 */
export const SourceList: React.FC<SourceListProps> = ({
    sources,
    className = '',
    maxItems
}) => {
    const displaySources = maxItems ? sources.slice(0, maxItems) : sources;
    const hasMore = typeof maxItems === 'number' && sources.length > maxItems;
    const remainingCount = typeof maxItems === 'number' ? Math.max(0, sources.length - maxItems) : 0;

    if (sources.length === 0) {
        return (
            <p className="text-xs text-zinc-600 font-mono italic">No sources available</p>
        );
    }

    return (
        <div className={`space-y-1 ${className}`}>
            {displaySources.map((source, idx) => (
                <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 hover:bg-zinc-900 text-[10px] font-mono text-blue-400 hover:underline truncate border-b border-zinc-900 last:border-0 group transition-colors"
                >
                    <div className="flex items-center gap-1">
                        <Link2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{source.title || source.url}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                </a>
            ))}
            {hasMore && (
                <p className="text-[10px] text-zinc-600 font-mono px-2">
                    +{remainingCount} more sources
                </p>
            )}
        </div>
    );
};
