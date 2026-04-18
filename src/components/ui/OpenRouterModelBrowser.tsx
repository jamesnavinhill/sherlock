import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, RefreshCw, Search, X } from 'lucide-react';
import type { AIModelOption } from '../../config/aiModels';
import {
  getCompactModelChoicesForProvider,
  getEffectiveModelCapabilities,
  getModelOptionById,
  getOpenRouterCatalogSnapshot,
  recordRecentModelSelection,
  refreshOpenRouterModelCatalog,
} from '../../config/aiModels';

interface OpenRouterModelBrowserProps {
  actionButtonClassName?: string;
  closeButtonClassName?: string;
  isOpen: boolean;
  currentModelId?: string;
  onClose: () => void;
  onSelectModel: (modelId: string) => void;
}

const formatCapabilitySummary = (model: AIModelOption): string => {
  const labels = [
    model.capabilities.supportsThinkingBudget ? 'reasoning' : null,
    model.capabilities.supportsStructuredOutput ? 'structured output' : null,
    model.capabilities.supportsWebSearch ? 'web search' : null,
    model.capabilities.supportsToolUse ? 'tools' : null,
  ].filter(Boolean);

  return labels.length > 0 ? labels.join(' • ') : 'basic text output';
};

export const OpenRouterModelBrowser: React.FC<OpenRouterModelBrowserProps> = ({
  actionButtonClassName = 'osint-surface-button px-3 py-2 osint-meta-label-strong',
  closeButtonClassName = 'osint-surface-button p-2',
  isOpen,
  currentModelId,
  onClose,
  onSelectModel,
}) => {
  const [query, setQuery] = useState('');
  const [manualSlug, setManualSlug] = useState('');
  const [catalog, setCatalog] = useState(() => getOpenRouterCatalogSnapshot());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentModel = currentModelId ? getModelOptionById(currentModelId) : undefined;

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setManualSlug('');
    setCatalog(getOpenRouterCatalogSnapshot());
    void (async () => {
      setIsRefreshing(true);
      try {
        const refreshed = await refreshOpenRouterModelCatalog();
        setCatalog({
          fetchedAt: refreshed.fetchedAt,
          isFresh: true,
          models: refreshed.models,
          source: refreshed.source,
        });
      } catch {
        // Keep the bundled or cached fallback visible.
      } finally {
        setIsRefreshing(false);
      }
    })();
  }, [isOpen]);

  const quickPicks = useMemo(
    () => getCompactModelChoicesForProvider('OPENROUTER', currentModelId),
    [currentModelId]
  );

  const filteredCatalog = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return catalog.models.slice(0, 120);

    return catalog.models
      .filter((model) =>
        [model.id, model.name, model.description].join(' ').toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 120);
  }, [catalog.models, query]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] overflow-hidden bg-black/80 backdrop-blur-sm">
      <div className="mx-2 my-2 flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-auto min-h-0 flex-col overflow-hidden border border-zinc-700 bg-black shadow-2xl sm:mx-4 sm:my-4 sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)]">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-6 py-4">
          <div>
            <h3 className="osint-meta-label-strong text-white">Browse OpenRouter Models</h3>
            <p className="mt-1 osint-body-quiet">
              Compact picks up front, full searchable catalog below
            </p>
          </div>
          <button
            onClick={onClose}
            className={closeButtonClassName}
            aria-label="Close OpenRouter model browser"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-6 overflow-hidden p-6 lg:grid-cols-[1.1fr_1.9fr]">
          <section className="min-h-0 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
            <div className="border border-zinc-800 bg-zinc-950/70 p-4">
              <div className="osint-meta-label">Current model</div>
              <div className="mt-2 osint-meta-value text-white">
                {currentModel?.name || currentModelId || 'None selected'}
              </div>
              {currentModelId ? (
                <div className="mt-1 osint-body-quiet">{currentModelId}</div>
              ) : null}
            </div>

            <div className="border border-zinc-800 bg-zinc-950/70 p-4">
              <div className="mb-3 osint-meta-label">Quick picks</div>
              <div className="space-y-2">
                {quickPicks.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      recordRecentModelSelection(model.id);
                      onSelectModel(model.id);
                      onClose();
                    }}
                    className="w-full border border-zinc-800 bg-zinc-900/60 p-3 text-left transition-colors hover:border-osint-primary"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="osint-meta-label-strong text-white">{model.name}</div>
                      {currentModelId === model.id ? (
                        <Check className="h-4 w-4 text-osint-primary" />
                      ) : null}
                    </div>
                    <div className="mt-1 osint-body-quiet">{model.id}</div>
                    <div className="mt-2 osint-body-quiet text-zinc-400">
                      {formatCapabilitySummary(model)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-zinc-800 bg-zinc-950/70 p-4">
              <div className="mb-3 osint-meta-label">Manual slug</div>
              <input
                value={manualSlug}
                onChange={(event) => setManualSlug(event.target.value)}
                placeholder="e.g. openai/gpt-5.4-mini"
                className="osint-input-field w-full px-3 py-2 osint-meta-value"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="osint-body-quiet">
                  Manual entries stay available even if the live catalog changes.
                </div>
                <button
                  onClick={() => {
                    const slug = manualSlug.trim();
                    if (!slug) return;
                    recordRecentModelSelection(slug);
                    onSelectModel(slug);
                    onClose();
                  }}
                  className={actionButtonClassName}
                >
                  Use slug
                </button>
              </div>
            </div>
          </section>

          <section className="min-h-0 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
            <div className="sticky top-0 z-10 flex flex-col gap-3 border border-zinc-800 bg-zinc-950/95 p-4 md:flex-row md:items-center">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search the OpenRouter catalog"
                  className="osint-input-field w-full py-2 pl-10 pr-3 osint-meta-value"
                />
              </label>
              <button
                onClick={() => {
                  setIsRefreshing(true);
                  void refreshOpenRouterModelCatalog({ force: true })
                    .then((refreshed) =>
                      setCatalog({
                        fetchedAt: refreshed.fetchedAt,
                        isFresh: true,
                        models: refreshed.models,
                        source: refreshed.source,
                      })
                    )
                    .finally(() => setIsRefreshing(false));
                }}
                className={actionButtonClassName}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="osint-meta-label text-zinc-500">
              Source: {catalog.source}{' '}
              {catalog.fetchedAt
                ? `• ${new Date(catalog.fetchedAt).toLocaleString()}`
                : '• bundled snapshot'}
            </div>

            <div className="grid gap-3">
              {filteredCatalog.length === 0 ? (
                <div className="border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-8 text-center">
                  <div className="osint-meta-label-strong text-zinc-400">
                    No models match this search
                  </div>
                  <div className="mt-2 osint-body-quiet">
                    Try a broader query or use a manual slug if you already know the model id.
                  </div>
                </div>
              ) : (
                filteredCatalog.map((model) => {
                  const capabilities = getEffectiveModelCapabilities(model.id);

                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        recordRecentModelSelection(model.id);
                        onSelectModel(model.id);
                        onClose();
                      }}
                      className={`border p-4 text-left transition-colors ${
                        currentModelId === model.id
                          ? 'border-osint-primary bg-osint-primary/10'
                          : 'border-zinc-800 bg-zinc-950/70 hover:border-osint-primary'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="osint-meta-label-strong text-white">{model.name}</div>
                          <div className="mt-1 osint-body-quiet">{model.id}</div>
                        </div>
                        {currentModelId === model.id ? (
                          <Check className="h-4 w-4 text-osint-primary" />
                        ) : null}
                      </div>
                      <p className="mt-3 osint-body-small text-zinc-400">{model.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {capabilities.supportsThinkingBudget ? (
                          <span className="osint-pill-shape osint-pill-graph osint-pill-graph-1 px-2 py-1 osint-meta-label-strong">
                            Reasoning
                          </span>
                        ) : null}
                        {capabilities.supportsStructuredOutput ? (
                          <span className="osint-pill-shape osint-pill-graph osint-pill-graph-2 px-2 py-1 osint-meta-label-strong">
                            Structured
                          </span>
                        ) : null}
                        {capabilities.supportsWebSearch ? (
                          <span className="osint-pill-shape osint-pill-graph osint-pill-graph-3 px-2 py-1 osint-meta-label-strong">
                            Web Search
                          </span>
                        ) : null}
                        {capabilities.supportsToolUse ? (
                          <span className="osint-pill-shape osint-pill-graph osint-pill-graph-4 px-2 py-1 osint-meta-label-strong">
                            Tools
                          </span>
                        ) : null}
                        {model.contextLength ? (
                          <span className="osint-shell-chip-muted px-2 py-1 osint-meta-label">
                            {Intl.NumberFormat().format(model.contextLength)} ctx
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};
