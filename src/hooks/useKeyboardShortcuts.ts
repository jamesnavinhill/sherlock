import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description?: string;
}

interface UseKeyboardShortcutsOptions {
    enabled?: boolean;
}

/**
 * Global keyboard shortcuts hook
 * Handles common shortcuts like Ctrl+N for new investigation, Escape for close, etc.
 */
export const useKeyboardShortcuts = (
    shortcuts: KeyboardShortcut[],
    options: UseKeyboardShortcutsOptions = {}
) => {
    const { enabled = true } = options;

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        // Don't trigger shortcuts when typing in input fields
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            // Allow Escape to still work in inputs
            if (event.key !== 'Escape') return;
        }

        for (const shortcut of shortcuts) {
            const ctrlOrMeta = shortcut.ctrl || shortcut.meta;
            const modifiersMatch =
                (ctrlOrMeta ? (event.ctrlKey || event.metaKey) : (!event.ctrlKey && !event.metaKey)) &&
                (shortcut.shift ? event.shiftKey : !event.shiftKey) &&
                (shortcut.alt ? event.altKey : !event.altKey);

            if (event.key.toLowerCase() === shortcut.key.toLowerCase() && modifiersMatch) {
                event.preventDefault();
                shortcut.action();
                break;
            }
        }
    }, [shortcuts, enabled]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};

/**
 * Pre-configured shortcuts for common application actions
 */
export const createAppShortcuts = (handlers: {
    onNewInvestigation?: () => void;
    onFocusSearch?: () => void;
    onCloseModal?: () => void;
    onShowHelp?: () => void;
    onGlobalSearch?: () => void;
}): KeyboardShortcut[] => {
    const shortcuts: KeyboardShortcut[] = [];

    if (handlers.onNewInvestigation) {
        shortcuts.push({
            key: 'n',
            ctrl: true,
            action: handlers.onNewInvestigation,
            description: 'New Investigation'
        });
    }

    if (handlers.onFocusSearch) {
        shortcuts.push({
            key: 'f',
            ctrl: true,
            action: handlers.onFocusSearch,
            description: 'Focus Search'
        });
    }

    if (handlers.onGlobalSearch) {
        shortcuts.push({
            key: 'k',
            ctrl: true,
            action: handlers.onGlobalSearch,
            description: 'Global Search'
        });
    }

    if (handlers.onShowHelp) {
        shortcuts.push({
            key: '/',
            ctrl: true,
            action: handlers.onShowHelp,
            description: 'How to use'
        });
    }

    if (handlers.onCloseModal) {
        shortcuts.push({
            key: 'Escape',
            action: handlers.onCloseModal,
            description: 'Close Modal'
        });
    }

    return shortcuts;
};
