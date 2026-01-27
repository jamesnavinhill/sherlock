import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED' | string;

interface SentimentBadgeProps {
    sentiment: Sentiment;
    showIcon?: boolean;
    className?: string;
}

/**
 * Sentiment indicator badge with consistent styling
 * Color-coded: POSITIVE (green), NEGATIVE (red), NEUTRAL/MIXED (gray)
 */
export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
    sentiment,
    showIcon = true,
    className = ''
}) => {
    const normalizedSentiment = sentiment?.toUpperCase() || 'NEUTRAL';

    const config: Record<string, { color: string; icon: typeof TrendingUp; label: string }> = {
        POSITIVE: {
            color: 'text-green-500',
            icon: TrendingUp,
            label: 'Positive'
        },
        NEGATIVE: {
            color: 'text-red-500',
            icon: TrendingDown,
            label: 'Negative'
        },
        NEUTRAL: {
            color: 'text-zinc-500',
            icon: Minus,
            label: 'Neutral'
        },
        MIXED: {
            color: 'text-yellow-500',
            icon: Minus,
            label: 'Mixed'
        }
    };

    const sentimentConfig = config[normalizedSentiment] || config.NEUTRAL;
    const Icon = sentimentConfig.icon;

    return (
        <span className={`inline-flex items-center gap-1 text-xs font-mono uppercase ${sentimentConfig.color} ${className}`}>
            {showIcon && <Icon className="w-3 h-3" />}
            <span>{sentimentConfig.label}</span>
        </span>
    );
};

