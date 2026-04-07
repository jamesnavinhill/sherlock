import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/caseStore';
import { Search, FileText, Target, User, Radio, ArrowRight, X, Command, Hash } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Artifact, Workspace, Headline, Entity, WorkspaceRun } from '../../types';
import { CANONICAL_NOUNS, getWorkspaceDisplayTitle } from '../../domain';
import { findWorkspaceLandingArtifact } from '../../app/navigation';
import {
  buildFilesPath,
  buildMonitorPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceHomePath,
  buildWorkspaceNetworkPath,
} from '../../app/routes';

type SearchResult =
  | { type: 'CASE'; title: string; data: Workspace; icon: LucideIcon }
  | { type: 'REPORT'; title: string; data: Artifact; icon: LucideIcon }
  | { type: 'HEADLINE'; title: string; data: Headline; icon: LucideIcon }
  | { type: 'ENTITY'; title: string; icon: LucideIcon };

interface GlobalSearchModalProps {
  artifacts: Artifact[];
  workspaces: Workspace[];
  headlines: Headline[];
  workspaceRuns: WorkspaceRun[];
  setShowGlobalSearch: (show: boolean) => void;
  setActiveTaskId: (id: string | null) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  activeWorkspaceId: string | null;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  artifacts,
  workspaces,
  headlines,
  workspaceRuns,
  setShowGlobalSearch,
  setActiveTaskId,
  setActiveWorkspaceId,
  activeWorkspaceId,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter results based on query
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const output: SearchResult[] = [];

    // Search Workspaces
    workspaces.forEach((c) => {
      const displayTitle = getWorkspaceDisplayTitle(c);
      if (
        displayTitle.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.launchTopic?.toLowerCase().includes(q) ||
        c.launchAngle?.toLowerCase().includes(q) ||
        c.prioritySourcesSummary?.toLowerCase().includes(q)
      ) {
        output.push({ type: 'CASE', title: displayTitle, data: c, icon: Target });
      }
    });

    // Search Reports
    artifacts.forEach((r) => {
      if (r.topic.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q)) {
        output.push({ type: 'REPORT', title: r.topic, data: r, icon: FileText });
      }
    });

    // Search Headlines
    headlines.forEach((h) => {
      if (h.content.toLowerCase().includes(q) || h.source.toLowerCase().includes(q)) {
        output.push({ type: 'HEADLINE', title: h.content, data: h, icon: Radio });
      }
    });

    // Search Entities (extracted from reports)
    const uniqueEntities = new Set<string>();
    artifacts.forEach((r) => {
      const entities = (r.entities ?? []) as Array<Entity | string>;
      entities.forEach((entity) => {
        const name = typeof entity === 'string' ? entity : entity.name;
        if (name.toLowerCase().includes(q)) uniqueEntities.add(name);
      });
    });
    uniqueEntities.forEach((entity) => {
      output.push({ type: 'ENTITY', title: entity, icon: User });
    });

    return output.slice(0, 10); // Limit to 10 results
  }, [query, artifacts, workspaces, headlines]);

  const safeSelectedIndex = results.length === 0 ? 0 : Math.min(selectedIndex, results.length - 1);

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'REPORT') {
      const report = result.data;
      const existingTask = workspaceRuns.find((t) => t.report?.id === report.id);
      setActiveTaskId(existingTask?.id || null);
      if (report.caseId && report.id) {
        setActiveWorkspaceId(report.caseId);
        navigate(buildWorkspaceArtifactPath(report.caseId, report.id));
      } else {
        navigate(buildFilesPath());
      }
    } else if (result.type === 'CASE') {
      setActiveWorkspaceId(result.data.id);
      const landingArtifact = findWorkspaceLandingArtifact(result.data.id, artifacts);
      navigate(
        landingArtifact?.id
          ? buildWorkspaceArtifactPath(result.data.id, landingArtifact.id)
          : buildWorkspaceHomePath(result.data.id)
      );
    } else if (result.type === 'HEADLINE') {
      navigate(buildMonitorPath());
    } else if (result.type === 'ENTITY') {
      const matchingReport = artifacts.find((report) =>
        (report.entities ?? []).some((entity) => {
          const name = typeof entity === 'string' ? entity : entity.name;
          return name.trim().toLowerCase() === result.title.trim().toLowerCase();
        })
      );
      const workspaceId = matchingReport?.caseId || activeWorkspaceId;
      if (workspaceId) {
        setActiveWorkspaceId(workspaceId);
        navigate(buildWorkspaceNetworkPath(workspaceId));
      } else {
        navigate(buildFilesPath());
      }
    }
    setShowGlobalSearch(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && results.length > 0) {
      setSelectedIndex((prev) => (prev + 1) % results.length);
      e.preventDefault();
    } else if (e.key === 'ArrowUp' && results.length > 0) {
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      e.preventDefault();
    } else if (e.key === 'Enter' && results.length > 0) {
      handleSelectResult(results[safeSelectedIndex]);
    } else if (e.key === 'Escape') {
      setShowGlobalSearch(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-osint-panel border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Search Input Area */}
        <div className="flex items-center p-4 border-b border-zinc-800">
          <Search className="w-5 h-5 text-osint-primary mr-4" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search workspaces, artifacts, signals, and entities..."
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-zinc-600"
          />
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded">
              ESC
            </span>
            <button onClick={() => setShowGlobalSearch(false)}>
              <X className="w-4 h-4 text-zinc-500 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[400px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-10 text-center">
              {query ? (
                <p className="text-zinc-500 font-mono text-xs">
                  No workspace records matching &quot;{query}&quot;
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center opacity-20">
                    <Command className="w-12 h-12 mb-2" />
                    <p className="text-xs font-mono uppercase tracking-widest">
                      Sherlock OSINT Index
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="text-[10px] font-mono text-zinc-600 border border-zinc-800/50 p-2 rounded">
                      Search by entity (e.g. @google)
                    </div>
                    <div className="text-[10px] font-mono text-zinc-600 border border-zinc-800/50 p-2 rounded">
                      Jump to saved artifacts
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.title}-${index}`}
                  onClick={() => handleSelectResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center p-3 font-mono text-left transition-colors ${
                    index === safeSelectedIndex
                      ? 'bg-osint-primary/10 border border-osint-primary/30'
                      : 'border border-transparent hover:bg-zinc-900'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center mr-4 ${
                      index === safeSelectedIndex ? 'text-osint-primary' : 'text-zinc-600'
                    }`}
                  >
                    <result.icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-tighter mb-0.5">
                      {result.type === 'CASE'
                        ? CANONICAL_NOUNS.workspace
                        : result.type === 'REPORT'
                          ? CANONICAL_NOUNS.artifact
                          : result.type === 'HEADLINE'
                            ? CANONICAL_NOUNS.signal
                            : 'Entity'}
                    </div>
                    <div className="text-sm text-zinc-200 line-clamp-1">{result.title}</div>
                  </div>
                  <ArrowRight
                    className={`ml-4 w-4 h-4 transition-transform ${
                      index === safeSelectedIndex
                        ? 'translate-x-0 opacity-100 text-osint-primary'
                        : '-translate-x-2 opacity-0'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer bar */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between text-[10px] font-mono text-zinc-600">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Hash className="w-3 h-3 mr-1" /> {artifacts.length + workspaces.length} Indexed Nodes
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <ArrowRight className="w-3 h-3 mr-1" rotate={90} /> Select
            </span>
            <span className="flex items-center">
              <ArrowRight className="w-3 h-3 mr-1" rotate={270} /> Navigate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GlobalSearch: React.FC = () => {
  const {
    artifacts,
    workspaces,
    headlines,
    workspaceRuns,
    showGlobalSearch,
    setShowGlobalSearch,
    setActiveTaskId,
    activeWorkspaceId,
    setActiveWorkspaceId,
  } = useWorkspaceStore();

  if (!showGlobalSearch) return null;

  return (
    <GlobalSearchModal
      artifacts={artifacts}
      workspaces={workspaces}
      headlines={headlines}
      workspaceRuns={workspaceRuns}
      setShowGlobalSearch={setShowGlobalSearch}
      setActiveTaskId={setActiveTaskId}
      setActiveWorkspaceId={setActiveWorkspaceId}
      activeWorkspaceId={activeWorkspaceId}
    />
  );
};
