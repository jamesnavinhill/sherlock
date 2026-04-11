import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as aiModels from '@/config/aiModels';

import { getFallbackRuntimeModel } from './runtimeConfigOptions';
import { createRuntimeConfigFormValue, useRuntimeConfigForm } from './useRuntimeConfigForm';

describe('useRuntimeConfigForm', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('infers provider and normalizes defaults from the requested model', () => {
    const value = createRuntimeConfigFormValue({
      modelId: 'gpt-5.4-mini',
      generationMode: 'SINGLE_PASS',
    });

    expect(value).toMatchObject({
      provider: 'OPENAI',
      modelId: 'gpt-5.4-mini',
      searchDepth: 'STANDARD',
      generationMode: 'SINGLE_PASS',
      thinkingBudget: 0,
    });
  });

  it('switches providers through the shared fallback-model seam', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useRuntimeConfigForm({
        initialValue: {
          provider: 'OPENAI',
          modelId: 'gpt-5.4-mini',
        },
        onChange,
      })
    );

    act(() => {
      result.current.setProvider('GEMINI');
    });

    expect(result.current.value.provider).toBe('GEMINI');
    expect(result.current.activeModelId).toBe(getFallbackRuntimeModel('GEMINI', 'gpt-5.4-mini'));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        provider: 'GEMINI',
      })
    );
  });

  it('records model picks and zeros unsupported thinking budgets in effective values', () => {
    const recordRecentModelSelection = vi
      .spyOn(aiModels, 'recordRecentModelSelection')
      .mockImplementation(() => {});
    const { result } = renderHook(() =>
      useRuntimeConfigForm({
        initialValue: {
          provider: 'GEMINI',
          modelId: 'gemini-3-flash-preview',
          thinkingBudget: 512,
        },
      })
    );

    act(() => {
      result.current.setProvider('OPENAI');
    });

    act(() => {
      result.current.setModelId('gpt-5.4-mini');
    });

    expect(recordRecentModelSelection).toHaveBeenCalledWith('gpt-5.4-mini');
    expect(result.current.value.provider).toBe('OPENAI');
    expect(result.current.value.modelId).toBe('gpt-5.4-mini');
    expect(result.current.supportsThinkingBudget).toBe(false);
    expect(result.current.effectiveValue.thinkingBudget).toBe(0);
  });
});
