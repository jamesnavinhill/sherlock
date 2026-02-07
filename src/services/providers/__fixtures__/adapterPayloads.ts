export const REPORT_PAYLOAD = {
    summary: { text: 'Investigation summary from fixture.' },
    agendas: ['Potential shell-company layering', { content: 'Watch procurement anomalies' }],
    leads: ['Trace vendor ownership chain', { text: 'Cross-check payment timing' }],
    entities: [
        {
            name: 'Atlas Holdings',
            type: 'ORGANIZATION',
            role: 'Primary contractor',
            sentiment: 'NEGATIVE',
        },
        {
            name: 'Jordan Vale',
            type: 'PERSON',
            role: 'Director',
            sentiment: 'NEUTRAL',
        },
    ],
    sources: [
        {
            title: 'Public Contract Registry',
            url: 'https://example.com/contracts/atlas',
        },
    ],
};

export const FEED_PAYLOAD = [
    {
        id: 'feed-1',
        title: 'Large award spike detected',
        category: 'Finance',
        riskLevel: 'HIGH',
        timestamp: '08:10',
    },
    {
        title: 'Secondary anomaly with partial fields',
        riskLevel: 'UNKNOWN',
    },
];

export const LIVE_PAYLOAD = [
    {
        id: 'evt-1',
        type: 'NEWS',
        sourceName: 'State Ledger',
        content: 'Budget revision posted for Atlas contract lot.',
        timestamp: '5m ago',
        sentiment: 'NEGATIVE',
        threatLevel: 'CAUTION',
        url: 'https://example.com/news/atlas',
    },
    {
        type: 'INVALID',
        sourceName: 42,
        content: { text: 'Malformed item to normalize' },
        timestamp: 123,
        sentiment: 'OTHER',
        threatLevel: 'NONE',
    },
];

const REPORT_JSON = JSON.stringify(REPORT_PAYLOAD);
const FEED_JSON = JSON.stringify(FEED_PAYLOAD);
const LIVE_JSON = JSON.stringify(LIVE_PAYLOAD);

export const OPENAI_FIXTURES = {
    investigate: JSON.stringify({
        choices: [{ message: { content: `\`\`\`json\n${REPORT_JSON}\n\`\`\`` } }],
    }),
    scan: JSON.stringify({
        choices: [{ message: { content: FEED_JSON } }],
    }),
    live: JSON.stringify({
        choices: [{ message: { content: LIVE_JSON } }],
    }),
};

export const OPENROUTER_FIXTURES = {
    investigate: JSON.stringify({
        choices: [{ message: { content: `\`\`\`json\n${REPORT_JSON}\n\`\`\`` } }],
    }),
    scan: JSON.stringify({
        choices: [{ message: { content: FEED_JSON } }],
    }),
    live: JSON.stringify({
        choices: [{ message: { content: LIVE_JSON } }],
    }),
};

export const ANTHROPIC_FIXTURES = {
    investigate: JSON.stringify({
        content: [{ type: 'text', text: `\`\`\`json\n${REPORT_JSON}\n\`\`\`` }],
        stop_reason: 'end_turn',
    }),
    scan: JSON.stringify({
        content: [{ type: 'text', text: FEED_JSON }],
        stop_reason: 'end_turn',
    }),
    live: JSON.stringify({
        content: [{ type: 'text', text: LIVE_JSON }],
        stop_reason: 'end_turn',
    }),
};

export const GEMINI_FIXTURES = {
    investigate: {
        text: REPORT_JSON,
        candidates: [
            {
                groundingMetadata: {
                    groundingChunks: [
                        {
                            web: {
                                title: 'Grounding Source',
                                uri: 'https://example.com/grounding',
                            },
                        },
                    ],
                },
            },
        ],
    },
    scan: {
        text: FEED_JSON,
    },
    live: {
        text: LIVE_JSON,
    },
};
