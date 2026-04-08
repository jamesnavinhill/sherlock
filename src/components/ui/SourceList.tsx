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
export const SourceList: React.FC<SourceListProps> = ({ sources, className = '', maxItems }) => {
  const displaySources = maxItems ? sources.slice(0, maxItems) : sources;
  const hasMore = typeof maxItems === 'number' && sources.length > maxItems;
  const remainingCount = typeof maxItems === 'number' ? Math.max(0, sources.length - maxItems) : 0;

  if (sources.length === 0) {
    return <p className="osint-body-quiet italic">No sources available</p>;
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {displaySources.map((source, idx) => (
        <a
          key={idx}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="osint-link-list-item osint-meta-value block truncate border-b border-zinc-900 p-2 last:border-0 group"
        >
          <div className="flex items-center gap-1">
            <Link2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{source.title || source.url}</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        </a>
      ))}
      {hasMore && (
        <p className="px-2 osint-body-quiet">+{remainingCount} more sources</p>
      )}
    </div>
  );
};
