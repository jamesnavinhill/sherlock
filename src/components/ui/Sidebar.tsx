import React from 'react';
import {
  LayoutDashboard,
  Radio,
  FileText,
  Settings,
  FolderClosed,
  Network,
  Sun,
  Moon,
  MessageSquare,
  Clock3,
  Shapes,
} from 'lucide-react';
import type { WorkspaceRun } from '../../types';
import { AppView } from '../../types';
import { RunQueue } from './RunQueue';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  workspaceRuns: WorkspaceRun[];
  activeRunId: string | null;
  onSelectRun: (runId: string) => void;
  onClearCompleted: () => void;
  themeMode: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  isCollapsed,
  toggleCollapse,
  workspaceRuns,
  activeRunId,
  onSelectRun,
  onClearCompleted,
  themeMode,
  onToggleTheme,
}) => {
  const expandedLabelClassName = isCollapsed
    ? 'opacity-0 translate-x-1'
    : 'opacity-100 -translate-x-4';

  const btnClass = (isActive: boolean) =>
    `osint-sidebar-nav-item grid w-full grid-cols-[5rem_minmax(0,1fr)] items-center rounded-none border-l py-3 text-left outline-none ${
      isActive ? '' : 'text-zinc-500'
    }`;

  const navItems = [
    { view: AppView.FILES, label: 'Files', icon: FolderClosed },
    { view: AppView.INVESTIGATION, label: 'Viewer', icon: FileText },
    { view: AppView.WORKSPACE, label: 'Canvas', icon: Shapes },
    { view: AppView.CHAT, label: 'Chat', icon: MessageSquare },
    { view: AppView.NETWORK, label: 'Network', icon: Network },
    { view: AppView.TIMELINE, label: 'Timeline', icon: Clock3 },
    { view: AppView.LIVE_MONITOR, label: 'Monitor', icon: Radio },
    { view: AppView.DASHBOARD, label: 'Discovery', icon: LayoutDashboard },
  ] as const;

  const brandLogoSrc = themeMode === 'dark' ? '/logo-dark.jpg' : '/logo-light.jpg';

  return (
    <>
      {/* Mobile Backdrop */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={toggleCollapse}
        />
      )}

      <aside
        className={`${isCollapsed ? 'w-0 md:w-20 -translate-x-full md:translate-x-0' : 'w-64 translate-x-0'} bg-osint-dark border-r border-zinc-800 flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 shadow-2xl md:shadow-none`}
      >
        <div
          onClick={toggleCollapse}
          className="grid h-20 grid-cols-[5rem_minmax(0,1fr)] items-center border-b border-zinc-800 bg-osint-dark transition-colors group flex-shrink-0 cursor-pointer hover:bg-zinc-900"
          title="Toggle Sidebar"
        >
          <div className="flex items-center justify-center">
            <img
              src={brandLogoSrc}
              alt="Sherlock AI logo"
              className={`h-10 w-10 rounded-md object-cover ring-1 ring-white/10 transition-transform duration-300 ${isCollapsed ? 'group-hover:scale-110' : ''}`}
            />
          </div>
          <div
            className={`min-w-0 overflow-hidden whitespace-nowrap pr-4 transition-all duration-200 ${expandedLabelClassName}`}
          >
            <span className="font-osint-display text-xl font-bold tracking-widest text-zinc-400">
              SHER<span className="text-osint-primary">LOCK</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                onClick={() => onChangeView(item.view)}
                className={btnClass(currentView === item.view)}
                data-active={currentView === item.view ? 'true' : 'false'}
                title={isCollapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <div className="flex items-center justify-center">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                </div>
                <div
                  className={`min-w-0 overflow-hidden whitespace-nowrap pr-4 transition-all duration-200 ${expandedLabelClassName}`}
                >
                  <span className="font-osint-label font-medium text-sm uppercase tracking-wide">
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Run queue - Now blends seamlessly as a bottom nav section */}
        <RunQueue
          workspaceRuns={workspaceRuns}
          activeRunId={activeRunId}
          onSelectRun={onSelectRun}
          onClearCompleted={onClearCompleted}
          isCollapsed={isCollapsed}
          onExpand={() => isCollapsed && toggleCollapse()}
        />

        <div className="border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={onToggleTheme}
            className="osint-sidebar-nav-item grid w-full grid-cols-[5rem_minmax(0,1fr)] items-center border-l py-4 text-left text-zinc-500 outline-none"
            data-active="false"
            title={isCollapsed ? (themeMode === 'dark' ? 'Light' : 'Dark') : undefined}
            aria-label={themeMode === 'dark' ? 'Light' : 'Dark'}
          >
            <div className="flex items-center justify-center">
              {themeMode === 'dark' ? (
                <Sun className="h-5 w-5 flex-shrink-0 text-osint-primary" />
              ) : (
                <Moon className="h-5 w-5 flex-shrink-0 text-osint-primary" />
              )}
            </div>
            <div
              className={`min-w-0 overflow-hidden whitespace-nowrap pr-4 transition-all duration-200 ${expandedLabelClassName}`}
            >
              <span className="font-osint-label font-medium text-sm uppercase tracking-wide">
                {themeMode === 'dark' ? 'Light' : 'Dark'}
              </span>
            </div>
          </button>
          <button
            onClick={() => onChangeView(AppView.SETTINGS)}
            className={`${btnClass(currentView === AppView.SETTINGS)} py-4`}
            data-active={currentView === AppView.SETTINGS ? 'true' : 'false'}
            title={isCollapsed ? 'Settings' : undefined}
            aria-label="Settings"
          >
            <div className="flex items-center justify-center">
              <Settings className="h-5 w-5 flex-shrink-0" />
            </div>
            <div
              className={`min-w-0 overflow-hidden whitespace-nowrap pr-4 transition-all duration-200 ${expandedLabelClassName}`}
            >
              <span className="font-osint-label font-medium text-sm uppercase tracking-wide">
                Settings
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Toggle Button (Visible only when collapsed on small screens) */}
      <button
        onClick={toggleCollapse}
        className={`osint-button-primary md:hidden fixed bottom-6 right-6 z-50 p-4 rounded-full transition-transform focus:ring-4 focus:ring-white/20 outline-none ${!isCollapsed ? 'scale-0' : 'scale-100'}`}
        aria-label={isCollapsed ? 'Open Sidebar' : 'Close Sidebar'}
      >
        <img src={brandLogoSrc} alt="" className="h-6 w-6 rounded-sm object-cover" aria-hidden="true" />
      </button>
    </>
  );
};
