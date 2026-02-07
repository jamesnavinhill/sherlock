import type { AIProvider } from '../../../config/aiModels';
import type { ProviderErrorCode } from './errors';
import type { ProviderOperation } from '../types';

interface ProviderLogPayload {
    provider: AIProvider;
    modelId: string;
    operation: ProviderOperation;
    retryCount: number;
    errorClass?: ProviderErrorCode;
    message?: string;
}

const LOG_NAMESPACE = '[provider-router]';

export const logProviderDebug = (payload: ProviderLogPayload): void => {
    const { provider, modelId, operation, retryCount, errorClass, message } = payload;
    const parts = [
        LOG_NAMESPACE,
        `provider=${provider}`,
        `modelId=${modelId}`,
        `operation=${operation}`,
        `retryCount=${retryCount}`,
        `errorClass=${errorClass || 'NONE'}`,
    ];
    if (message) parts.push(`message=${message}`);

    console.warn(parts.join(' '));
};
