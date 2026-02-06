import type { AIProvider } from '../../../config/aiModels';
import type { ProviderOperation } from '../types';

export type ProviderErrorCode =
    | 'MISSING_API_KEY'
    | 'RATE_LIMITED'
    | 'PARSE_ERROR'
    | 'UPSTREAM_ERROR'
    | 'UNSUPPORTED_OPERATION';

export class ProviderError extends Error {
    code: ProviderErrorCode;
    provider: AIProvider;
    operation: ProviderOperation;
    status?: number;
    cause?: unknown;

    constructor(params: {
        code: ProviderErrorCode;
        provider: AIProvider;
        operation: ProviderOperation;
        message: string;
        status?: number;
        cause?: unknown;
    }) {
        super(params.message);
        this.name = 'ProviderError';
        this.code = params.code;
        this.provider = params.provider;
        this.operation = params.operation;
        this.status = params.status;
        this.cause = params.cause;
    }
}

const inferErrorCode = (error: unknown): ProviderErrorCode => {
    if (error instanceof ProviderError) return error.code;
    if (!(error instanceof Error)) return 'UPSTREAM_ERROR';

    const msg = error.message.toUpperCase();
    if (msg.includes('MISSING_API_KEY')) return 'MISSING_API_KEY';
    if (msg.includes('429') || msg.includes('RATE')) return 'RATE_LIMITED';
    if (msg.includes('PARSE')) return 'PARSE_ERROR';
    if (msg.includes('UNSUPPORTED')) return 'UNSUPPORTED_OPERATION';
    return 'UPSTREAM_ERROR';
};

export const toProviderError = (
    provider: AIProvider,
    operation: ProviderOperation,
    error: unknown,
    status?: number
): ProviderError => {
    if (error instanceof ProviderError) return error;

    const code = inferErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown provider error';

    return new ProviderError({
        code,
        provider,
        operation,
        message,
        status,
        cause: error,
    });
};
