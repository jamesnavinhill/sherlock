import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
  AppWorkbenchHostContext,
  type AppWorkbenchHostContextValue,
  type AppWorkbenchPlacement,
  type AppWorkbenchRegistration,
} from './AppWorkbenchContext';

export const AppWorkbenchHostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [panelsById, setPanelsById] = useState<Record<string, AppWorkbenchRegistration>>({});
  const [panelOrder, setPanelOrder] = useState<string[]>([]);
  const [activePanelId, setActivePanelIdState] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<AppWorkbenchPlacement>('right');
  const panelsByIdRef = useRef<Record<string, AppWorkbenchRegistration>>({});
  const panelOrderRef = useRef<string[]>([]);
  const activePanelIdRef = useRef<string | null>(null);

  const registerPanel = useCallback((panel: AppWorkbenchRegistration) => {
    const isNewPanel = !panelsByIdRef.current[panel.id];
    const nextPanelsById = {
      ...panelsByIdRef.current,
      [panel.id]: panel,
    };

    panelsByIdRef.current = nextPanelsById;
    setPanelsById(nextPanelsById);

    if (isNewPanel) {
      const nextPanelOrder = [...panelOrderRef.current, panel.id];
      panelOrderRef.current = nextPanelOrder;
      setPanelOrder(nextPanelOrder);
    }

    if (!activePanelIdRef.current) {
      activePanelIdRef.current = panel.id;
      setActivePanelIdState(panel.id);
    }

    if (isNewPanel && panel.defaultOpen) {
      setIsOpen(true);
    }
  }, []);

  const unregisterPanel = useCallback((id: string) => {
    if (!panelsByIdRef.current[id]) {
      return;
    }

    const nextPanelsById = { ...panelsByIdRef.current };
    delete nextPanelsById[id];
    panelsByIdRef.current = nextPanelsById;
    setPanelsById(nextPanelsById);

    const nextPanelOrder = panelOrderRef.current.filter((panelId) => panelId !== id);
    panelOrderRef.current = nextPanelOrder;
    setPanelOrder(nextPanelOrder);

    if (activePanelIdRef.current === id) {
      const nextActivePanelId = nextPanelOrder[0] ?? null;
      activePanelIdRef.current = nextActivePanelId;
      setActivePanelIdState(nextActivePanelId);

      if (!nextActivePanelId) {
        setIsOpen(false);
      }
    } else if (nextPanelOrder.length === 0) {
      setIsOpen(false);
    }
  }, []);

  const openWorkbench = useCallback(() => {
    if (!activePanelIdRef.current) {
      return;
    }

    setIsOpen(true);
  }, []);

  const closeWorkbench = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleWorkbench = useCallback(() => {
    if (!activePanelIdRef.current) {
      return;
    }

    setIsOpen((current) => !current);
  }, []);

  const setActivePanelId = useCallback((id: string) => {
    if (!panelsByIdRef.current[id]) {
      return;
    }

    activePanelIdRef.current = id;
    setActivePanelIdState(id);
  }, []);

  const panels = useMemo(
    () => panelOrder.map((id) => panelsById[id]).filter(Boolean),
    [panelOrder, panelsById]
  );
  const activePanel =
    (activePanelId ? panelsById[activePanelId] : null) ?? panels[0] ?? null;

  const value = useMemo<AppWorkbenchHostContextValue>(
    () => ({
      activePanel,
      activePanelId,
      closeWorkbench,
      hasPanel: panels.length > 0,
      isOpen,
      openWorkbench,
      panels,
      placement,
      registerPanel,
      setActivePanelId,
      setPlacement,
      toggleWorkbench,
      unregisterPanel,
    }),
    [
      activePanel,
      activePanelId,
      closeWorkbench,
      isOpen,
      openWorkbench,
      panels,
      placement,
      registerPanel,
      setActivePanelId,
      toggleWorkbench,
      unregisterPanel,
    ]
  );

  return (
    <AppWorkbenchHostContext.Provider value={value}>{children}</AppWorkbenchHostContext.Provider>
  );
};
