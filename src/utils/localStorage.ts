/**
 * Typed browser-storage utilities for the small set of values that still live
 * outside SQLite. Provider keys are intentionally handled elsewhere.
 */

const readString = (key: string): string | null => {
  if (typeof localStorage === 'undefined') return null;

  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to read ${key} from localStorage.`, error);
    return null;
  }
};

const writeString = (key: string, value: string): void => {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to store ${key} in localStorage.`, error);
  }
};

/**
 * Common storage keys used throughout the application.
 */
export const STORAGE_KEYS = {
  ARCHIVES: 'sherlock_archives',
  CASES: 'sherlock_cases',
  HEADLINES: 'sherlock_headlines',
  ACTIVE_WORKSPACE_ID: 'sherlock_active_workspace_id',
  API_KEY_PROMPT_DISMISSED: 'sherlock_api_key_prompt_dismissed',
  DEMO_WORKSPACE_SEED_APPLIED: 'sherlock_demo_seed_v1_applied',
  LIVE_MONITOR_AUTOSAVE: 'sherlock_livestream_autosave',
  SYSTEM_CONFIG: 'sherlock_config',
  OPENROUTER_MODEL_CATALOG: 'sherlock_openrouter_model_catalog_v1',
  RECENT_MODEL_IDS: 'sherlock_recent_model_ids_v1',
  OMNIBOX_RECENTS: 'sherlock_omnibox_recents_v1',
  MANUAL_LINKS: 'sherlock_manual_links',
  MANUAL_NODES: 'sherlock_manual_nodes',
  HIDDEN_NODES: 'sherlock_hidden_nodes',
  FLAGGED_NODES: 'sherlock_flagged_nodes',
  ENTITY_ALIASES: 'sherlock_entity_aliases',
  API_KEY: 'sherlock_api_key',
  THEME: 'sherlock_theme',
} as const;

export interface StoredOmniboxRecent {
  kind: 'WORKSPACE' | 'ARTIFACT' | 'CHAT_SESSION' | 'RUN' | 'WORKSPACE_ITEM';
  refId: string;
  workspaceId?: string;
  visitedAt: number;
}

export function getStringItem(key: string): string | null {
  return readString(key);
}

export function setStringItem(key: string, value: string): void {
  writeString(key, value);
}

/**
 * Retrieves a JSON item from localStorage with type safety and fallback.
 */
export function getItem<T>(key: string, fallback: T): T {
  const data = readString(key);
  if (!data) return fallback;

  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.warn(`Failed to parse ${key} from localStorage, using fallback.`, error);
    return fallback;
  }
}

export function getOptionalItem<T>(key: string): T | null {
  const data = readString(key);
  if (!data) return null;

  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.warn(`Failed to parse ${key} from localStorage.`, error);
    return null;
  }
}

export const getStoredSystemConfigRecord = (): Record<string, unknown> =>
  getOptionalItem<Record<string, unknown>>(STORAGE_KEYS.SYSTEM_CONFIG) || {};

export const setStoredSystemConfigRecord = (value: Record<string, unknown>): void => {
  setItem(STORAGE_KEYS.SYSTEM_CONFIG, value);
};

export const getStoredOpenRouterModelCatalog = <T>(): T | null =>
  getOptionalItem<T>(STORAGE_KEYS.OPENROUTER_MODEL_CATALOG);

export const setStoredOpenRouterModelCatalog = <T>(value: T): void => {
  setItem(STORAGE_KEYS.OPENROUTER_MODEL_CATALOG, value);
};

export const getStoredRecentModelIds = (): string[] => {
  const parsed = getOptionalItem<unknown>(STORAGE_KEYS.RECENT_MODEL_IDS);
  return Array.isArray(parsed)
    ? parsed.filter(
        (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0
      )
    : [];
};

export const setStoredRecentModelIds = (modelIds: string[]): void => {
  setItem(STORAGE_KEYS.RECENT_MODEL_IDS, modelIds.slice(0, 8));
};

export const getStoredOmniboxRecents = (): StoredOmniboxRecent[] => {
  const parsed = getOptionalItem<unknown>(STORAGE_KEYS.OMNIBOX_RECENTS);
  return Array.isArray(parsed)
    ? parsed.filter(
        (entry): entry is StoredOmniboxRecent =>
          !!entry &&
          typeof entry === 'object' &&
          typeof (entry as StoredOmniboxRecent).kind === 'string' &&
          typeof (entry as StoredOmniboxRecent).refId === 'string' &&
          typeof (entry as StoredOmniboxRecent).visitedAt === 'number'
      )
    : [];
};

export const setStoredOmniboxRecents = (records: StoredOmniboxRecent[]): void => {
  setItem(STORAGE_KEYS.OMNIBOX_RECENTS, records.slice(0, 12));
};

/**
 * Stores an item in localStorage as JSON.
 */
export function setItem<T>(key: string, value: T): void {
  try {
    writeString(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage.`, error);
  }
}

/**
 * Removes an item from localStorage.
 */
export function clearKey(key: string): void {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove ${key} from localStorage.`, error);
  }
}

export const getStoredActiveWorkspaceId = (): string | null =>
  getStringItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID);

export const setStoredActiveWorkspaceId = (value: string): void => {
  setStringItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID, value);
};

export const clearStoredActiveWorkspaceId = (): void => {
  clearKey(STORAGE_KEYS.ACTIVE_WORKSPACE_ID);
};

export const hasDismissedApiKeyPrompt = (): boolean =>
  getStringItem(STORAGE_KEYS.API_KEY_PROMPT_DISMISSED) === 'true';

export const markApiKeyPromptDismissed = (): void => {
  setStringItem(STORAGE_KEYS.API_KEY_PROMPT_DISMISSED, 'true');
};

export const clearApiKeyPromptDismissed = (): void => {
  clearKey(STORAGE_KEYS.API_KEY_PROMPT_DISMISSED);
};

export const getStoredLiveMonitorAutosave = (): boolean =>
  getStringItem(STORAGE_KEYS.LIVE_MONITOR_AUTOSAVE) !== 'false';

export const setStoredLiveMonitorAutosave = (value: boolean): void => {
  setStringItem(STORAGE_KEYS.LIVE_MONITOR_AUTOSAVE, String(value));
};

export const hasAppliedDemoWorkspaceSeed = (): boolean =>
  getStringItem(STORAGE_KEYS.DEMO_WORKSPACE_SEED_APPLIED) === 'true';

export const markDemoWorkspaceSeedApplied = (): void => {
  setStringItem(STORAGE_KEYS.DEMO_WORKSPACE_SEED_APPLIED, 'true');
};
