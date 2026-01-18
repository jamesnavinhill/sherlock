/**
 * @deprecated This component is superseded by OperationView.
 * Kept for reference only. Use OperationView for new development.
 * 
 * This legacy component may be removed in a future version.
 * All new investigation UI features should be implemented in OperationView.
 */
import React, { useEffect, useState, useRef } from 'react';
import { generateAudioBriefing } from '../../services/gemini';
import { InvestigationReport, Case, SystemConfig, InvestigatorPersona, Entity, InvestigationTask } from '../../types';
import { ArrowLeft, Link as LinkIcon, AlertOctagon, Lightbulb, FileText, CheckCircle2, FolderPlus, Target, TrendingUp, AlertTriangle, ExternalLink, Users, Microscope, CornerUpLeft, FileSearch, Shield, Newspaper, Eye, Cpu, Rocket, User, Building2, HelpCircle, Layers, PlayCircle, FolderCheck, Volume2, StopCircle, Loader2, FolderOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BackgroundMatrixRain } from '../ui/BackgroundMatrixRain';

interface InvestigationProps {
  task: InvestigationTask;
  onBack: () => void;
  onDeepDive: (lead: string, currentReport: InvestigationReport) => void;
  onJumpToParent: (parentTopic: string) => void;
  onBatchDeepDive: (leads: string[], currentReport: InvestigationReport) => void;
}

// Matrix Rain Component
const MatrixLoader = ({ statusText }: { statusText: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadingStep, setLoadingStep] = useState("INITIALIZING");

  useEffect(() => {
    // Cycle loading text
    const steps = ["INITIALIZING NEURAL LINK", "PARSING OPEN WEB DATA", "REASONING...", "EXTRACTING ENTITIES", "COMPILING DOSSIER"];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % steps.length;
      setLoadingStep(steps[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const chars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charArray = chars.split('');

    const fontSize = 14;
    const columns = width / fontSize;

    const drops: number[] = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--osint-primary').trim();
      ctx.fillStyle = accentColor || '#e4e4e7';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black overflow-hidden h-full min-h-screen">
      <canvas ref={canvasRef} className="absolute inset-0 opacity-60" />
      <div className="relative z-10 bg-black/80 p-8 border border-white/10 backdrop-blur-md max-w-lg w-full">
        <div className="flex items-center space-x-3 mb-4 border-b border-white/20 pb-2">
          <div className="w-3 h-3 bg-osint-primary animate-pulse"></div>
          <h2 className="text-xl font-mono text-osint-primary tracking-[0.2em] font-bold">SYSTEM OVERRIDE</h2>
        </div>
        <div className="font-mono text-sm space-y-2 text-zinc-400">
          <p>{'>'} TARGET: {statusText}</p>
          <p className="text-white">{'>'} STATUS: {loadingStep}...</p>
          <p className="animate-pulse text-osint-primary">_</p>
        </div>
        <div className="mt-6 h-1 w-full bg-zinc-900 overflow-hidden">
          <div className="h-full bg-osint-primary animate-progress-indeterminate"></div>
        </div>
        <div className="mt-4 text-center">
          <button onClick={() => window.dispatchEvent(new CustomEvent('NAVIGATE_BACK'))} className="text-xs text-zinc-600 hover:text-white font-mono uppercase border-b border-transparent hover:border-white">
            Run in Background
          </button>
        </div>
      </div>
    </div>
  );
};

// --- AUDIO HELPERS ---

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> => {
  // raw PCM 24kHz 1 channel (Gemini TTS default for flash)
  // Actually the SDK example suggests it returns raw PCM.
  const sampleRate = 24000;
  const numChannels = 1;

  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const Investigation: React.FC<InvestigationProps> = ({ task, onBack, onDeepDive, onJumpToParent, onBatchDeepDive }) => {
  const [saved, setSaved] = useState(false);
  const [assignedCase, setAssignedCase] = useState<Case | null>(null);

  // Audio State
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // The task prop drives the UI state now.
  const report = task.report;
  const status = task.status;
  const parentContext = task.parentContext;

  useEffect(() => {
    if (status === 'COMPLETED' && report) {
      checkSavedStatus(report);
    }
    // Cleanup audio on unmount or report change
    return () => stopAudio();
  }, [status, report]);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) { }
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  const handlePlayBriefing = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!report?.summary) return;

    setIsAudioLoading(true);
    try {
      const base64Audio = await generateAudioBriefing(report.summary);

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;

      const audioBuffer = await decodeAudioData(decode(base64Audio), ctx);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsPlaying(false);
      };

      source.start();
      sourceNodeRef.current = source;
      setIsPlaying(true);

    } catch (e) {
      console.error("Audio playback failed", e);
      alert("Failed to generate audio briefing.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const checkSavedStatus = (rpt: InvestigationReport) => {
    const existingStr = localStorage.getItem('sherlock_archives');
    const casesStr = localStorage.getItem('sherlock_cases');

    if (existingStr) {
      const archives: InvestigationReport[] = JSON.parse(existingStr);
      // Check ID first if available, otherwise fallback to topic/date match
      const savedVersion = archives.find(r => r.id === rpt.id || (r.topic === rpt.topic && r.dateStr === rpt.dateStr));
      if (savedVersion) {
        setSaved(true);
        if (savedVersion.caseId && casesStr) {
          const cases: Case[] = JSON.parse(casesStr);
          const foundCase = cases.find(c => c.id === savedVersion.caseId);
          if (foundCase) setAssignedCase(foundCase);
        }
        return;
      }
    }
    setSaved(false);
  };

  const renderEntityList = (entities: Entity[]) => {
    // Group by Type
    const people = entities.filter(e => e.type === 'PERSON');
    const orgs = entities.filter(e => e.type === 'ORGANIZATION');
    const unknown = entities.filter(e => e.type === 'UNKNOWN');

    const EntityCard = ({ e }: { e: Entity }) => (
      <a
        href={`https://www.google.com/search?q=${encodeURIComponent(e.name)}+investigation`}
        target="_blank"
        rel="noopener noreferrer"
        className="block mb-2 text-xs font-mono bg-zinc-900/80 hover:bg-osint-primary hover:text-black border border-zinc-700 hover:border-osint-primary transition-colors cursor-pointer group backdrop-blur-sm p-3"
      >
        <div className="flex items-center justify-between mb-1 min-w-0">
          <div className="flex items-center font-bold min-w-0 flex-1 mr-2">
            {e.type === 'PERSON' && <User className="w-3 h-3 mr-2 text-zinc-500 group-hover:text-black flex-shrink-0" />}
            {e.type === 'ORGANIZATION' && <Building2 className="w-3 h-3 mr-2 text-zinc-500 group-hover:text-black flex-shrink-0" />}
            {e.type === 'UNKNOWN' && <HelpCircle className="w-3 h-3 mr-2 text-zinc-500 group-hover:text-black flex-shrink-0" />}
            <span className="truncate" title={e.name}>{e.name}</span>
          </div>
          {e.sentiment && (
            <span className={`text-[9px] uppercase px-1.5 py-0.5 border flex-shrink-0 ${e.sentiment === 'NEGATIVE' ? 'border-red-500 text-red-500 group-hover:border-black group-hover:text-black' :
              e.sentiment === 'POSITIVE' ? 'border-green-500 text-green-500 group-hover:border-black group-hover:text-black' :
                'border-zinc-600 text-zinc-500 group-hover:border-black group-hover:text-black'
              }`}>
              {e.sentiment.substring(0, 3)}
            </span>
          )}
        </div>
        {e.role && <div className="text-zinc-500 group-hover:text-black/70 text-[10px] pl-5 truncate" title={e.role}>{e.role}</div>}
      </a>
    );

    return (
      <div className="space-y-4">
        {people.length > 0 && <div><h4 className="text-[10px] uppercase text-zinc-500 font-mono mb-2 flex items-center"><User className="w-3 h-3 mr-1" /> Individuals</h4>{people.map((e, idx) => <EntityCard key={`p-${idx}`} e={e} />)}</div>}
        {orgs.length > 0 && <div><h4 className="text-[10px] uppercase text-zinc-500 font-mono mb-2 flex items-center"><Building2 className="w-3 h-3 mr-1" /> Organizations</h4>{orgs.map((e, idx) => <EntityCard key={`o-${idx}`} e={e} />)}</div>}
        {unknown.length > 0 && <div><h4 className="text-[10px] uppercase text-zinc-500 font-mono mb-2 flex items-center"><HelpCircle className="w-3 h-3 mr-1" /> Unclassified</h4>{unknown.map((e, idx) => <EntityCard key={`u-${idx}`} e={e} />)}</div>}
      </div>
    );
  };

  // --- RENDER STATES ---

  if (status === 'RUNNING' || status === 'QUEUED') {
    const statusText = parentContext
      ? `SUB-NETWORK: "${task.topic}"`
      : `TARGET: "${task.topic}"`;
    return <MatrixLoader statusText={statusText} />;
  }

  if (status === 'FAILED') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen">
        <AlertOctagon className="w-16 h-16 text-osint-danger mb-4" />
        <h2 className="text-xl text-white font-bold mb-2">OPERATION FAILED</h2>
        <p className="text-zinc-500 font-mono mb-6">{task.error || "Signal interrupted during data acquisition."}</p>
        <button onClick={onBack} className="mt-4 text-white border border-white hover:bg-white hover:text-black px-4 py-2 font-mono uppercase transition-colors">Return to Base</button>
      </div>
    );
  }

  if (!report) return null;

  const markdownComponents = {
    a: ({ node, ...props }: any) => (
      <a {...props} target="_blank" rel="noopener noreferrer" className="text-osint-primary bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded hover:bg-osint-primary hover:text-black transition-all duration-200 font-medium no-underline inline-flex items-center gap-1 mx-0.5 text-[0.95em]">
        {props.children}<ExternalLink className="w-3 h-3 opacity-70" />
      </a>
    ),
    p: ({ node, ...props }: any) => <p className="mb-4 last:mb-0" {...props} />
  };

  return (
    <div className="w-full min-h-screen bg-black relative flex flex-col">
      <BackgroundMatrixRain />

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between shadow-lg flex-shrink-0">

        {/* Left: Back & Title */}
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-zinc-400 hover:text-white transition-colors group mr-6 font-mono text-sm uppercase tracking-wider font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          <div className="h-6 w-px bg-zinc-800 mr-6 hidden md:block"></div>

          <div className="hidden md:flex items-center space-x-3">
            <FileText className="w-5 h-5 text-osint-primary" />
            <h1 className="text-xl font-bold text-white font-mono tracking-wider uppercase">
              OPERATION_VIEW
            </h1>
            <span className="text-zinc-500 text-xs font-mono tracking-normal lowercase border-l border-zinc-800 pl-3 ml-3 hidden lg:inline-block">
              intelligence report & analysis
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          {report.parentTopic && (
            <button
              onClick={() => onJumpToParent(report.parentTopic!)}
              className="hidden md:flex items-center px-4 py-2 rounded-sm font-mono text-xs font-bold transition-colors bg-black border border-zinc-700 hover:border-white text-zinc-400 hover:text-white uppercase"
            >
              <CornerUpLeft className="w-3 h-3 mr-2" />
              Return to Parent
            </button>
          )}

          {/* Status Indicator */}
          <div className={`flex items-center px-4 py-2 rounded-sm font-mono text-xs font-bold uppercase tracking-wider border transition-colors cursor-default ${saved ? 'bg-green-900/10 text-green-500 border-green-900/50' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
            {saved ? (
              <>
                <FolderCheck className="w-3 h-3 mr-2" />
                <span className="hidden sm:inline">Archived to Case</span>
                <span className="sm:hidden">Saved</span>
              </>
            ) : (
              <>
                <FolderPlus className="w-3 h-3 mr-2" />
                <span className="hidden sm:inline">Pending Archive</span>
                <span className="sm:hidden">Pending</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full p-6 md:p-10 animate-in fade-in duration-700 flex-1 relative z-10">

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-8">

            <div className="border-b border-zinc-800 pb-6 bg-black/50 backdrop-blur-sm p-6 rounded-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-white font-mono text-xs uppercase tracking-[0.2em]">
                  <CheckCircle2 className="w-4 h-4 text-osint-primary" />
                  <span>Operation Complete</span>
                </div>
                {assignedCase && (
                  <div className="mt-2 md:mt-0 flex items-center space-x-2 bg-zinc-900 px-3 py-1 border border-zinc-700 shadow-sm">
                    <FolderOpen className="w-4 h-4 text-white" />
                    <span className="text-xs text-white font-mono uppercase tracking-wider">{assignedCase.title}</span>
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-bold text-white uppercase tracking-tight mb-2 font-mono">{report.topic}</h1>
              <div className="flex items-center space-x-4">
                {report.dateStr && <p className="text-zinc-500 text-sm font-mono">LOG DATE: {report.dateStr}</p>}
                {report.parentTopic && <div className="flex items-center text-osint-warn text-xs font-mono"><CornerUpLeft className="w-3 h-3 mr-1" /> LINKED: {report.parentTopic}</div>}
              </div>
            </div>

            <div className="bg-osint-panel/90 backdrop-blur-md p-8 border border-zinc-700 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:bg-white/10"></div>

              <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-2 relative z-10">
                <h2 className="text-xl font-bold text-white flex items-center font-mono tracking-wide">
                  <FileText className="w-5 h-5 mr-3 text-osint-primary" /> EXECUTIVE_SUMMARY
                </h2>

                <button
                  onClick={handlePlayBriefing}
                  disabled={isAudioLoading}
                  className={`flex items-center px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all border ${isPlaying
                    ? 'bg-red-900/20 text-red-400 border-red-900 animate-pulse'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white hover:border-white'
                    }`}
                >
                  {isAudioLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : isPlaying ? (
                    <StopCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <Volume2 className="w-4 h-4 mr-2" />
                  )}
                  {isAudioLoading ? 'Synthesizing...' : isPlaying ? 'Stop Briefing' : 'Voice Briefing'}
                </button>
              </div>

              <div className="text-zinc-300 leading-relaxed font-sans text-lg relative z-10 prose prose-invert max-w-none">
                <ReactMarkdown components={markdownComponents}>{report.summary}</ReactMarkdown>
              </div>
            </div>

            {report.agendas.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-osint-danger/30 pb-2 mb-4 bg-black/30 p-2">
                  <h2 className="text-sm font-mono font-bold text-osint-danger uppercase tracking-widest flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Detected Financial Anomalies</h2>
                </div>
                <div className="grid gap-4">
                  {report.agendas.map((agenda, idx) => (
                    <div key={idx} className="bg-zinc-900/50 backdrop-blur-sm p-5 border-l-2 border-osint-danger flex items-start hover:bg-zinc-900 transition-colors">
                      <div className="flex-shrink-0 mt-1 mr-4">
                        <div className="w-6 h-6 rounded-full bg-osint-danger/20 flex items-center justify-center text-osint-danger"><TrendingUp className="w-3 h-3" /></div>
                      </div>
                      <div className="text-zinc-300 text-base leading-relaxed prose prose-invert max-w-none prose-p:my-0">
                        <ReactMarkdown components={markdownComponents}>{agenda}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.leads.length > 0 && (
              <div className="space-y-4 pt-6">
                <div className="flex items-center justify-between border-b border-zinc-700 pb-2 mb-4 bg-black/30 p-2">
                  <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest flex items-center">
                    <Target className="w-4 h-4 mr-2 text-osint-primary" /> Investigative Leads
                  </h2>
                  <button
                    onClick={() => onBatchDeepDive(report.leads, report)}
                    className="flex items-center text-xs font-mono font-bold text-black bg-osint-primary hover:bg-white px-3 py-1.5 uppercase transition-all shadow-[0_0_10px_-3px_var(--osint-primary)]"
                  >
                    <Layers className="w-4 h-4 mr-2" /> Initialize Full Spectrum Scan
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {report.leads.map((lead, idx) => (
                    <div key={idx} className="bg-osint-surface/80 backdrop-blur-sm border border-zinc-700/60 p-5 hover:border-osint-primary/50 transition-colors relative group flex flex-col justify-between">
                      <div>
                        <div className="absolute top-4 right-4 text-zinc-800 font-mono text-4xl font-bold opacity-50 group-hover:text-zinc-700">{String(idx + 1).padStart(2, '0')}</div>
                        <Lightbulb className="w-6 h-6 text-osint-primary mb-3 opacity-80" />
                        <div className="text-zinc-300 font-medium text-sm leading-relaxed pr-6 prose prose-invert max-w-none prose-p:my-0 mb-4">
                          <ReactMarkdown components={markdownComponents}>{lead}</ReactMarkdown>
                        </div>
                      </div>
                      <button
                        onClick={() => onDeepDive(lead, report)}
                        className="mt-2 w-full flex items-center justify-center bg-zinc-900 hover:bg-white hover:text-black text-zinc-400 py-3 text-xs font-mono font-bold transition-colors uppercase tracking-wider border border-zinc-700 hover:border-transparent group-hover:border-zinc-500"
                      >
                        <Microscope className="w-3 h-3 mr-2" /> DEEP DIVE
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-osint-panel/90 backdrop-blur-md p-6 border border-zinc-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2 flex items-center font-mono">
                <Users className="w-4 h-4 mr-2 text-osint-primary" /> Identified Entities
              </h3>
              {report.entities && report.entities.length > 0 ? renderEntityList(report.entities) : <p className="text-zinc-500 text-sm italic">No specific entities isolated.</p>}
            </div>
            <div className="bg-osint-panel/90 backdrop-blur-md p-6 border border-zinc-800 sticky top-28">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2 font-mono">Verified Sources</h3>
              {report.sources.length === 0 ? <p className="text-zinc-500 text-sm italic">No direct web sources linked in metadata.</p> : (
                <ul className="space-y-3">
                  {report.sources.map((source, idx) => (
                    <li key={idx} className="group">
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-zinc-900/50 hover:bg-zinc-800 transition-colors border-l-2 border-transparent hover:border-osint-primary">
                        <div className="text-sm font-medium text-zinc-200 mb-1 group-hover:text-white truncate">{source.title}</div>
                        <div className="text-xs text-zinc-500 flex items-center truncate"><LinkIcon className="w-3 h-3 mr-1" />{new URL(source.url).hostname}</div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};