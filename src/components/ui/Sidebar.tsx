import React from 'react';
import {
  LayoutDashboard,
  Radio,
  FileText,
  Settings,
  SlidersHorizontal,
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
  isWorkbenchAvailable: boolean;
  isWorkbenchOpen: boolean;
  onToggleWorkbench: () => void;
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
  isWorkbenchAvailable,
  isWorkbenchOpen,
  onToggleWorkbench,
}) => {
  const expandedBrandLabelClassName = isCollapsed
    ? 'opacity-0 translate-x-1'
    : 'opacity-100 -translate-x-4';
  const expandedNavLabelClassName = isCollapsed
    ? 'opacity-0 translate-x-1'
    : 'opacity-100 translate-x-0';
  const navButtonLayoutClassName = isCollapsed
    ? 'grid-cols-[4rem_minmax(0,1fr)] items-center'
    : 'grid-cols-[4rem_minmax(0,1fr)] items-center pr-3';

  const btnClass = (isActive: boolean) =>
    `osint-sidebar-nav-item grid min-h-12 w-full py-3 text-left outline-none ${navButtonLayoutClassName} ${
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

  const brandLogoSrc = '/logo-dark.jpg';

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
        className={`${
          isCollapsed
            ? 'w-0 md:w-20 -translate-x-full md:translate-x-0'
            : 'w-[min(var(--osint-shell-sidebar-width),calc(100vw-1.5rem))] md:w-[var(--osint-shell-sidebar-width)] translate-x-0'
        } osint-shell-divider-right bg-[color:var(--osint-shell)] flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 shadow-2xl md:shadow-none`}
      >
        <div
          onClick={toggleCollapse}
          className="osint-shell-divider-bottom grid h-[var(--osint-shell-toolbar-height)] grid-cols-[5rem_minmax(0,1fr)] items-center bg-[color:var(--osint-shell-header-bg)] transition-colors group flex-shrink-0 cursor-pointer"
          title="Toggle Sidebar"
        >
          <div className="flex items-center justify-center">
            <img
              src={brandLogoSrc}
              alt="Sherlock AI logo"
              className={`h-16 w-16 rounded-md object-cover transition-transform duration-300 ${isCollapsed ? 'group-hover:scale-110' : ''}`}
            />
          </div>
          <div
            className={`min-w-0 overflow-hidden whitespace-nowrap pr-4 transition-all duration-200 ${expandedBrandLabelClassName}`}
          >
            <span className="font-osint-display text-xl font-bold tracking-widest text-zinc-400">
              SHER<span className="text-osint-primary">LOCK</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 py-4 custom-scrollbar">
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
                  <Icon className="osint-sidebar-nav-icon h-5 w-5 flex-shrink-0" />
                </div>
                {!isCollapsed ? (
                  <div
                    className={`min-w-0 overflow-hidden whitespace-nowrap pr-2 transition-all duration-200 ${expandedNavLabelClassName}`}
                  >
                    <span className="osint-sidebar-nav-label font-osint-label font-medium text-sm uppercase tracking-wide">
                      {item.label}
                    </span>
                  </div>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="osint-shell-divider-top flex-shrink-0 space-y-1 px-2 py-2">
          <RunQueue
            workspaceRuns={workspaceRuns}
            activeRunId={activeRunId}
            onSelectRun={onSelectRun}
            onClearCompleted={onClearCompleted}
            isCollapsed={isCollapsed}
            onExpand={() => isCollapsed && toggleCollapse()}
          />
          <button
            onClick={onToggleWorkbench}
            disabled={!isWorkbenchAvailable}
            className={`${btnClass(isWorkbenchOpen)} disabled:cursor-not-allowed disabled:opacity-40`}
            data-active={isWorkbenchOpen ? 'true' : 'false'}
            title={
              isCollapsed
                ? isWorkbenchAvailable
                  ? 'Workbench'
                  : 'Workbench unavailable on this view'
                : undefined
            }
            aria-label="Workbench"
          >
            <div className="flex items-center justify-center">
              <SlidersHorizontal className="osint-sidebar-nav-icon h-5 w-5 flex-shrink-0" />
            </div>
            {!isCollapsed ? (
              <div
                className={`min-w-0 overflow-hidden whitespace-nowrap pr-2 transition-all duration-200 ${expandedNavLabelClassName}`}
              >
                <span className="osint-sidebar-nav-label font-osint-label font-medium text-sm uppercase tracking-wide">
                  Workbench
                </span>
              </div>
            ) : null}
          </button>
          <button
            onClick={onToggleTheme}
            className={`osint-sidebar-nav-item grid min-h-12 w-full py-3 text-left text-zinc-500 outline-none ${navButtonLayoutClassName}`}
            data-active="false"
            title={isCollapsed ? (themeMode === 'dark' ? 'Light' : 'Dark') : undefined}
            aria-label={themeMode === 'dark' ? 'Light' : 'Dark'}
          >
            <div className="flex items-center justify-center">
              {themeMode === 'dark' ? (
                <Sun className="osint-sidebar-nav-icon h-5 w-5 flex-shrink-0 text-osint-primary" />
              ) : (
                <Moon className="osint-sidebar-nav-icon h-5 w-5 flex-shrink-0 text-osint-primary" />
              )}
            </div>
            {!isCollapsed ? (
              <div
                className={`min-w-0 overflow-hidden whitespace-nowrap pr-2 transition-all duration-200 ${expandedNavLabelClassName}`}
              >
                <span className="osint-sidebar-nav-label font-osint-label font-medium text-sm uppercase tracking-wide">
                  {themeMode === 'dark' ? 'Light' : 'Dark'}
                </span>
              </div>
            ) : null}
          </button>
          <button
            onClick={() => onChangeView(AppView.SETTINGS)}
            className={btnClass(currentView === AppView.SETTINGS)}
            data-active={currentView === AppView.SETTINGS ? 'true' : 'false'}
            title={isCollapsed ? 'Settings' : undefined}
            aria-label="Settings"
          >
            <div className="flex items-center justify-center">
              <Settings className="osint-sidebar-nav-icon h-5 w-5 flex-shrink-0" />
            </div>
            {!isCollapsed ? (
              <div
                className={`min-w-0 overflow-hidden whitespace-nowrap pr-2 transition-all duration-200 ${expandedNavLabelClassName}`}
              >
                <span className="osint-sidebar-nav-label font-osint-label font-medium text-sm uppercase tracking-wide">
                  Settings
                </span>
              </div>
            ) : null}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Toggle Button (Visible only when collapsed on small screens) */}
      <button
        onClick={toggleCollapse}
        className={`osint-button-primary md:hidden fixed bottom-6 right-6 z-50 p-4 rounded-full transition-transform focus:ring-4 focus:ring-white/20 outline-none ${
          !isCollapsed ? 'scale-0' : 'scale-100'
        }`}
        aria-label={isCollapsed ? 'Open Sidebar' : 'Close Sidebar'}
      >
        <img src={brandLogoSrc} alt="" className="h-6 w-6 rounded-sm object-cover" aria-hidden="true" />
      </button>
    </>
  );
};
