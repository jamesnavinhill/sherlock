import React, { useState } from 'react';
import type { InvestigationTask } from '../../types';
import { Activity, ChevronUp, ChevronDown, CheckCircle2, AlertOctagon, Loader2, List, Trash2 } from 'lucide-react';

interface TaskManagerProps {
  tasks: InvestigationTask[];
  activeTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onClearCompleted: () => void;
  isCollapsed: boolean;
  onExpand: () => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ tasks, activeTaskId, onSelectTask, onClearCompleted, isCollapsed, onExpand }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const runningTasks = tasks.filter(t => t.status === 'RUNNING' || t.status === 'QUEUED');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'FAILED');

  // Collapsed View: Just an icon in the sidebar flow
  if (isCollapsed) {
    return (
      <button
        onClick={onExpand}
        className="w-full py-4 flex justify-center items-center text-zinc-500 hover:bg-zinc-900 hover:text-white relative group border-t border-zinc-800 transition-colors flex-shrink-0 outline-none focus-visible:bg-zinc-900 focus-visible:text-white"
        title="Active Operations"
        aria-label="Expand Operations Log"
      >
        {runningTasks.length > 0 && (
          <span className="absolute top-3 right-3 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-osint-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-osint-primary"></span>
          </span>
        )}
        <Activity className={`w-5 h-5 ${runningTasks.length > 0 ? 'text-osint-primary' : ''}`} />
      </button>
    );
  }

  // Expanded View: Blended List Item
  return (
    <div className="relative border-t border-zinc-800 bg-osint-dark flex-shrink-0">

      {/* Popup List - Anchored to the bottom of the previous element, growing upwards */}
      {isExpanded && tasks.length > 0 && (
        <div className="absolute bottom-full left-0 w-64 mb-1 z-50 px-2 pb-2">
          <div className="bg-osint-panel border border-zinc-700 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col max-h-[400px] w-full animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="bg-black p-3 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-white font-mono font-bold text-[10px] uppercase flex items-center">
                <List className="w-3 h-3 mr-2 text-osint-primary" />
                Operations Log
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-zinc-500 font-mono">{runningTasks.length} Running</span>
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
                <p className="text-[10px] text-zinc-600 font-mono italic px-2 py-3">No running jobs.</p>
              ) : (
                runningTasks.slice().reverse().map(task => (
                  <button
                    key={task.id}
                    onClick={() => {
                      onSelectTask(task.id);
                      setIsExpanded(false);
                    }}
                    className={`w-full text-left p-2 border cursor-pointer transition-all group relative overflow-hidden flex flex-col ${activeTaskId === task.id
                      ? 'bg-zinc-800 border-osint-primary'
                      : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-600'
                      }`}
                  >
                    <div className="flex justify-between items-center w-full mb-1">
                      <div className="flex items-center space-x-2">
                        {task.status === 'RUNNING' && <Loader2 className="w-3 h-3 text-osint-primary animate-spin" />}
                        {task.status === 'QUEUED' && <div className="w-3 h-3 rounded-full border-2 border-zinc-600 border-t-zinc-400 animate-spin" />}
                        {task.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-osint-primary" />}
                        {task.status === 'FAILED' && <AlertOctagon className="w-3 h-3 text-red-500" />}
                        <span className={`text-[9px] font-bold font-mono uppercase ${task.status === 'RUNNING' ? 'text-osint-primary' :
                          task.status === 'COMPLETED' ? 'text-osint-primary' :
                            task.status === 'FAILED' ? 'text-red-500' : 'text-zinc-500'
                          }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-zinc-300 truncate font-bold pl-5 w-full" title={task.topic}>
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
        onClick={() => tasks.length > 0 ? setIsExpanded(!isExpanded) : null}
        disabled={tasks.length === 0}
        aria-label={isExpanded ? "Collapse Operations Log" : "Expand Operations Log"}
        className={`w-full flex items-center justify-between px-3 py-4 group transition-all border-l outline-none focus-visible:bg-zinc-900 ${isExpanded
          ? 'bg-zinc-900 border-osint-primary'
          : 'border-transparent hover:bg-zinc-900 hover:border-zinc-700'
          } ${tasks.length === 0 ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="relative flex-shrink-0">
            <Activity className={`w-5 h-5 ${runningTasks.length > 0 ? 'text-osint-primary' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            {runningTasks.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-osint-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-osint-primary"></span>
              </span>
            )}
          </div>
          <div className="flex flex-col items-start text-left min-w-0">
            <span className={`text-sm font-medium font-mono uppercase tracking-wide truncate ${runningTasks.length > 0 ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
              {runningTasks.length > 0 ? 'Systems Active' : 'Ops Idle'}
            </span>
            {runningTasks.length > 0 && (
              <span className="text-[10px] text-zinc-600 truncate">
                {runningTasks.length} Running
              </span>
            )}
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="text-zinc-600 group-hover:text-zinc-400">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        )}
      </button>
    </div>
  );
};
