import { useContext, useEffect } from 'react';

import {
  AppWorkbenchHostContext,
  type AppWorkbenchHostContextValue,
  type AppWorkbenchRegistration,
} from './AppWorkbenchContext';

export const useAppWorkbenchHost = (): AppWorkbenchHostContextValue => {
  const context = useContext(AppWorkbenchHostContext);

  if (!context) {
    throw new Error('useAppWorkbenchHost must be used within AppWorkbenchHostProvider');
  }

  return context;
};

export const useRegisterAppWorkbenchPanel = (panel: AppWorkbenchRegistration | null) => {
  const { registerPanel, unregisterPanel } = useAppWorkbenchHost();
  const panelId = panel?.id ?? null;

  useEffect(() => {
    if (!panel) {
      return;
    }

    registerPanel(panel);
  }, [panel, registerPanel]);

  useEffect(() => {
    if (!panelId) {
      return;
    }

    return () => unregisterPanel(panelId);
  }, [panelId, unregisterPanel]);
};
