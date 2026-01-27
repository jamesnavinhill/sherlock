import React from 'react';
import { LayoutDashboard, Radio, FileText, Settings, ShieldAlert, Activity, FolderClosed, Network, Clock } from 'lucide-react';
import { AppView, InvestigationTask } from '../../types';
import { TaskManager } from './TaskManager';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  tasks: InvestigationTask[];
  activeTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onClearCompleted: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  isCollapsed,
  toggleCollapse,
  tasks,
  activeTaskId,
  onSelectTask,
  onClearCompleted
}) => {
  const btnClass = (isActive: boolean) =>
    `flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-3'} w-full py-3 rounded-none border-l-2 transition-all duration-200 ${isActive
      ? 'bg-zinc-900 text-osint-primary border-osint-primary shadow-[inset_10px_0_20px_-10px_rgba(0,0,0,0.5)]'
      : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border-transparent'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={toggleCollapse}
        />
      )}

      <aside className={`${isCollapsed ? 'w-0 md:w-20 -translate-x-full md:translate-x-0' : 'w-64 translate-x-0'} bg-osint-dark border-r border-osint-border flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 shadow-2xl md:shadow-none`}>
        <div
          onClick={toggleCollapse}
          className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'px-6 space-x-3'} border-b border-osint-border bg-osint-dark cursor-pointer hover:bg-zinc-900 transition-colors group flex-shrink-0`}
          title="Toggle Sidebar"
        >
          <ShieldAlert className={`w-8 h-8 text-osint-primary transition-transform duration-300 ${isCollapsed ? 'group-hover:scale-110' : ''}`} />
          {!isCollapsed && (
            <span className="text-xl font-bold font-mono tracking-widest text-zinc-400 animate-in fade-in duration-200 whitespace-nowrap">SHER<span className="text-osint-primary">LOCK</span></span>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <button
            onClick={() => onChangeView(AppView.INVESTIGATION)}
            className={btnClass(currentView === AppView.INVESTIGATION)}
            title={isCollapsed ? "Current Operation" : undefined}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium font-mono text-sm uppercase tracking-wide animate-in fade-in duration-200">Operation View</span>}
          </button>

          <button
            onClick={() => onChangeView(AppView.NETWORK)}
            className={btnClass(currentView === AppView.NETWORK)}
            title={isCollapsed ? "Network Graph" : undefined}
          >
            <Network className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium font-mono text-sm uppercase tracking-wide animate-in fade-in duration-200">Network Graph</span>}
          </button>

          <button
            onClick={() => onChangeView(AppView.LIVE_MONITOR)}
            className={btnClass(currentView === AppView.LIVE_MONITOR)}
            title={isCollapsed ? "Live Monitor" : undefined}
          >
            <Radio className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium font-mono text-sm uppercase tracking-wide animate-in fade-in duration-200">Live Monitor</span>}
          </button>

          <button
            onClick={() => onChangeView(AppView.ARCHIVES)}
            className={btnClass(currentView === AppView.ARCHIVES)}
            title={isCollapsed ? "Case Files" : undefined}
          >
            <FolderClosed className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium font-mono text-sm uppercase tracking-wide animate-in fade-in duration-200">Case Files</span>}
          </button>

          <button
            onClick={() => onChangeView(AppView.DASHBOARD)}
            className={btnClass(currentView === AppView.DASHBOARD)}
            title={isCollapsed ? "Finder" : undefined}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium font-mono text-sm uppercase tracking-wide animate-in fade-in duration-200">Finder</span>}
          </button>
        </nav>

        {/* Task Manager - Now blends seamlessly as a bottom nav section */}
        <TaskManager
          tasks={tasks}
          activeTaskId={activeTaskId}
          onSelectTask={onSelectTask}
          onClearCompleted={onClearCompleted}
          isCollapsed={isCollapsed}
          onExpand={() => isCollapsed && toggleCollapse()}
        />

        <div className="border-t border-osint-border flex-shrink-0">
          <button
            onClick={() => onChangeView(AppView.SETTINGS)}
            className={`${btnClass(currentView === AppView.SETTINGS)} py-4`}
            title={isCollapsed ? "System Config" : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium font-mono text-sm uppercase tracking-wide animate-in fade-in duration-200">System Config</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Toggle Button (Visible only when collapsed on small screens) */}
      <button
        onClick={toggleCollapse}
        className={`md:hidden fixed bottom-6 right-6 z-50 p-4 bg-osint-primary text-black rounded-full shadow-lg transition-transform ${!isCollapsed ? 'scale-0' : 'scale-100'}`}
      >
        <ShieldAlert className="w-6 h-6" />
      </button>
    </>
  );
};