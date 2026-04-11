import React from 'react';

import type { AIProvider } from '@/config/aiModels';
import { ProviderModelSelector } from '@/components/features/Runs/ProviderModelSelector';
import { RuntimeConfigBehaviorControls } from '@/components/features/Runs/RuntimeConfigBehaviorControls';
import { OpenRouterSearchControls } from '@/components/features/Runs/OpenRouterSearchControls';
import { Accordion } from '@/components/ui/Accordion';
import { SETTINGS_CARD_CLASS, SETTINGS_SECTION_BODY_CLASS } from './settingsUtils';
import type { SettingsRuntimeState } from './useSettingsRuntimeState';

interface SettingsRuntimeTabProps {
  runtime: SettingsRuntimeState;
  saveError: string;
}

const ProviderKeyField: React.FC<{
  keyValue: string;
  label: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onToggleVisibility: () => void;
  provider: AIProvider;
  showValue: boolean;
}> = ({ keyValue, label, onChange, onClear, onToggleVisibility, provider, showValue }) => (
  <div className={`${SETTINGS_CARD_CLASS} space-y-2`}>
    <label className="block osint-meta-label">{label}</label>
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type={showValue ? 'text' : 'password'}
        value={keyValue}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="new-password"
        data-lpignore="true"
        data-1p-ignore="true"
        spellCheck={false}
        placeholder={`Enter ${provider} API Key...`}
        className="flex-1 bg-black border border-zinc-700 p-3 osint-meta-value focus:border-osint-primary outline-none transition-colors"
      />
      <button
        onClick={onToggleVisibility}
        className="px-4 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors osint-meta-label-strong"
      >
        {showValue ? 'HIDE' : 'SHOW'}
      </button>
      <button
        onClick={onClear}
        className="osint-button-danger px-4 osint-meta-label-strong"
        title={`Clear ${provider} key`}
      >
        CLEAR
      </button>
    </div>
  </div>
);

export const SettingsRuntimeTab: React.FC<SettingsRuntimeTabProps> = ({ runtime, saveError }) => {
  const configuredKeyCount = [
    runtime.geminiKey,
    runtime.openRouterKey,
    runtime.openAIKey,
    runtime.anthropicKey,
  ].filter((value) => value.trim().length > 0).length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
      <div className="space-y-4">
        <Accordion
          title="Runtime Profile"
          isOpen={runtime.runtimeSections.runtime}
          onToggle={() => runtime.toggleRuntimeSection('runtime')}
          disableActiveHeaderStyle
        >
          <div className={SETTINGS_SECTION_BODY_CLASS}>
            <ProviderModelSelector
              form={runtime.form}
              providerLabel="Active Provider"
              providerAriaLabel="Active provider"
              modelLabel="Active Model"
              modelAriaLabel="Active model"
              showModelHint={false}
              providerSectionClassName={SETTINGS_CARD_CLASS}
              modelSectionClassName={SETTINGS_CARD_CLASS}
            />

            <p className="osint-meta-label">
              TTS {runtime.form.providerMeta?.capabilities.supportsTts ? 'enabled' : 'not available'}.
            </p>

            <RuntimeConfigBehaviorControls
              form={runtime.form}
              searchDepthSectionClassName={SETTINGS_CARD_CLASS}
              generationSectionClassName={SETTINGS_CARD_CLASS}
              thinkingBudgetClassName={`${SETTINGS_CARD_CLASS} md:col-span-2`}
            />

            {runtime.form.value.provider === 'OPENROUTER' ? (
              <OpenRouterSearchControls
                className={SETTINGS_CARD_CLASS}
                webSearchEnabled={runtime.openRouterWebSearchEnabled}
                setWebSearchEnabled={runtime.setOpenRouterWebSearchEnabled}
                engine={runtime.openRouterEngine}
                setEngine={runtime.setOpenRouterEngine}
                maxResults={runtime.openRouterMaxResults}
                setMaxResults={runtime.setOpenRouterMaxResults}
                maxTotalResults={runtime.openRouterMaxTotalResults}
                setMaxTotalResults={runtime.setOpenRouterMaxTotalResults}
                searchContextSize={runtime.openRouterSearchContextSize}
                setSearchContextSize={runtime.setOpenRouterSearchContextSize}
                allowedDomains={runtime.openRouterAllowedDomains}
                setAllowedDomains={runtime.setOpenRouterAllowedDomains}
                excludedDomains={runtime.openRouterExcludedDomains}
                setExcludedDomains={runtime.setOpenRouterExcludedDomains}
              />
            ) : null}
          </div>
        </Accordion>

        <Accordion
          title="Access Credentials"
          count={configuredKeyCount}
          isOpen={runtime.runtimeSections.apiKeys}
          onToggle={() => runtime.toggleRuntimeSection('apiKeys')}
          disableActiveHeaderStyle
        >
          <div className={SETTINGS_SECTION_BODY_CLASS}>
            <div className="space-y-6">
              <ProviderKeyField
                label="Google Gemini API Key"
                provider="GEMINI"
                keyValue={runtime.geminiKey}
                showValue={runtime.showGeminiKey}
                onChange={runtime.setGeminiKey}
                onToggleVisibility={() => runtime.setShowGeminiKey((current) => !current)}
                onClear={() => runtime.handleClearProviderKey('GEMINI')}
              />
              <ProviderKeyField
                label="OpenRouter API Key"
                provider="OPENROUTER"
                keyValue={runtime.openRouterKey}
                showValue={runtime.showOpenRouterKey}
                onChange={runtime.setOpenRouterKey}
                onToggleVisibility={() => runtime.setShowOpenRouterKey((current) => !current)}
                onClear={() => runtime.handleClearProviderKey('OPENROUTER')}
              />
              <ProviderKeyField
                label="OpenAI API Key"
                provider="OPENAI"
                keyValue={runtime.openAIKey}
                showValue={runtime.showOpenAIKey}
                onChange={runtime.setOpenAIKey}
                onToggleVisibility={() => runtime.setShowOpenAIKey((current) => !current)}
                onClear={() => runtime.handleClearProviderKey('OPENAI')}
              />
              <ProviderKeyField
                label="Anthropic API Key"
                provider="ANTHROPIC"
                keyValue={runtime.anthropicKey}
                showValue={runtime.showAnthropicKey}
                onChange={runtime.setAnthropicKey}
                onToggleVisibility={() => runtime.setShowAnthropicKey((current) => !current)}
                onClear={() => runtime.handleClearProviderKey('ANTHROPIC')}
              />

              {saveError ? (
                <div className="osint-danger-banner osint-meta-label border px-3 py-2">
                  {saveError}
                </div>
              ) : null}

              <p className="pt-2 osint-body-quiet italic">
                Keys are stored locally in your browser.
              </p>
            </div>
          </div>
        </Accordion>
      </div>
    </div>
  );
};
