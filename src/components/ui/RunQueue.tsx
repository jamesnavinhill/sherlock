import React, { useState } from 'react';
import type { WorkspaceRun } from '../../types';
import {
  Activity,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertOctagon,
  Loader2,
  List,
  Trash2,
} from 'lucide-react';

interface RunQueueProps {
  workspaceRuns: WorkspaceRun[];
  activeRunId: string | null;
  onSelectRun: (runId: string) => void;
  onClearCompleted: () => void;
  isCollapsed: boolean;
  onExpand: () => void;
}

export const RunQueue: React.FC<RunQueueProps> = ({
  workspaceRuns,
  activeRunId,
  onSelectRun,
  onClearCompleted,
  isCollapsed,
  onExpand,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandedLabelClassName = isCollapsed
    ? 'opacity-0 translate-x-1'
    : 'opacity-100 -translate-x-4';

  const runningTasks = workspaceRuns.filter((t) => t.status === 'RUNNING' || t.status === 'QUEUED');
  const completedTasks = workspaceRuns.filter(
    (t) => t.status === 'COMPLETED' || t.status === 'FAILED'
  );

  // Expanded View: Blended List Item
  return (
    <div className="relative border-t border-zinc-800 bg-osint-dark flex-shrink-0">
      {/* Popup List - Anchored to the bottom of the previous element, growing upwards */}
      {!isCollapsed && isExpanded && workspaceRuns.length > 0 && (
        <div className="absolute bottom-full left-0 w-64 mb-1 z-50 px-2 pb-2">
          <div className="bg-osint-panel border border-zinc-700 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col max-h-[400px] w-full animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="bg-black p-3 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-white font-mono font-bold text-[10px] uppercase flex items-center">
                <List className="w-3 h-3 mr-2 text-osint-primary" />
                Operations Log
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-zinc-500 font-mono">
                  {runningTasks.length} Running
                </span>
                {completedTasks.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearCompleted();
                    }}
                    className="text-[10px] text-zinc-500 hover:text-white font-mono p-1 border border-zinc-800 hover:border-zinc-500 transition-colors outline-none focus-visible:border-white focus-visible:text-white"
                    title="Clear Completed Tasks"
                    aria-label="Clear Completed Tasks"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto p-1 space-y-1 flex-1 custom-scrollbar bg-zinc-950/90 max-h-64">
              {runningTasks.length === 0 ? (
                <p className="text-[10px] text-zinc-600 font-mono italic px-2 py-3">
                  No running jobs.
                </p>
              ) : (
                runningTasks
                  .slice()
                  .reverse()
                  .map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        onSelectRun(task.id);
                        setIsExpanded(false);
                      }}
                      className={`w-full text-left p-2 border cursor-pointer transition-all group relative overflow-hidden flex flex-col ${
                        activeRunId === task.id
                          ? 'bg-zinc-800 border-osint-primary'
                          : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full mb-1">
                        <div className="flex items-center space-x-2">
                          {task.status === 'RUNNING' && (
                            <Loader2 className="w-3 h-3 text-osint-primary animate-spin" />
                          )}
                          {task.status === 'QUEUED' && (
                            <div className="w-3 h-3 rounded-full border-2 border-zinc-600 border-t-zinc-400 animate-spin" />
                          )}
                          {task.status === 'COMPLETED' && (
                            <CheckCircle2 className="w-3 h-3 text-osint-primary" />
                          )}
                          {task.status === 'FAILED' && (
                            <AlertOctagon className="w-3 h-3 osint-danger-text" />
                          )}
                          <span
                            className={`text-[9px] font-bold font-mono uppercase ${
                              task.status === 'RUNNING'
                                ? 'text-osint-primary'
                                : task.status === 'COMPLETED'
                                  ? 'text-osint-primary'
                                  : task.status === 'FAILED'
                                    ? 'osint-danger-text'
                                    : 'text-zinc-500'
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>

                      <div
                        className="text-[10px] font-mono text-zinc-300 truncate font-bold pl-5 w-full"
                        title={task.topic}
                      >
                        {task.topic}
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trigger Button - Blends with sidebar nav items */}
      <button
        onClick={() => {
          if (isCollapsed) {
            onExpand();
            return;
          }
          if (workspaceRuns.length > 0) {
            setIsExpanded(!isExpanded);
          }
        }}
        disabled={!isCollapsed && workspaceRuns.length === 0}
        title={isCollapsed ? 'Ops' : undefined}
        aria-label={isCollapsed ? 'Expand Ops' : isExpanded ? 'Collapse Ops' : 'Expand Ops'}
        className={`osint-sidebar-nav-item relative w-full grid grid-cols-[5rem_minmax(0,1fr)] items-center border-l py-4 text-left group outline-none ${
          !isCollapsed && workspaceRuns.length === 0 ? 'opacity-50 cursor-default' : 'cursor-pointer'
        }`}
        data-active={isExpanded ? 'true' : 'false'}
      >
        <div className="relative flex items-center justify-center">
          <div className="relative">
            <Activity
              className={`w-5 h-5 ${runningTasks.length > 0 ? 'text-osint-primary' : 'text-zinc-500 group-hover:text-zinc-300'}`}
            />
            {runningTasks.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-osint-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-osint-primary"></span>
              </span>
            )}
          </div>
        </div>
        <div className={`min-w-0 pr-10 text-left transition-all duration-200 ${expandedLabelClassName}`}>
          <span
            className={`block truncate font-osint-label text-sm font-medium uppercase tracking-wide ${
              runningTasks.length > 0 || isExpanded
                ? 'text-osint-primary'
                : 'text-zinc-500 group-hover:text-zinc-300'
            }`}
          >
            Ops
          </span>
          {runningTasks.length > 0 && (
            <span className="block truncate font-mono text-[10px] text-zinc-600">
              {runningTasks.length} Running
            </span>
          )}
        </div>

        {!isCollapsed && workspaceRuns.length > 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-zinc-400">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        )}
      </button>
    </div>
  );
};
