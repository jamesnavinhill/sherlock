/**
 * Typed localStorage utilities for Sherlock AI
 * Provides safe JSON parsing with fallback values
 */

/**
 * Retrieves an item from localStorage with type safety and fallback
 */
export function getItem<T>(key: string, fallback: T): T {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        console.warn(`Failed to parse ${key} from localStorage, using fallback.`, e);
        return fallback;
    }
}

/**
 * Stores an item in localStorage as JSON
 */
export function setItem<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Failed to save ${key} to localStorage.`, e);
    }
}

/**
 * Removes an item from localStorage
 */
export function clearKey(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error(`Failed to remove ${key} from localStorage.`, e);
    }
}

/**
 * Common storage keys used throughout the application
 */
export const STORAGE_KEYS = {
    ARCHIVES: 'sherlock_archives',
    CASES: 'sherlock_cases',
    HEADLINES: 'sherlock_headlines',
    ACTIVE_CASE_ID: 'sherlock_active_case_id',
    MANUAL_LINKS: 'sherlock_manual_links',
    MANUAL_NODES: 'sherlock_manual_nodes',
    HIDDEN_NODES: 'sherlock_hidden_nodes',
    FLAGGED_NODES: 'sherlock_flagged_nodes',
    ENTITY_ALIASES: 'sherlock_entity_aliases',
    API_KEY: 'sherlock_api_key',
    THEME: 'sherlock_theme',
} as const;
