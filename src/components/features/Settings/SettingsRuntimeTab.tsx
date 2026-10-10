import React from 'react';

import type { AIProvider } from '@/config/aiModels';
import { ProviderModelSelector } from '@/components/features/Runs/ProviderModelSelector';
import { RuntimeConfigBehaviorControls } from '@/components/features/Runs/RuntimeConfigBehaviorControls';
import { OpenRouterSearchControls } from '@/components/features/Runs/OpenRouterSearchControls';
import { Accordion } from '@/components/ui/Accordion';
import {
  SETTINGS_ACCORDION_CLASS,
  SETTINGS_BUTTON_ICON_SM_CLASS,
  SETTINGS_BUTTON_MD_CLASS,
  SETTINGS_CARD_CLASS,
  SETTINGS_INPUT_CLASS,
  SETTINGS_SECTION_BODY_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
} from './settingsUtils';
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
  <div className={`${SETTINGS_CARD_CLASS} flex h-full flex-col gap-3`}>
    <label className="block osint-meta-label">{label}</label>
    <div className="flex flex-1 flex-col gap-2">
      <input
        type={showValue ? 'text' : 'password'}
        value={keyValue}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="new-password"
        data-lpignore="true"
        data-1p-ignore="true"
        spellCheck={false}
        placeholder={`Enter ${provider} API Key...`}
        className={`${SETTINGS_INPUT_CLASS} flex-1`}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onToggleVisibility}
          className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-settings-surface-button-accent-hover min-w-[5.25rem] px-4 osint-meta-label-strong`}
        >
          {showValue ? 'HIDE' : 'SHOW'}
        </button>
        <button
          type="button"
          onClick={onClear}
          className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-settings-surface-button-danger-hover min-w-[5.25rem] px-4 osint-meta-label-strong`}
          title={`Clear ${provider} key`}
        >
          CLEAR
        </button>
      </div>
    </div>
  </div>
);

export const SettingsRuntimeTab: React.FC<SettingsRuntimeTabProps> = ({ runtime, saveError }) => {
  const configuredKeyCount = [
    runtime.geminiKey,
    runtime.openRouterKey,
    runtime.openAIKey,
    runtime.anthropicKey,
    runtime.yrkaKey,
    runtime.mcpGatewayToken,
  ].filter((value) => value.trim().length > 0).length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
      <div className="space-y-4">
        <Accordion
          title="Runtime Profile"
          isOpen={runtime.runtimeSections.runtime}
          onToggle={() => runtime.toggleRuntimeSection('runtime')}
          className={SETTINGS_ACCORDION_CLASS}
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
              browseButtonClassName={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-meta-label-strong`}
              modelBrowserActionButtonClassName={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-meta-label-strong`}
              modelBrowserCloseButtonClassName={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_ICON_SM_CLASS}`}
            />

            <RuntimeConfigBehaviorControls
              form={runtime.form}
              searchDepthSectionClassName={SETTINGS_CARD_CLASS}
              generationSectionClassName={SETTINGS_CARD_CLASS}
              thinkingBudgetClassName={`${SETTINGS_CARD_CLASS} md:col-span-2`}
              optionButtonClassName={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-meta-label-strong`}
            />

            {runtime.form.value.provider === 'OPENROUTER' ||
            runtime.form.value.provider === 'YRKA' ? (
              <OpenRouterSearchControls
                className={SETTINGS_CARD_CLASS}
                providerLabel={
                  runtime.form.value.provider === 'YRKA'
                    ? 'Yrka Web Search (MCP)'
                    : undefined
                }
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
          className={SETTINGS_ACCORDION_CLASS}
          disableActiveHeaderStyle
        >
          <div className={SETTINGS_SECTION_BODY_CLASS}>
            <div className="grid gap-6 xl:grid-cols-2">
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
              <ProviderKeyField
                label="Yrka Gateway Token"
                provider="YRKA"
                keyValue={runtime.yrkaKey}
                showValue={runtime.showYrkaKey}
                onChange={runtime.setYrkaKey}
                onToggleVisibility={() => runtime.setShowYrkaKey((current) => !current)}
                onClear={() => runtime.handleClearProviderKey('YRKA')}
              />
              <div className={`${SETTINGS_CARD_CLASS} flex h-full flex-col gap-3`}>
                <label className="block osint-meta-label">MCP Gateway Token</label>
                <p className="osint-body-quiet text-xs italic">
                  Optional — falls back to the Yrka gateway token when empty.
                </p>
                <div className="flex flex-1 flex-col gap-2">
                  <input
                    type={runtime.showMcpGatewayToken ? 'text' : 'password'}
                    value={runtime.mcpGatewayToken}
                    onChange={(event) => runtime.setMcpGatewayTokenValue(event.target.value)}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    spellCheck={false}
                    placeholder="MCP token for Yrka web search..."
                    className={`${SETTINGS_INPUT_CLASS} flex-1`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => runtime.setShowMcpGatewayToken((current) => !current)}
                      className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-settings-surface-button-accent-hover min-w-[5.25rem] px-4 osint-meta-label-strong`}
                    >
                      {runtime.showMcpGatewayToken ? 'HIDE' : 'SHOW'}
                    </button>
                    <button
                      type="button"
                      onClick={runtime.handleClearMcpGatewayToken}
                      className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-settings-surface-button-danger-hover min-w-[5.25rem] px-4 osint-meta-label-strong`}
                      title="Clear MCP gateway token"
                    >
                      CLEAR
                    </button>
                  </div>
                </div>
              </div>

              {saveError ? (
                <div className="osint-danger-banner osint-meta-label border px-3 py-2 xl:col-span-2">
                  {saveError}
                </div>
              ) : null}

              <p className="pt-2 osint-body-quiet italic xl:col-span-2">
                Keys are stored locally in your browser.
              </p>
            </div>
          </div>
        </Accordion>
      </div>
    </div>
  );
};
