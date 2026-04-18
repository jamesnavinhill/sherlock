import { createContext, type ReactNode } from 'react';

export type AppWorkbenchPlacement = 'left' | 'right';

export interface AppWorkbenchRegistration {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  content: ReactNode;
}

export interface AppWorkbenchHostContextValue {
  activePanel: AppWorkbenchRegistration | null;
  isOpen: boolean;
  placement: AppWorkbenchPlacement;
  hasPanel: boolean;
  closeWorkbench: () => void;
  openWorkbench: () => void;
  registerPanel: (panel: AppWorkbenchRegistration) => void;
  setPlacement: (placement: AppWorkbenchPlacement) => void;
  toggleWorkbench: () => void;
  unregisterPanel: (id: string) => void;
}

export const AppWorkbenchHostContext = createContext<AppWorkbenchHostContextValue | null>(null);
