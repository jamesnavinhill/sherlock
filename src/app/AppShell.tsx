import React, { Suspense } from 'react';

import { AppView } from '@/types';
import { ApiKeyModal } from '@/components/ui/ApiKeyModal';
import { HelpModal } from '@/components/ui/HelpModal';
import { Sidebar } from '@/components/ui/Sidebar';
import { ToastContainer } from '@/components/ui/Toast';
import { AppShellRoutes } from '@/app/AppShellRoutes';
import { RouteErrorBoundary } from '@/app/RouteErrorBoundary';
import { useAppShellController } from '@/app/useAppShellController';
import { AppWorkbenchHost } from '@/app/workbench/AppWorkbenchHost';
import { AppWorkbenchHostProvider } from '@/app/workbench/AppWorkbenchHostProvider';
import { useAppWorkbenchHost } from '@/app/workbench/useAppWorkbenchHost';

const AppShellWorkspaceChrome: React.FC<{
  controller: ReturnType<typeof useAppShellController>;
}> = ({ controller }) => {
  const { hasPanel, isOpen, placement, toggleWorkbench } = useAppWorkbenchHost();

  return (
    <div
      className="osint-app-shell flex min-h-screen overflow-hidden bg-osint-dark font-sans text-osint-text selection:bg-osint-primary selection:text-black"
      data-header-hidden={controller.shouldHideRouteHeader ? 'true' : 'false'}
    >
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
        activeRunId={controller.activeRunId}
        onSelectRun={controller.handleSelectRun}
        onClearCompleted={controller.handleClearCompleted}
        themeMode={controller.themeMode}
        onToggleTheme={() =>
          controller.setThemeMode(controller.themeMode === 'dark' ? 'light' : 'dark')
        }
        isWorkbenchAvailable={hasPanel}
        isWorkbenchOpen={hasPanel && isOpen}
        onToggleWorkbench={toggleWorkbench}
      />

      <main
        className={`flex-1 flex flex-col h-screen bg-osint-dark relative transition-all duration-300 overflow-hidden ${controller.isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'}`}
      >
        <div className="flex flex-1 overflow-hidden relative w-full">
          {placement === 'left' ? <AppWorkbenchHost /> : null}
          <div className="flex-1 overflow-hidden relative w-full">
            <RouteErrorBoundary resetKey={controller.locationPathname}>
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
            </RouteErrorBoundary>
          </div>
          {placement === 'right' ? <AppWorkbenchHost /> : null}
        </div>
      </main>
      {controller.showHelpModal && <HelpModal onClose={() => controller.setShowHelpModal(false)} />}
      <ToastContainer />
    </div>
  );
};

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

  const isLanding = controller.routeCurrentView === AppView.LANDING;

  /* Landing page renders full-viewport without the sidebar chrome */
  if (isLanding) {
    return (
      <div
        className="osint-app-shell min-h-screen bg-osint-dark font-sans text-osint-text selection:bg-osint-primary selection:text-black"
        data-header-hidden="false"
      >
        <RouteErrorBoundary resetKey={controller.locationPathname}>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-screen bg-black">
                <div className="text-osint-primary font-mono text-sm animate-pulse tracking-widest">
                  LOADING_PROTOCOL...
                </div>
              </div>
            }
          >
            <AppShellRoutes controller={controller} />
          </Suspense>
        </RouteErrorBoundary>
        {controller.showApiKeyPrompt && controller.showLandingApiKeyPrompt && (
          <ApiKeyModal
            onKeySet={controller.handleApiKeySet}
            onBypass={controller.handleApiKeyPromptBypass}
          />
        )}
        <ToastContainer />
      </div>
    );
  }

  return (
    <AppWorkbenchHostProvider>
      <AppShellWorkspaceChrome controller={controller} />
    </AppWorkbenchHostProvider>
  );
}
