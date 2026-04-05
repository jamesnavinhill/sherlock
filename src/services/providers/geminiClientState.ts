let aiInstance: unknown = null;

export const getCachedGeminiClient = <T>(): T | null => {
  return aiInstance as T | null;
};

export const setCachedGeminiClient = (value: unknown): void => {
  aiInstance = value;
};

export const resetGeminiProviderClient = (): void => {
  aiInstance = null;
};
