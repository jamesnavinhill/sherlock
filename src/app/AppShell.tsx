import { Suspense } from 'react';

import { ApiKeyModal } from '@/components/ui/ApiKeyModal';
import { HelpModal } from '@/components/ui/HelpModal';
import { Sidebar } from '@/components/ui/Sidebar';
import { ToastContainer } from '@/components/ui/Toast';
import { AppShellRoutes } from '@/app/AppShellRoutes';
import { useAppShellController } from '@/app/useAppShellController';

export function AppShell() {
  const controller = useAppShellController();

  if (controller.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
          <p>Initializing Secure Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-osint-dark text-osint-text font-sans selection:bg-osint-primary selection:text-black overflow-hidden">
      {controller.showApiKeyPrompt && (
        <ApiKeyModal
          onKeySet={controller.handleApiKeySet}
          onBypass={controller.handleApiKeyPromptBypass}
        />
      )}

      <Sidebar
        currentView={controller.routeCurrentView}
        onChangeView={controller.handleNavigateToView}
        isCollapsed={controller.isSidebarCollapsed}
        toggleCollapse={() => controller.setIsSidebarCollapsed(!controller.isSidebarCollapsed)}
        workspaceRuns={controller.workspaceRuns}
        activeTaskId={controller.activeTaskId}
        onSelectTask={controller.handleSelectTask}
        onClearCompleted={controller.handleClearCompleted}
        themeMode={controller.themeMode}
        onToggleTheme={() =>
          controller.setThemeMode(controller.themeMode === 'dark' ? 'light' : 'dark')
        }
      />

      <main
        className={`flex-1 flex flex-col h-screen bg-osint-dark relative transition-all duration-300 overflow-hidden ${controller.isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'}`}
      >
        <div className="flex-1 overflow-hidden relative w-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full bg-black">
                <div className="text-osint-primary font-mono text-sm animate-pulse tracking-widest">
                  LOADING_PROTOCOL...
                </div>
              </div>
            }
          >
            <AppShellRoutes controller={controller} />
          </Suspense>
        </div>
      </main>
      {controller.showHelpModal && <HelpModal onClose={() => controller.setShowHelpModal(false)} />}
      <ToastContainer />
    </div>
  );
}
