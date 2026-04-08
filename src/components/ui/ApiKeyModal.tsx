import React, { useState } from 'react';
import { setApiKey } from '../../services/runtime';
import { Key, ShieldCheck, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import type { AIProvider } from '../../config/aiModels';
import { AI_PROVIDERS } from '../../config/aiModels';
import { loadSystemConfig } from '../../config/systemConfig';
import { validateApiKey } from '../../services/providers/keys';
import { OsintSelect } from './OsintSelect';

interface ApiKeyModalProps {
  onKeySet: () => void;
  onBypass: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onKeySet, onBypass }) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(
    () => loadSystemConfig().provider
  );
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const normalized = inputKey.trim();
    if (!normalized) {
      setError('API Key cannot be empty');
      return;
    }

    const validation = validateApiKey(selectedProvider, normalized);
    if (!validation.isValid) {
      setError(validation.message || `Invalid ${selectedProvider} API key`);
      return;
    }

    try {
      setApiKey(normalized, selectedProvider);
      onKeySet();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save API key';
      setError(message);
    }
  };

  const placeholderByProvider: Record<AIProvider, string> = {
    GEMINI: 'AIza...',
    OPENROUTER: 'sk-or-v1-...',
    OPENAI: 'sk-...',
    ANTHROPIC: 'sk-ant-...',
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className="max-w-lg w-full bg-osint-panel border border-zinc-700 shadow-2xl relative overflow-hidden">
        {/* Header with decorative elements */}
        <div className="bg-black p-6 border-b border-zinc-800 relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="w-24 h-24 text-white" />
          </div>
          <h2 className="osint-title-section relative z-10 flex items-center text-white">
            <ShieldCheck className="w-6 h-6 mr-3 text-osint-primary" />
            Security Clearance
          </h2>
          <p className="relative z-10 mt-2 osint-body-quiet">
            Sherlock Protocol requires a valid AI provider key.
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div
            className="border-l-2 p-4"
            style={{
              backgroundColor: 'var(--osint-primary-soft-bg)',
              borderColor: 'var(--osint-primary-soft-border)',
            }}
          >
            <p className="osint-body-small text-zinc-300">
              To access this investigative terminal, provide a valid API key for your selected
              provider.
            </p>
          </div>

          <div>
            <label className="mb-2 block osint-meta-label">Provider</label>
            <OsintSelect
              ariaLabel="Provider"
              value={selectedProvider}
              onChange={(value) => {
                setSelectedProvider(value as AIProvider);
                setError('');
              }}
              triggerClassName="p-3 pr-10 osint-meta-value text-white"
              options={AI_PROVIDERS.map((provider) => ({
                value: provider.id,
                label: provider.label,
              }))}
            />
          </div>

          <div>
            <label className="mb-2 block osint-meta-label">Enter API Key</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setError('');
                }}
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                spellCheck={false}
                placeholder={placeholderByProvider[selectedProvider]}
                className="w-full bg-black border border-zinc-700 p-3 pl-10 osint-meta-value text-white focus:border-osint-primary outline-none transition-colors"
              />
            </div>
            {error && (
              <div className="mt-2 flex items-center osint-meta-label osint-danger-text">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {error}
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={handleSave}
              className="osint-button-primary flex w-full items-center justify-center py-3 osint-meta-label-strong"
            >
              Authenticate
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>

            <button
              type="button"
              onClick={onBypass}
              className="w-full border border-zinc-700 bg-zinc-900/60 py-3 osint-meta-label-strong text-zinc-300 transition-colors hover:border-osint-primary hover:text-white"
            >
              Browse Without Key
            </button>

            <div className="space-y-1 text-center osint-body-quiet">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-osint-primary underline decoration-dotted underline-offset-4"
              >
                Get a Gemini key from Google AI Studio
              </a>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-osint-primary underline decoration-dotted underline-offset-4"
              >
                Get an OpenRouter key
              </a>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-osint-primary underline decoration-dotted underline-offset-4"
              >
                Get an OpenAI key
              </a>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-osint-primary underline decoration-dotted underline-offset-4"
              >
                Get an Anthropic key
              </a>
            </div>
          </div>

          <p className="border-t border-zinc-800 pt-4 text-center osint-body-quiet">
            Your key is stored locally in your browser and never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
};
