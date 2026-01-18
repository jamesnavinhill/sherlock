
import React, { useState } from 'react';
import { setApiKey } from '../../services/gemini';
import { Key, ShieldCheck, Lock, ArrowRight, AlertTriangle } from 'lucide-react';

interface ApiKeyModalProps {
   onKeySet: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onKeySet }) => {
   const [inputKey, setInputKey] = useState('');
   const [error, setError] = useState('');

   const handleSave = () => {
      if (!inputKey.trim()) {
         setError('API Key cannot be empty');
         return;
      }
      if (!inputKey.startsWith('AIza')) {
         setError('Invalid format. Google keys usually start with "AIza"');
         return;
      }
      setApiKey(inputKey.trim());
      onKeySet();
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
                  Sherlock Protocol requires a valid Neural Engine Key.
               </p>
            </div>

            <div className="p-8 space-y-6">

               <div className="bg-zinc-900/50 border-l-2 border-osint-warn p-4">
                  <p className="text-sm text-zinc-300 font-mono leading-relaxed">
                     To access this investigative terminal, you must provide your own Google Gemini API Key.
                  </p>
               </div>

               <div>
                  <label className="block text-xs font-mono text-zinc-500 uppercase mb-2">Enter Gemini API Key</label>
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
                        placeholder="AIzaSy..."
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
                     className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-bold font-mono uppercase tracking-widest flex items-center justify-center transition-colors hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  >
                     Authenticate
                     <ArrowRight className="w-4 h-4 ml-2" />
                  </button>

                  <a
                     href="https://aistudio.google.com/app/apikey"
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-center text-xs font-mono text-zinc-500 hover:text-osint-primary underline decoration-dotted underline-offset-4"
                  >
                     Get a free API Key from Google AI Studio
                  </a>
               </div>

               <p className="text-[10px] text-zinc-600 text-center font-mono pt-4 border-t border-zinc-800">
                  Your key is stored locally in your browser and never sent to our servers.
               </p>

            </div>
         </div>
      </div>
   );
};