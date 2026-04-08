import React from 'react';
import { Cpu, Key } from 'lucide-react';

import type { AIProvider } from '@/config/aiModels';
import { ProviderModelSelector } from '@/components/features/Runs/ProviderModelSelector';
import { RuntimeConfigBehaviorControls } from '@/components/features/Runs/RuntimeConfigBehaviorControls';
import { OpenRouterSearchControls } from '@/components/features/Runs/OpenRouterSearchControls';
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
  <div className="space-y-2">
    <label className="block text-[10px] text-zinc-500 font-mono uppercase">{label}</label>
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
        className="flex-1 bg-black border border-zinc-700 text-white p-3 text-xs font-mono focus:border-osint-primary outline-none transition-colors"
      />
      <button
        onClick={onToggleVisibility}
        className="px-4 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors text-xs font-mono"
      >
        {showValue ? 'HIDE' : 'SHOW'}
      </button>
      <button
        onClick={onClear}
        className="osint-button-danger px-4 text-xs font-mono"
        title={`Clear ${provider} key`}
      >
        CLEAR
      </button>
    </div>
  </div>
);

export const SettingsRuntimeTab: React.FC<SettingsRuntimeTabProps> = ({ runtime, saveError }) => (
  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Key className="w-4 h-4 text-osint-primary" />
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">
            Access Credentials
          </h3>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 space-y-4 h-full">
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
            <div className="osint-danger-banner text-[10px] font-mono border px-3 py-2">
              {saveError}
            </div>
          ) : null}

          <p className="text-[9px] text-zinc-600 font-mono italic pt-2">
            Keys are stored locally in your browser.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-osint-primary" />
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">
            Runtime Profile
          </h3>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 space-y-6 h-full">
          <ProviderModelSelector
            form={runtime.form}
            providerLabel="Active Provider"
            providerAriaLabel="Active provider"
            modelLabel="Active Model"
            modelAriaLabel="Active model"
          />

          <p className="text-[10px] text-zinc-500 font-mono">
            TTS{' '}
            {runtime.form.providerMeta?.capabilities.supportsTts ? 'enabled' : 'not available'} for
            the selected provider.
          </p>

          <RuntimeConfigBehaviorControls form={runtime.form} />

          {runtime.form.value.provider === 'OPENROUTER' ? (
            <OpenRouterSearchControls
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
      </section>
    </div>
  </div>
);
