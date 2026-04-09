import { useShallow } from 'zustand/react/shallow';

import { useWorkspaceStore, type WorkspaceState } from '../workspaceStore';

export const selectRunSetupFeatureState = (state: WorkspaceState) => ({
  templates: state.templates,
  addTemplate: state.addTemplate,
  customScopes: state.customScopes,
  defaultScopeId: state.defaultScopeId,
});

export const useRunSetupFeatureState = () =>
  useWorkspaceStore(useShallow(selectRunSetupFeatureState));
