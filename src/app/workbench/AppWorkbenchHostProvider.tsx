import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
  AppWorkbenchHostContext,
  type AppWorkbenchHostContextValue,
  type AppWorkbenchPlacement,
  type AppWorkbenchRegistration,
} from './AppWorkbenchContext';

export const AppWorkbenchHostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePanel, setActivePanel] = useState<AppWorkbenchRegistration | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<AppWorkbenchPlacement>('right');
  const activePanelRef = useRef<AppWorkbenchRegistration | null>(null);

  const registerPanel = useCallback((panel: AppWorkbenchRegistration) => {
    const previousPanelId = activePanelRef.current?.id || null;
    activePanelRef.current = panel;
    setActivePanel(panel);

    if (previousPanelId !== panel.id && panel.defaultOpen) {
      setIsOpen(true);
    }
  }, []);

  const unregisterPanel = useCallback((id: string) => {
    if (activePanelRef.current?.id !== id) {
      return;
    }

    activePanelRef.current = null;
    setActivePanel(null);
    setIsOpen(false);
  }, []);

  const openWorkbench = useCallback(() => {
    if (!activePanelRef.current) {
      return;
    }

    setIsOpen(true);
  }, []);

  const closeWorkbench = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleWorkbench = useCallback(() => {
    if (!activePanelRef.current) {
      return;
    }

    setIsOpen((current) => !current);
  }, []);

  const value = useMemo<AppWorkbenchHostContextValue>(
    () => ({
      activePanel,
      closeWorkbench,
      hasPanel: activePanel !== null,
      isOpen,
      openWorkbench,
      placement,
      registerPanel,
      setPlacement,
      toggleWorkbench,
      unregisterPanel,
    }),
    [
      activePanel,
      closeWorkbench,
      isOpen,
      openWorkbench,
      placement,
      registerPanel,
      toggleWorkbench,
      unregisterPanel,
    ]
  );

  return (
    <AppWorkbenchHostContext.Provider value={value}>{children}</AppWorkbenchHostContext.Provider>
  );
};
