import React from 'react';

/**
 * Basic pulsing box skeleton
 */
export const SkeletonPulse: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse bg-zinc-800 rounded ${className}`} />
);

/**
 * Text simulation skeleton
 */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div
                key={i}
                className="h-2 bg-zinc-800 rounded animate-pulse"
                style={{ width: i === lines - 1 ? '60%' : '100%' }}
            />
        ))}
    </div>
);

/**
 * Specialized card skeleton for the Feed (Trending Topics)
 */
export const SkeletonCard: React.FC = () => (
    <div className="h-full bg-osint-panel border border-zinc-800 p-6 flex flex-col space-y-4">
        <div className="flex justify-between items-start">
            <SkeletonPulse className="w-12 h-4" />
            <SkeletonPulse className="w-16 h-3" />
        </div>
        <div className="space-y-2">
            <SkeletonPulse className="w-full h-5" />
            <SkeletonPulse className="w-3/4 h-5" />
        </div>
        <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-between items-center">
            <SkeletonPulse className="w-20 h-3" />
            <SkeletonPulse className="w-12 h-3" />
        </div>
    </div>
);
