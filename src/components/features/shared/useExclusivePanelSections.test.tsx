import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useExclusivePanelSections } from './useExclusivePanelSections';

describe('useExclusivePanelSections', () => {
  it('opens only one section at a time', () => {
    const { result } = renderHook(() =>
      useExclusivePanelSections(['reports', 'entities', 'sources'] as const, {
        initialOpenSection: 'reports',
      })
    );

    expect(result.current.state).toEqual({
      reports: true,
      entities: false,
      sources: false,
    });

    act(() => {
      result.current.toggleSection('entities');
    });

    expect(result.current.state).toEqual({
      reports: false,
      entities: true,
      sources: false,
    });

    act(() => {
      result.current.toggleSection('entities');
    });

    expect(result.current.state).toEqual({
      reports: false,
      entities: false,
      sources: false,
    });
  });

  it('drops invalid open sections when the available section list changes', () => {
    const { result, rerender } = renderHook(
      ({
        sections,
        initialOpenSection,
      }: {
        sections: Array<'reports' | 'entities' | 'sources'>;
        initialOpenSection?: 'reports' | 'entities' | 'sources' | null;
      }) => useExclusivePanelSections(sections, { initialOpenSection }),
      {
        initialProps: {
          sections: ['reports', 'entities', 'sources'],
          initialOpenSection: 'reports',
        },
      }
    );

    expect(result.current.openSection).toBe('reports');

    rerender({
      sections: ['entities', 'sources'],
      initialOpenSection: 'reports',
    });

    expect(result.current.openSection).toBeNull();
    expect(result.current.state).toEqual({
      entities: false,
      sources: false,
    });
  });
});
