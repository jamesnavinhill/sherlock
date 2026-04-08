import { useShallow } from 'zustand/react/shallow';

import { useWorkspaceStore, type WorkspaceState } from '../workspaceStore';

export const selectTaskSetupFeatureState = (state: WorkspaceState) => ({
  templates: state.templates,
  addTemplate: state.addTemplate,
  customScopes: state.customScopes,
  defaultScopeId: state.defaultScopeId,
});

export const useTaskSetupFeatureState = () =>
  useWorkspaceStore(useShallow(selectTaskSetupFeatureState));
