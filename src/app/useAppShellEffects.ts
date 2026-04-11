import { useEffect } from 'react';
import type { MutableRefObject } from 'react';

import { AppView } from '@/types';
import { buildEntityPaletteCssVars } from '@/utils/entityPalette';
import { buildThemeBackgroundCssVars } from '@/utils/themeBackground';
import { buildThemeFontCssVars } from '@/utils/themeFonts';
import { buildThemeSurfaceCssVars } from '@/utils/themeSurfaces';

interface ApplyThemeInput {
  accentSettings: {
    hue: number;
    lightness: number;
    chroma: number;
  };
  themeColor: string;
  themeBackgroundSettings: Parameters<typeof buildThemeBackgroundCssVars>[0];
  themeFontSettings: Parameters<typeof buildThemeFontCssVars>[0];
  themeMode: 'dark' | 'light';
  themeSurfaceSettings: Parameters<typeof buildThemeSurfaceCssVars>[0];
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
  accentSettings,
  themeColor,
  themeBackgroundSettings,
  themeFontSettings,
  themeMode,
  themeSurfaceSettings,
}: ApplyThemeInput) => {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--osint-primary', themeColor);
    Object.entries(buildEntityPaletteCssVars(accentSettings)).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  }, [accentSettings, themeColor]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(buildThemeSurfaceCssVars(themeSurfaceSettings)).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  }, [themeSurfaceSettings]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(buildThemeBackgroundCssVars(themeBackgroundSettings)).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  }, [themeBackgroundSettings]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(buildThemeFontCssVars(themeFontSettings)).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  }, [themeFontSettings]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    document.documentElement.style.colorScheme = themeMode;
  }, [themeMode]);
};
