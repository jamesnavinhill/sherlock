import React from 'react';
import { X } from 'lucide-react';

import { DockPanel } from '@/components/system/layout/DockPanel';
import {
  CHROME_HEADER_ICON_BUTTON_SIZE_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  CHROME_RAIL_BODY_CLASS,
  CHROME_TOP_PANEL_HEADER_MIN_HEIGHT_CLASS,
  getChromeMenuButtonClass,
} from '@/components/ui/chrome';
import { useAppWorkbenchHost } from './useAppWorkbenchHost';

const APP_WORKBENCH_WIDTH = 'min(var(--osint-shell-utility-width),28vw)';

export const AppWorkbenchHost: React.FC = () => {
  const {
    activePanel,
    activePanelId,
    closeWorkbench,
    isOpen,
    panels,
    placement,
    setActivePanelId,
    setPlacement,
  } = useAppWorkbenchHost();

  if (!activePanel) {
    return null;
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="osint-shell-backdrop fixed inset-0 z-20 xl:hidden"
          aria-label="Close workbench overlay"
          onClick={closeWorkbench}
        />
      ) : null}
      <DockPanel
        placement={placement}
        isOpen={isOpen}
        widthValue={APP_WORKBENCH_WIDTH}
        className="z-30 xl:z-10"
      >
        <div className={`${CHROME_PANEL_HEADER_CLASS} ${CHROME_TOP_PANEL_HEADER_MIN_HEIGHT_CLASS}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="osint-eyebrow">Workbench</div>
              <div className="mt-1 osint-panel-title">{activePanel.title}</div>
              {panels.length > 1 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {panels.map((panel) => (
                    <button
                      key={panel.id}
                      type="button"
                      onClick={() => setActivePanelId(panel.id)}
                      data-active={activePanelId === panel.id ? 'true' : undefined}
                      className="osint-settings-surface-button px-3 py-1.5 osint-meta-label"
                    >
                      {panel.title}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setPlacement('left')}
                className={getChromeMenuButtonClass(placement === 'left')}
                title="Dock workbench left"
                aria-label="Dock workbench left"
              >
                Left
              </button>
              <button
                type="button"
                onClick={() => setPlacement('right')}
                className={getChromeMenuButtonClass(placement === 'right')}
                title="Dock workbench right"
                aria-label="Dock workbench right"
              >
                Right
              </button>
              <button
                type="button"
                onClick={closeWorkbench}
                className={`osint-button-chrome ${CHROME_HEADER_ICON_BUTTON_SIZE_CLASS} flex items-center justify-center`}
                title="Close workbench"
                aria-label="Close workbench"
              >
                <X className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
        <div className={CHROME_RAIL_BODY_CLASS}>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 custom-scrollbar">
            {activePanel.content}
          </div>
        </div>
      </DockPanel>
    </>
  );
};
