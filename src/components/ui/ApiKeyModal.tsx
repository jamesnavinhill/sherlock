
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
   const [selectedProvider, setSelectedProvider] = useState<AIProvider>(() => loadSystemConfig().provider);
   const [inputKey, setInputKey] = useState('');
   const [error, setError] = useState('');
   const [showBypassConfirm, setShowBypassConfirm] = useState(false);

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-500">
         <div className="max-w-lg w-full bg-osint-panel border border-zinc-700 shadow-2xl relative overflow-hidden">

            {/* Header with decorative elements */}
            <div className="bg-black p-6 border-b border-zinc-800 relative">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Lock className="w-24 h-24 text-white" />
               </div>
               <h2 className="text-xl font-bold font-mono text-white tracking-widest uppercase flex items-center relative z-10">
                  <ShieldCheck className="w-6 h-6 mr-3 text-osint-primary" />
                  Security Clearance
               </h2>
               <p className="text-zinc-500 font-mono text-xs mt-2 relative z-10">
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
                  <p className="text-sm text-zinc-300 font-mono leading-relaxed">
                     To access this investigative terminal, provide a valid API key for your selected provider.
                  </p>
               </div>

               <div>
                  <label className="block text-xs font-mono text-zinc-500 uppercase mb-2">Provider</label>
                  <OsintSelect
                     ariaLabel="Provider"
                     value={selectedProvider}
                     onChange={(value) => {
                        setSelectedProvider(value as AIProvider);
                        setError('');
                     }}
                     triggerClassName="p-3 pr-10 font-mono text-sm text-white"
                     options={AI_PROVIDERS.map((provider) => ({
                        value: provider.id,
                        label: provider.label,
                     }))}
                  />
               </div>

               <div>
                  <label className="block text-xs font-mono text-zinc-500 uppercase mb-2">Enter API Key</label>
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
                        className="w-full bg-black border border-zinc-700 text-white p-3 pl-10 font-mono text-sm focus:border-osint-primary outline-none transition-colors"
                     />
                  </div>
                  {error && (
                     <div className="mt-2 text-osint-danger text-xs font-mono flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {error}
                     </div>
                  )}
               </div>

               <div className="flex flex-col space-y-3">
                  <button
                     onClick={handleSave}
                     className="osint-button-primary w-full py-3 font-bold font-mono uppercase tracking-widest flex items-center justify-center"
                  >
                     Authenticate
                     <ArrowRight className="w-4 h-4 ml-2" />
                  </button>

                  <button
                     type="button"
                     onClick={() => setShowBypassConfirm(true)}
                     className="w-full py-3 border border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-osint-primary hover:text-white transition-colors font-mono text-xs uppercase tracking-[0.28em]"
                  >
                     Browse Without Key
                  </button>

                  <div className="text-center text-xs font-mono text-zinc-500 space-y-1">
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

               <p className="text-[10px] text-zinc-600 text-center font-mono pt-4 border-t border-zinc-800">
                  Your key is stored locally in your browser and never sent to our servers.
               </p>

            </div>

            {showBypassConfirm && (
               <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
                  <div className="w-full max-w-sm border border-zinc-700 bg-osint-panel p-5 shadow-2xl">
                     <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-osint-primary" />
                        <div className="space-y-3">
                           <div>
                              <h3 className="text-sm font-mono font-bold uppercase tracking-[0.24em] text-white">
                                 Browse First
                              </h3>
                              <p className="mt-2 text-xs font-mono leading-relaxed text-zinc-400">
                                 You can enter the app now and add API keys later in Settings -&gt; AI.
                                 Launching runs or chat without a valid key will bring this clearance screen back.
                              </p>
                           </div>
                           <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                 type="button"
                                 onClick={() => setShowBypassConfirm(false)}
                                 className="px-3 py-2 border border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors font-mono text-[11px] uppercase tracking-[0.18em]"
                              >
                                 Cancel
                              </button>
                              <button
                                 type="button"
                                 onClick={() => {
                                    setShowBypassConfirm(false);
                                    onBypass();
                                 }}
                                 className="osint-button-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em]"
                              >
                                 OK
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};
