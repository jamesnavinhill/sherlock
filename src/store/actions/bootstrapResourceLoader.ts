export type BootstrapReadFailureMode = 'SKIP' | 'FAIL';

export const loadBootstrapResource = async <T>(
  label: string,
  loader: () => Promise<T>,
  fallback: T,
  failureMode: BootstrapReadFailureMode = 'SKIP'
): Promise<T> => {
  try {
    return await loader();
  } catch (error) {
    if (failureMode === 'FAIL') {
      const wrapped = new Error(`[bootstrap][fail] Failed to load ${label}.`);
      (wrapped as Error & { cause?: unknown }).cause = error;
      throw wrapped;
    }

    console.warn(`[bootstrap][skip] Failed to load ${label}. Using fallback.`, error);
    return fallback;
  }
};
