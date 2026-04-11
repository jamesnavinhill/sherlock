import React from 'react';

import { OsintSelect } from '@/components/ui/OsintSelect';
import {
  SETTINGS_INPUT_CLASS,
  SETTINGS_SELECT_TRIGGER_CLASS,
  SETTINGS_TEXTAREA_CLASS,
} from '@/components/features/Settings/settingsUtils';

interface OpenRouterSearchControlsProps {
  allowedDomains: string;
  className?: string;
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
  className = 'border border-zinc-800 bg-zinc-900/30 p-4 space-y-4',
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
  <section className={className}>
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
          triggerClassName={SETTINGS_SELECT_TRIGGER_CLASS}
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
          triggerClassName={SETTINGS_SELECT_TRIGGER_CLASS}
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
          className={SETTINGS_INPUT_CLASS}
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
          className={SETTINGS_INPUT_CLASS}
        />
      </label>
    </div>

    <label className="block">
      <span className="mb-2 block osint-meta-label">Allowed Domains</span>
      <textarea
        value={allowedDomains}
        onChange={(event) => setAllowedDomains(event.target.value)}
        placeholder="arxiv.org, sec.gov"
        className={`${SETTINGS_TEXTAREA_CLASS} h-20`}
      />
    </label>

    <label className="block">
      <span className="mb-2 block osint-meta-label">Excluded Domains</span>
      <textarea
        value={excludedDomains}
        onChange={(event) => setExcludedDomains(event.target.value)}
        placeholder="reddit.com"
        className={`${SETTINGS_TEXTAREA_CLASS} h-20`}
      />
    </label>
  </section>
);
