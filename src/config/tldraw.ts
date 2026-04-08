const trimOrUndefined = (value: string | undefined) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const getTldrawLicenseKey = (): string | undefined => {
  const env =
    typeof import.meta !== 'undefined'
      ? (import.meta.env as Record<string, string | undefined>) || {}
      : {};
  const processEnv =
    typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) || {} : {};

  return (
    trimOrUndefined(env.VITE_TLDRAW_LICENSE_KEY) ||
    trimOrUndefined(processEnv.VITE_TLDRAW_LICENSE_KEY)
  );
};
