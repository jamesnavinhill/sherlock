import { beforeEach, describe, expect, it } from 'vitest';
import type { SystemConfig } from '../types';
import { getDefaultModelForProvider } from './aiModels';
import { loadSystemConfig, migrateSystemConfig, saveSystemConfig } from './systemConfig';

describe('systemConfig migration', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('migrates legacy Gemini model ids and infers provider', () => {
        const migrated = migrateSystemConfig({ modelId: 'gemini-3-flash' } as Partial<SystemConfig>);

        expect(migrated.provider).toBe('GEMINI');
        expect(migrated.modelId).toBe('gemini-3-flash-preview');
    });

    it('falls back to provider inferred from model when provider value is invalid', () => {
        const migrated = migrateSystemConfig({
            provider: 'UNKNOWN_PROVIDER' as unknown as SystemConfig['provider'],
            modelId: 'gpt-4.1-mini',
        });

        expect(migrated.provider).toBe('OPENAI');
        expect(migrated.modelId).toBe('gpt-4.1-mini');
    });

    it('realigns model to provider default when stored pair mismatches', () => {
        const migrated = migrateSystemConfig({
            provider: 'OPENROUTER',
            modelId: 'gemini-2.5-flash',
        });

        expect(migrated.provider).toBe('OPENROUTER');
        expect(migrated.modelId).toBe(getDefaultModelForProvider('OPENROUTER'));
    });

    it('persists normalized config and retains extra values', () => {
        saveSystemConfig(
            {
                provider: 'GEMINI',
                modelId: 'gemini-2.5-flash-latest',
                persona: 'general-investigator',
            },
            { theme: '#fff' }
        );

        const storedRaw = JSON.parse(localStorage.getItem('sherlock_config') || '{}') as Record<string, unknown>;
        expect(storedRaw.theme).toBe('#fff');
        expect(storedRaw.modelId).toBe('gemini-2.5-flash');

        const loaded = loadSystemConfig();
        expect(loaded.provider).toBe('GEMINI');
        expect(loaded.modelId).toBe('gemini-2.5-flash');
    });
});
