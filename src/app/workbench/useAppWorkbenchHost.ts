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

  useEffect(() => {
    if (!panel) {
      return;
    }

    registerPanel(panel);
    return () => unregisterPanel(panel.id);
  }, [panel, registerPanel, unregisterPanel]);
};
