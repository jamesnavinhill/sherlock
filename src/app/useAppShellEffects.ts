import { useEffect } from 'react';
import type { MutableRefObject } from 'react';

import { AppView } from '@/types';
import { buildSherlockThemeCssVars } from '@/system/theme/cssVars';
import { getDisplayTheme } from '@/system/theme/storage';
import type { SherlockThemeWorkspaceState } from '@/system/theme/schema';

interface ApplyThemeInput {
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
  themeWorkspace,
}: ApplyThemeInput) => {
  useEffect(() => {
    const root = document.documentElement;
    const displayTheme = getDisplayTheme(themeWorkspace);
    root.setAttribute('data-theme', displayTheme.mode);
    root.style.colorScheme = displayTheme.mode;
    Object.entries(buildSherlockThemeCssVars(displayTheme)).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  }, [themeWorkspace]);
};
