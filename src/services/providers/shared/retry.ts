import type { AIProvider } from '../../../config/aiModels';
import type { ProviderOperation } from '../types';
import { ProviderError, toProviderError } from './errors';
import { logProviderDebug } from './logging';

const DEFAULT_RETRIES = 3;
const DEFAULT_DELAY_MS = 2000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface RetryOptions {
    provider: AIProvider;
    modelId: string;
    operation: ProviderOperation;
    retries?: number;
    delayMs?: number;
}

export const withProviderRetry = async <T>(
    fn: () => Promise<T>,
    options: RetryOptions
): Promise<T> => {
    const retries = options.retries ?? DEFAULT_RETRIES;
    const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            logProviderDebug({
                provider: options.provider,
                modelId: options.modelId,
                operation: options.operation,
                retryCount: attempt,
            });
            return await fn();
        } catch (error) {
            const wrapped = toProviderError(options.provider, options.operation, error);
            logProviderDebug({
                provider: options.provider,
                modelId: options.modelId,
                operation: options.operation,
                retryCount: attempt,
                errorClass: wrapped.code,
                message: wrapped.message,
            });

            const shouldStop =
                wrapped.code === 'MISSING_API_KEY' ||
                wrapped.code === 'UNSUPPORTED_OPERATION' ||
                wrapped.code === 'PARSE_ERROR' ||
                attempt >= retries;

            if (shouldStop) throw wrapped;

            await wait(delayMs);
        }
    }

    throw new ProviderError({
        code: 'UPSTREAM_ERROR',
        provider: options.provider,
        operation: options.operation,
        message: 'Retry loop exhausted unexpectedly.',
    });
};
