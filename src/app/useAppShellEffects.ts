import { useEffect } from 'react';
import type { MutableRefObject } from 'react';

import { AppView } from '@/types';
import { buildSherlockThemeCssVars } from '@/system/theme/cssVars';
import { getActiveDraftTheme } from '@/system/theme/storage';
import type { SherlockThemeMode, SherlockThemeWorkspaceState } from '@/system/theme/schema';

interface ApplyThemeInput {
  themeMode: SherlockThemeMode;
  themeWorkspace: SherlockThemeWorkspaceState;
}

export const useInitializeAppShell = (initializeStore: () => Promise<void>) => {
  useEffect(() => {
    void initializeStore();
  }, [initializeStore]);
};

export const useTrackAppShellLocation = ({
  pathname,
  search,
  routeCurrentView,
  locationPathRef,
  lastNonSettingsPathRef,
}: {
  pathname: string;
  search: string;
  routeCurrentView: AppView;
  locationPathRef: MutableRefObject<string>;
  lastNonSettingsPathRef: MutableRefObject<string>;
}) => {
  useEffect(() => {
    locationPathRef.current = pathname;
  }, [pathname, locationPathRef]);

  useEffect(() => {
    if (routeCurrentView !== AppView.SETTINGS) {
      lastNonSettingsPathRef.current = pathname + search;
    }
  }, [lastNonSettingsPathRef, pathname, routeCurrentView, search]);
};

export const useApplyAppShellTheme = ({
  themeMode,
  themeWorkspace,
}: ApplyThemeInput) => {
  useEffect(() => {
    const root = document.documentElement;
    const activeTheme = getActiveDraftTheme(themeWorkspace);
    root.setAttribute('data-theme', themeMode);
    root.style.colorScheme = themeMode;
    Object.entries(buildSherlockThemeCssVars(activeTheme, themeMode)).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  }, [themeMode, themeWorkspace]);
};
