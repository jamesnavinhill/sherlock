import React from 'react';

import { Cpu } from 'lucide-react';

import { OsintSelect } from '@/components/ui/OsintSelect';
import { OpenRouterModelBrowser } from '@/components/ui/OpenRouterModelBrowser';
import type { RuntimeConfigFormController } from './useRuntimeConfigForm';

interface ProviderModelSelectorProps {
  form: RuntimeConfigFormController;
  className?: string;
  modelAriaLabel?: string;
  modelHint?: string;
  modelLabel?: string;
  showModelHint?: boolean;
  providerAriaLabel?: string;
  providerHint?: string;
  providerLabel?: string;
  showProvider?: boolean;
}

export const ProviderModelSelector: React.FC<ProviderModelSelectorProps> = ({
  form,
  className = 'grid gap-4 md:grid-cols-2',
  modelAriaLabel = 'Model',
  modelHint,
  modelLabel = 'Model',
  showModelHint = true,
  providerAriaLabel = 'Provider',
  providerHint,
  providerLabel = 'Provider',
  showProvider = true,
}) => {
  const capabilityText = [
    `thinking ${form.supportsThinkingBudget ? 'enabled' : 'off'}`,
    `structured output ${form.selectedModelCapabilities.supportsStructuredOutput ? 'enabled' : 'off'}`,
    `web search ${form.selectedModelCapabilities.supportsWebSearch ? 'enabled' : 'off'}`,
  ].join(', ');

  return (
    <>
      <div className={className}>
        {showProvider ? (
          <section className="border border-zinc-800 bg-zinc-900/30 p-4">
            <label className="mb-2 flex items-center osint-meta-label">
              <Cpu className="mr-2 h-3 w-3 text-osint-primary" />
              {providerLabel}
            </label>
            {providerHint ? (
              <p className="mb-3 osint-body-quiet">{providerHint}</p>
            ) : null}
            <OsintSelect
              ariaLabel={providerAriaLabel}
              value={form.value.provider}
              onChange={(value) => form.setProvider(value as typeof form.value.provider)}
              triggerClassName="p-2 pr-8 osint-meta-value"
              options={form.providerOptions.map((provider) => ({
                value: provider.id,
                label: provider.label,
              }))}
            />
          </section>
        ) : null}

        <section className="border border-zinc-800 bg-zinc-900/30 p-4">
          <label className="mb-2 flex items-center osint-meta-label">
            <Cpu className="mr-2 h-3 w-3 text-osint-primary" />
            {modelLabel}
          </label>
          {showModelHint ? (
            <p className="mb-2 osint-body-quiet">
              {modelHint || `Selected provider: ${form.providerMeta?.label || form.value.provider}`}
            </p>
          ) : null}
          <div className="flex gap-2">
            <div className="flex-1">
              <OsintSelect
                ariaLabel={modelAriaLabel}
                value={form.activeModelId}
                onChange={form.setModelId}
                triggerClassName="p-2 pr-8 osint-meta-value"
                options={form.selectableModels.map((model) => ({
                  value: model.id,
                  label: `${model.name} - ${model.description}`,
                }))}
              />
            </div>
            {form.value.provider === 'OPENROUTER' ? (
              <button
                type="button"
                onClick={() => form.setShowOpenRouterBrowser(true)}
                className="border border-zinc-700 px-3 py-2 osint-meta-label-strong text-zinc-300 transition-colors hover:border-white hover:text-white"
              >
                Browse
              </button>
            ) : null}
          </div>
          <p className="mt-2 osint-body-quiet">Capabilities: {capabilityText}.</p>
        </section>
      </div>

      <OpenRouterModelBrowser
        isOpen={form.showOpenRouterBrowser}
        currentModelId={form.value.provider === 'OPENROUTER' ? form.activeModelId : undefined}
        onClose={() => form.setShowOpenRouterBrowser(false)}
        onSelectModel={(modelId) => {
          form.setModelId(modelId);
          form.setShowOpenRouterBrowser(false);
        }}
      />
    </>
  );
};
