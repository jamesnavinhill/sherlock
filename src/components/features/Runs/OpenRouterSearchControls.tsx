import React from 'react';

import { OsintSelect } from '@/components/ui/OsintSelect';

interface OpenRouterSearchControlsProps {
  allowedDomains: string;
  engine: 'auto' | 'native' | 'exa' | 'firecrawl' | 'parallel';
  excludedDomains: string;
  maxResults: number;
  maxTotalResults: number;
  searchContextSize: 'low' | 'medium' | 'high';
  setAllowedDomains: (value: string) => void;
  setEngine: (value: 'auto' | 'native' | 'exa' | 'firecrawl' | 'parallel') => void;
  setExcludedDomains: (value: string) => void;
  setMaxResults: (value: number) => void;
  setMaxTotalResults: (value: number) => void;
  setSearchContextSize: (value: 'low' | 'medium' | 'high') => void;
  setWebSearchEnabled: (value: boolean) => void;
  webSearchEnabled: boolean;
}

export const OpenRouterSearchControls: React.FC<OpenRouterSearchControlsProps> = ({
  allowedDomains,
  engine,
  excludedDomains,
  maxResults,
  maxTotalResults,
  searchContextSize,
  setAllowedDomains,
  setEngine,
  setExcludedDomains,
  setMaxResults,
  setMaxTotalResults,
  setSearchContextSize,
  setWebSearchEnabled,
  webSearchEnabled,
}) => (
  <section className="border border-zinc-800 bg-zinc-900/30 p-4 space-y-4">
    <div className="flex items-center justify-between">
      <label className="osint-meta-label">OpenRouter Web Search</label>
      <button
        type="button"
        onClick={() => setWebSearchEnabled(!webSearchEnabled)}
        aria-pressed={webSearchEnabled}
        data-state={webSearchEnabled ? 'on' : 'off'}
        className="osint-toggle"
      >
        <span className="osint-toggle-thumb" />
      </button>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <label className="block">
        <span className="mb-2 block osint-meta-label">Engine</span>
        <OsintSelect
          ariaLabel="OpenRouter search engine"
          value={engine}
          onChange={(value) => setEngine(value as typeof engine)}
          triggerClassName="rounded-none py-3 pl-3 pr-8 osint-meta-value"
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'native', label: 'Native' },
            { value: 'exa', label: 'Exa' },
            { value: 'parallel', label: 'Parallel' },
            { value: 'firecrawl', label: 'Firecrawl' },
          ]}
        />
      </label>
      <label className="block">
        <span className="mb-2 block osint-meta-label">Context Size</span>
        <OsintSelect
          ariaLabel="OpenRouter search context size"
          value={searchContextSize}
          onChange={(value) => setSearchContextSize(value as typeof searchContextSize)}
          triggerClassName="rounded-none py-3 pl-3 pr-8 osint-meta-value"
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
        />
      </label>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <label className="block">
        <span className="mb-2 block osint-meta-label">Max Results</span>
        <input
          type="number"
          min={1}
          max={25}
          value={maxResults}
          onChange={(event) => setMaxResults(Number(event.target.value) || 1)}
          className="w-full border border-zinc-700 bg-black px-3 py-3 osint-meta-value outline-none focus:border-osint-primary"
        />
      </label>
      <label className="block">
        <span className="mb-2 block osint-meta-label">Max Total Results</span>
        <input
          type="number"
          min={1}
          max={50}
          value={maxTotalResults}
          onChange={(event) => setMaxTotalResults(Number(event.target.value) || 1)}
          className="w-full border border-zinc-700 bg-black px-3 py-3 osint-meta-value outline-none focus:border-osint-primary"
        />
      </label>
    </div>

    <label className="block">
      <span className="mb-2 block osint-meta-label">Allowed Domains</span>
      <textarea
        value={allowedDomains}
        onChange={(event) => setAllowedDomains(event.target.value)}
        placeholder="arxiv.org, sec.gov"
        className="h-20 w-full resize-none border border-zinc-700 bg-black px-3 py-3 osint-meta-value outline-none focus:border-osint-primary"
      />
    </label>

    <label className="block">
      <span className="mb-2 block osint-meta-label">Excluded Domains</span>
      <textarea
        value={excludedDomains}
        onChange={(event) => setExcludedDomains(event.target.value)}
        placeholder="reddit.com"
        className="h-20 w-full resize-none border border-zinc-700 bg-black px-3 py-3 osint-meta-value outline-none focus:border-osint-primary"
      />
    </label>
  </section>
);
