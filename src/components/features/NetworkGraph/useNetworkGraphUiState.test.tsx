import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useNetworkGraphUiState } from './useNetworkGraphUiState';

describe('useNetworkGraphUiState', () => {
  it('defaults the network rail and dossier sections collapsed', () => {
    const { result } = renderHook(() => useNetworkGraphUiState());

    expect(result.current.showLeftPanel).toBe(false);
    expect(result.current.dossierSections).toEqual({
      artifacts: false,
      findings: false,
      entities: false,
      headlines: false,
      followUps: false,
      sources: false,
    });
  });
});
