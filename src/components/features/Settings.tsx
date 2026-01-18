import React, { useEffect, useState, useRef } from 'react';
import { SystemConfig, InvestigatorPersona } from '../../types';
import { Save, Cpu, UserCog, Database, Trash2, Check, Info, Settings as SettingsIcon, FileSearch, Shield, Newspaper, Eye, Palette, Download, Upload, Key } from 'lucide-react';
import { clearApiKey } from '../../services/gemini';
import { BackgroundMatrixRain } from '../ui/BackgroundMatrixRain';

const PERSONA_DETAILS: Record<InvestigatorPersona, { label: string; desc: string; icon: any }> = {
   'FORENSIC_ACCOUNTANT': {
      label: 'Forensic Accountant (Default)',
      desc: 'The original Sherlock protocol. Focuses strictly on financial discrepancies, money trails, USASpending.gov data, and regulatory violations. Best for finding hard evidence of fraud and waste.',
      icon: FileSearch
   },
   'JOURNALIST': {
      label: 'Investigative Journalist',
      desc: 'Prioritizes public interest, source verification, and narrative construction. Digs for corruption scandals and human impact stories. Tone is objective but compelling.',
      icon: Newspaper
   },
   'INTELLIGENCE_OFFICER': {
      label: 'Intelligence Analyst',
      desc: 'Focuses on threat assessment, geopolitical risks, and strategic implications. Connects disparate data points to form a security picture. Output is clinical and classified-style.',
      icon: Shield
   },
   'CONSPIRACY_ANALYST': {
      label: 'Pattern Recognition / Fringe',
      desc: 'High-sensitivity mode. Skeptical of official narratives. connecting weak signals to find potential "Deep State" connections. (Warning: Higher rate of speculation).',
      icon: Eye
   }
};

const THEMES = [
   { name: 'Protocol White', color: '#e4e4e7cc', class: 'bg-zinc-200' },
   { name: 'Glacial Cyan', color: '#26bfd3cc', class: 'bg-cyan-300' },
   { name: 'Aurora Green', color: '#36fbaccc', class: 'bg-emerald-300' },
   { name: 'Solar Amber', color: '#f0d681cc', class: 'bg-amber-300' },
   { name: 'Electric Violet', color: '#a79adecc', class: 'bg-violet-300' },
   { name: 'Signal Rose', color: '#d37c8ada', class: 'bg-rose-300' },
];

interface SettingsProps {
   themeColor?: string;
   onThemeChange?: (color: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ themeColor = '#e4e4e7cc', onThemeChange }) => {
   const [config, setConfig] = useState<SystemConfig>({
      modelId: 'gemini-2.5-flash',
      thinkingBudget: 0,
      persona: 'FORENSIC_ACCOUNTANT',
      searchDepth: 'STANDARD'
   });
   const [saved, setSaved] = useState(false);
   const [cleared, setCleared] = useState(false);

   // File Import Ref
   const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      const stored = localStorage.getItem('sherlock_config');
      if (stored) {
         const parsed = JSON.parse(stored);
         // Migration: If user has invalid model stored, switch to default or mapped valid one
         if (parsed.modelId === 'gemini-2.5-flash-latest') {
            parsed.modelId = 'gemini-2.5-flash';
         }
         setConfig(parsed);
      }
   }, []);

   const handleSave = () => {
      localStorage.setItem('sherlock_config', JSON.stringify(config));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
   };

   const handleClearData = () => {
      if (confirm("WARNING: This will purge all local Case Files, Network Links, and Archives. This action cannot be undone.")) {
         localStorage.removeItem('sherlock_archives');
         localStorage.removeItem('sherlock_cases');
         localStorage.removeItem('sherlock_manual_links');
         localStorage.removeItem('sherlock_manual_nodes');
         localStorage.removeItem('sherlock_entity_aliases');
         localStorage.removeItem('sherlock_headlines');
         setCleared(true);
         setTimeout(() => setCleared(false), 3000);
      }
   };

   const handleResetKey = () => {
      if (confirm("Reset API Key? You will need to re-enter it to continue.")) {
         clearApiKey();
         window.location.reload();
      }
   };

   const handleExportJSON = () => {
      const data = {
         version: '2.0.5',
         timestamp: new Date().toISOString(),
         archives: localStorage.getItem('sherlock_archives'),
         cases: localStorage.getItem('sherlock_cases'),
         links: localStorage.getItem('sherlock_manual_links'),
         nodes: localStorage.getItem('sherlock_manual_nodes'),
         aliases: localStorage.getItem('sherlock_entity_aliases'),
         headlines: localStorage.getItem('sherlock_headlines'),
         config: localStorage.getItem('sherlock_config')
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sherlock_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
   };

   const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
         try {
            const json = JSON.parse(event.target?.result as string);

            // Basic validation
            if (!json.version) throw new Error("Invalid backup file format");

            if (json.archives) localStorage.setItem('sherlock_archives', json.archives);
            if (json.cases) localStorage.setItem('sherlock_cases', json.cases);
            if (json.links) localStorage.setItem('sherlock_manual_links', json.links);
            if (json.nodes) localStorage.setItem('sherlock_manual_nodes', json.nodes);
            if (json.aliases) localStorage.setItem('sherlock_entity_aliases', json.aliases);
            if (json.headlines) localStorage.setItem('sherlock_headlines', json.headlines);
            if (json.config) localStorage.setItem('sherlock_config', json.config);

            alert("System restored successfully. Reloading...");
            window.location.reload();
         } catch (err) {
            alert("Failed to import: Invalid JSON file.");
            console.error(err);
         }
      };
      reader.readAsText(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
   };

   const CurrentPersonaIcon = PERSONA_DETAILS[config.persona].icon;

   return (
      <div className="min-h-screen bg-black w-full relative">
         <BackgroundMatrixRain />

         {/* Sticky Header */}
         <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-6">
               <h1 className="text-xl font-bold text-white font-mono flex items-center tracking-wider uppercase">
                  <SettingsIcon className="w-5 h-5 mr-3 text-osint-primary" />
                  SYSTEM_CONFIG
                  <span className="hidden md:inline-block h-6 w-px bg-zinc-800 mx-4"></span>
                  <span className="hidden md:inline-block text-zinc-500 text-xs font-mono tracking-normal lowercase border-l-0">neural engine parameters & protocols</span>
               </h1>
            </div>
         </div>

         <div className="relative z-10 p-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">

            {/* VISUAL AESTHETICS */}
            {onThemeChange && (
               <section className="bg-osint-panel/90 backdrop-blur-md border border-zinc-800 p-6 relative">
                  <h2 className="text-lg font-bold text-white mb-6 font-mono flex items-center uppercase tracking-wider">
                     <Palette className="w-5 h-5 mr-3 text-osint-primary" />
                     Visual Interface
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                     {THEMES.map((t) => (
                        <button
                           key={t.name}
                           onClick={() => onThemeChange(t.color)}
                           className={`relative flex flex-col items-center justify-center p-4 border transition-all duration-300 group overflow-hidden ${themeColor === t.color
                              ? 'border-osint-primary/60 bg-zinc-900 shadow-[0_0_15px_-3px_var(--osint-primary)]'
                              : 'border-zinc-800 bg-black hover:border-zinc-600 hover:bg-zinc-900'
                              }`}
                        >
                           {/* The Color Indicator - Soft outlined circle/swatch */}
                           <div className={`w-6 h-6 rounded-full mb-3 border-2 transition-all duration-300 relative z-10 ${themeColor === t.color ? 'scale-110' : 'opacity-70 group-hover:opacity-100'
                              }`}
                              style={{
                                 borderColor: t.color.substring(0, 7), // Use solid hex for border
                                 backgroundColor: 'transparent', // Hollow center for subtle look
                                 boxShadow: themeColor === t.color ? `0 0 10px ${t.color}` : 'none'
                              }}
                           >
                              {/* Subtle inner fill */}
                              <div className={`absolute inset-0 rounded-full opacity-20 ${t.class}`}></div>
                           </div>

                           <span className={`text-[10px] font-mono uppercase tracking-wider relative z-10 ${themeColor === t.color ? 'text-white font-bold' : 'text-zinc-500 group-hover:text-zinc-300'
                              }`}>
                              {t.name}
                           </span>
                        </button>
                     ))}
                  </div>
                  <p className="mt-4 text-[10px] text-zinc-500 font-mono">
                     * Adjusts accent colors for highlights, matrix rain, and active states. Uses 80% opacity for a holographic glass effect.
                  </p>
               </section>
            )}

            {/* ACCESS CONTROL */}
            <section className="bg-osint-panel/90 backdrop-blur-md border border-zinc-800 p-6">
               <h2 className="text-lg font-bold text-white mb-6 font-mono flex items-center uppercase tracking-wider">
                  <Key className="w-5 h-5 mr-3 text-osint-primary" />
                  Access Control
               </h2>

               <div className="flex flex-col md:flex-row items-center justify-between bg-zinc-900/50 p-4 border border-zinc-800">
                  <div className="mb-4 md:mb-0">
                     <div className="text-sm font-bold text-white font-mono uppercase">API Key Authorization</div>
                     <div className="text-xs text-zinc-500 font-mono">Key is stored locally in this browser.</div>
                  </div>
                  <button
                     onClick={handleResetKey}
                     className="bg-black border border-zinc-700 hover:border-white text-zinc-300 hover:text-white px-4 py-2 font-mono text-xs uppercase transition-colors"
                  >
                     Reset Stored Key
                  </button>
               </div>
            </section>

            {/* MODEL SELECTION */}
            <section className="bg-osint-panel/90 backdrop-blur-md border border-zinc-800 p-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 bg-osint-primary/10 w-full h-1"></div>
               <h2 className="text-lg font-bold text-white mb-6 font-mono flex items-center uppercase tracking-wider">
                  <Cpu className="w-5 h-5 mr-3 text-white" />
                  Neural Engine
               </h2>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                     <label className="block text-xs font-mono text-zinc-500 uppercase mb-2">Target Model</label>
                     <div className="relative">
                        <select
                           value={config.modelId}
                           onChange={(e) => setConfig({ ...config, modelId: e.target.value })}
                           className="w-full bg-black border border-zinc-700 text-white p-3 font-mono text-sm focus:border-osint-primary appearance-none outline-none"
                        >
                           <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Standard / Balanced)</option>
                           <option value="gemini-3-pro-preview">Gemini 3.0 Pro (High Intelligence)</option>
                           <option value="gemini-2.5-flash">Gemini 2.5 Flash (Production Standard)</option>
                           <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Fast / Cost Effective)</option>
                           <option value="gemini-2.5-pro">Gemini 2.5 Pro (Reasoning Expert)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                           <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                     </div>
                     <p className="mt-2 text-[10px] text-zinc-500 font-mono">
                        * 3.0/2.5 Pro recommended for deep tracing. Flash/Lite optimized for high-speed monitoring.
                     </p>
                  </div>

                  <div>
                     <label className="block text-xs font-mono text-zinc-500 uppercase mb-2 flex justify-between">
                        <span>Thinking Budget (Token Allocation)</span>
                        <span className="text-white">{config.thinkingBudget > 0 ? `${config.thinkingBudget}` : 'OFF'}</span>
                     </label>
                     <input
                        type="range"
                        min="0"
                        max="16000"
                        step="1024"
                        value={config.thinkingBudget}
                        onChange={(e) => setConfig({ ...config, thinkingBudget: parseInt(e.target.value) })}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-osint-primary"
                        style={{ accentColor: 'var(--osint-primary)' }}
                     />
                     <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono">
                        <span>Disabled</span>
                        <span>High Reasoning</span>
                     </div>
                     <p className="mt-2 text-[10px] text-zinc-500 font-mono flex items-start">
                        <Info className="w-3 h-3 mr-1 flex-shrink-0" />
                        Allocates tokens for internal reasoning before output. Increases latency but improves deduction accuracy. Only supported on select models.
                     </p>
                  </div>
               </div>
            </section>

            {/* INVESTIGATION PROTOCOLS */}
            <section className="bg-osint-panel/90 backdrop-blur-md border border-zinc-800 p-6">
               <h2 className="text-lg font-bold text-white mb-6 font-mono flex items-center uppercase tracking-wider">
                  <UserCog className="w-5 h-5 mr-3 text-white" />
                  Investigation Protocols
               </h2>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  {/* Persona Selector */}
                  <div>
                     <label className="block text-xs font-mono text-zinc-500 uppercase mb-2">Active Persona</label>
                     <div className="grid grid-cols-1 gap-2">
                        {(Object.keys(PERSONA_DETAILS) as InvestigatorPersona[]).map((p) => (
                           <button
                              key={p}
                              onClick={() => setConfig({ ...config, persona: p })}
                              className={`flex items-center px-4 py-3 border text-sm font-mono text-left transition-all group ${config.persona === p
                                 ? 'border-osint-primary bg-white text-black font-bold'
                                 : 'border-zinc-800 bg-black text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                                 }`}
                           >
                              <div className={`w-2 h-2 rounded-full mr-3 ${config.persona === p ? 'bg-black' : 'bg-zinc-800 group-hover:bg-zinc-600'}`}></div>
                              {PERSONA_DETAILS[p].label}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Persona Description & Additional Options */}
                  <div className="flex flex-col h-full">
                     <div className="flex-1 bg-zinc-900/50 border border-zinc-800 p-5 mb-6">
                        <div className="flex items-center space-x-2 text-white font-mono uppercase text-xs font-bold mb-3">
                           <CurrentPersonaIcon className="w-4 h-4 text-osint-primary" />
                           <span>Protocol Description</span>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed font-mono">
                           {PERSONA_DETAILS[config.persona].desc}
                        </p>
                     </div>

                     <div>
                        <label className="block text-xs font-mono text-zinc-500 uppercase mb-3">Search Grounding Depth</label>
                        <div className="flex bg-black border border-zinc-800 p-1">
                           <button
                              onClick={() => setConfig({ ...config, searchDepth: 'STANDARD' })}
                              className={`flex-1 py-2 text-xs font-mono uppercase transition-colors ${config.searchDepth === 'STANDARD' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                 }`}
                           >
                              Standard
                           </button>
                           <button
                              onClick={() => setConfig({ ...config, searchDepth: 'DEEP' })}
                              className={`flex-1 py-2 text-xs font-mono uppercase transition-colors ${config.searchDepth === 'DEEP' ? 'bg-white text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
                                 }`}
                           >
                              Deep Dive (High Latency)
                           </button>
                        </div>
                        <p className="mt-2 text-[10px] text-zinc-500 font-mono">
                           'Deep Dive' forces the model to prioritize obscure filings and local reporting over mainstream headlines.
                        </p>
                     </div>

                     <div className="pt-4 mt-6 border-t border-zinc-800">
                        <button
                           onClick={handleSave}
                           className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 font-mono uppercase tracking-widest flex items-center justify-center transition-colors hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                           style={{ backgroundColor: themeColor !== '#e4e4e7' ? themeColor : undefined }}
                        >
                           {saved ? <Check className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                           {saved ? "Configuration Saved" : "Save Changes"}
                        </button>
                     </div>
                  </div>
               </div>
            </section>

            {/* DATA MAINTENANCE */}
            <section className="bg-zinc-900/30 backdrop-blur-sm border border-red-900/30 p-6 relative">
               <h2 className="text-lg font-bold text-red-500 mb-6 font-mono flex items-center uppercase tracking-wider">
                  <Database className="w-5 h-5 mr-3" />
                  Data Management
               </h2>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">

                  {/* Backup */}
                  <div className="bg-black/50 p-4 border border-zinc-800">
                     <h3 className="text-sm font-bold text-zinc-300 mb-2 font-mono uppercase">System Backup</h3>
                     <p className="text-xs text-zinc-500 mb-4">Export the entire database (Cases, Graphs, Config) to a local JSON file.</p>
                     <button
                        onClick={handleExportJSON}
                        className="w-full border border-zinc-700 hover:border-white text-zinc-300 hover:text-white py-2 font-mono text-xs uppercase flex items-center justify-center transition-colors"
                     >
                        <Download className="w-4 h-4 mr-2" />
                        Export JSON Database
                     </button>
                  </div>

                  {/* Restore */}
                  <div className="bg-black/50 p-4 border border-zinc-800">
                     <h3 className="text-sm font-bold text-zinc-300 mb-2 font-mono uppercase">System Restore</h3>
                     <p className="text-xs text-zinc-500 mb-4">Import a previously saved JSON database. This will overwrite current data.</p>
                     <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border border-zinc-700 hover:border-white text-zinc-300 hover:text-white py-2 font-mono text-xs uppercase flex items-center justify-center transition-colors"
                     >
                        <Upload className="w-4 h-4 mr-2" />
                        Import JSON Database
                     </button>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImportJSON}
                        accept=".json"
                        className="hidden"
                     />
                  </div>

               </div>

               <div className="flex flex-col md:flex-row items-center justify-between border-t border-zinc-800 pt-6">
                  <div className="mb-4 md:mb-0">
                     <p className="text-sm text-zinc-400 font-mono mb-1">Purge Local Storage</p>
                     <p className="text-xs text-zinc-600 max-w-md">
                        Permanently deletes all cached case files, manually created network links, and setting preferences. This action cannot be undone.
                     </p>
                  </div>

                  <button
                     onClick={handleClearData}
                     className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 px-6 py-3 font-mono text-xs uppercase tracking-wider flex items-center transition-colors"
                  >
                     <Trash2 className="w-4 h-4 mr-2" />
                     {cleared ? "SYSTEM PURGED" : "EXECUTE PURGE"}
                  </button>
               </div>
            </section>

         </div>
      </div>
   );
};