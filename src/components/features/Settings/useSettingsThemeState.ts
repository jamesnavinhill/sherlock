import { useState } from 'react';

import { DEFAULT_ACCENT_SETTINGS } from '@/utils/accent';
import {
  DEFAULT_THEME_BACKGROUND_SETTINGS,
  type ThemeBackgroundSettings,
} from '@/utils/themeBackground';
import {
  DEFAULT_THEME_SURFACE_SETTINGS,
  type ThemeSurfaceScale,
  type ThemeSurfaceSettings,
} from '@/utils/themeSurfaces';
import {
  DEFAULT_THEME_FONT_SETTINGS,
  type ThemeFontSettings,
} from '@/utils/themeFonts';
import { clamp, cloneThemeSurfaceSettings } from './settingsUtils';

interface UseSettingsThemeStateInput {
  accentSettings: { hue: number; lightness: number; chroma: number };
  onAccentChange: (settings: { hue: number; lightness: number; chroma: number }) => void;
  onThemeBackgroundSettingsChange: (settings: ThemeBackgroundSettings) => void;
  onThemeFontSettingsChange: (settings: ThemeFontSettings) => void;
  onThemeSurfaceSettingsChange: (settings: ThemeSurfaceSettings) => void;
  themeBackgroundSettings: ThemeBackgroundSettings;
  themeMode: 'dark' | 'light';
  themeSurfaceSettings: ThemeSurfaceSettings;
}

export const useSettingsThemeState = ({
  accentSettings,
  onAccentChange,
  onThemeBackgroundSettingsChange,
  onThemeFontSettingsChange,
  onThemeSurfaceSettingsChange,
  themeBackgroundSettings,
  themeMode,
  themeSurfaceSettings,
}: UseSettingsThemeStateInput) => {
  const [themeSections, setThemeSections] = useState({
    accent: true,
    fonts: true,
    surfaces: true,
  });
  const [activeSurfaceMode, setActiveSurfaceMode] =
    useState<keyof ThemeSurfaceSettings>(themeMode);
  const [selectedSurfaceKey, setSelectedSurfaceKey] =
    useState<keyof ThemeSurfaceScale>('panel');

  const toggleThemeSection = (section: keyof typeof themeSections) => {
    setThemeSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const handleResetThemeSettings = () => {
    onAccentChange(DEFAULT_ACCENT_SETTINGS);
    onThemeBackgroundSettingsChange(DEFAULT_THEME_BACKGROUND_SETTINGS);
    onThemeSurfaceSettingsChange(DEFAULT_THEME_SURFACE_SETTINGS);
  };

  const handleResetFonts = () => {
    onThemeFontSettingsChange(DEFAULT_THEME_FONT_SETTINGS);
  };

  const getSurfaceBounds = (
    mode: keyof ThemeSurfaceSettings,
    surfaceKey: keyof ThemeSurfaceScale
  ) => {
    if (mode === 'dark') {
      const lightnessRanges: Record<keyof ThemeSurfaceScale, { max: number; min: number }> = {
        background: { min: 0, max: 0.14 },
        panel: { min: 0, max: 0.22 },
        surface: { min: 0, max: 0.32 },
      };

      return {
        lightnessMin: lightnessRanges[surfaceKey].min,
        lightnessMax: lightnessRanges[surfaceKey].max,
        chromaMax: 0.06,
      };
    }

    const lightnessRanges: Record<keyof ThemeSurfaceScale, { max: number; min: number }> = {
      background: { min: 0.88, max: 1 },
      panel: { min: 0.9, max: 1 },
      surface: { min: 0.82, max: 0.98 },
    };

    return {
      lightnessMin: lightnessRanges[surfaceKey].min,
      lightnessMax: lightnessRanges[surfaceKey].max,
      chromaMax: 0.08,
    };
  };

  const clampSurfaceSettings = (
    mode: keyof ThemeSurfaceSettings,
    surfaceKey: keyof ThemeSurfaceScale,
    settings: ThemeSurfaceScale[keyof ThemeSurfaceScale]
  ) => {
    const bounds = getSurfaceBounds(mode, surfaceKey);

    return {
      hue: ((Math.round(settings.hue) % 360) + 360) % 360,
      lightness: clamp(
        Number(settings.lightness.toFixed(3)),
        bounds.lightnessMin,
        bounds.lightnessMax
      ),
      chroma: clamp(Number(settings.chroma.toFixed(3)), 0, bounds.chromaMax),
    };
  };

  const handleThemeSurfaceChange = (
    mode: keyof ThemeSurfaceSettings,
    surfaceKey: keyof ThemeSurfaceScale,
    settings: ThemeSurfaceScale[keyof ThemeSurfaceScale]
  ) => {
    onThemeSurfaceSettingsChange({
      ...themeSurfaceSettings,
      [mode]: {
        ...themeSurfaceSettings[mode],
        [surfaceKey]: clampSurfaceSettings(mode, surfaceKey, settings),
      },
    });
  };

  const updateModeSurfaces = (
    mode: keyof ThemeSurfaceSettings,
    updater: (scale: ThemeSurfaceScale) => ThemeSurfaceScale
  ) => {
    const nextScale = updater(themeSurfaceSettings[mode]);

    onThemeSurfaceSettingsChange({
      ...themeSurfaceSettings,
      [mode]: {
        background: clampSurfaceSettings(mode, 'background', nextScale.background),
        panel: clampSurfaceSettings(mode, 'panel', nextScale.panel),
        surface: clampSurfaceSettings(mode, 'surface', nextScale.surface),
      },
    });
  };

  const updateSelectedSurfaceField = (
    field: keyof ThemeSurfaceScale[keyof ThemeSurfaceScale],
    rawValue: number
  ) => {
    const current = themeSurfaceSettings[activeSurfaceMode][selectedSurfaceKey];
    handleThemeSurfaceChange(activeSurfaceMode, selectedSurfaceKey, {
      ...current,
      [field]: rawValue,
    });
  };

  const handleApplySurfacePreset = (preset: ThemeSurfaceSettings) => {
    onThemeSurfaceSettingsChange(cloneThemeSurfaceSettings(preset));
  };

  const handleResetSurfaceMode = (mode: keyof ThemeSurfaceSettings) => {
    onThemeSurfaceSettingsChange({
      ...themeSurfaceSettings,
      [mode]: cloneThemeSurfaceSettings(DEFAULT_THEME_SURFACE_SETTINGS)[mode],
    });
  };

  const handleMatchAccentHue = (mode: keyof ThemeSurfaceSettings) => {
    updateModeSurfaces(mode, (scale) => ({
      background: { ...scale.background, hue: accentSettings.hue },
      panel: { ...scale.panel, hue: accentSettings.hue },
      surface: { ...scale.surface, hue: accentSettings.hue },
    }));
  };

  const handleAdjustModeChroma = (mode: keyof ThemeSurfaceSettings, delta: number) => {
    updateModeSurfaces(mode, (scale) => ({
      background: {
        ...scale.background,
        chroma: scale.background.chroma + delta * 0.6,
      },
      panel: {
        ...scale.panel,
        chroma: scale.panel.chroma + delta,
      },
      surface: {
        ...scale.surface,
        chroma: scale.surface.chroma + delta,
      },
    }));
  };

  const handleAdjustModeSeparation = (mode: keyof ThemeSurfaceSettings, direction: 1 | -1) => {
    if (mode === 'dark') {
      updateModeSurfaces(mode, (scale) => ({
        background: {
          ...scale.background,
          lightness: scale.background.lightness - direction * 0.006,
        },
        panel: {
          ...scale.panel,
          lightness: scale.panel.lightness + direction * 0.012,
        },
        surface: {
          ...scale.surface,
          lightness: scale.surface.lightness + direction * 0.02,
        },
      }));
      return;
    }

    updateModeSurfaces(mode, (scale) => ({
      background: {
        ...scale.background,
        lightness: scale.background.lightness + direction * 0.008,
      },
      panel: {
        ...scale.panel,
        lightness: scale.panel.lightness + direction * 0.012,
      },
      surface: {
        ...scale.surface,
        lightness: scale.surface.lightness - direction * 0.015,
      },
    }));
  };

  const handleThemeBackgroundVariantChange = (variant: ThemeBackgroundSettings['variant']) => {
    onThemeBackgroundSettingsChange({
      ...themeBackgroundSettings,
      variant,
    });
  };

  const updateThemeBackgroundField = (
    field: Exclude<keyof ThemeBackgroundSettings, 'variant'>,
    rawValue: number
  ) => {
    onThemeBackgroundSettingsChange({
      ...themeBackgroundSettings,
      [field]:
        field === 'dotColor'
          ? clamp(Math.round(rawValue), 0, 100)
          : clamp(Number(rawValue.toFixed(2)), 0, 1),
    });
  };

  return {
    activeSurfaceMode,
    getSurfaceBounds,
    handleAdjustModeChroma,
    handleAdjustModeSeparation,
    handleApplySurfacePreset,
    handleThemeBackgroundVariantChange,
    handleMatchAccentHue,
    handleResetFonts,
    handleResetSurfaceMode,
    handleResetThemeSettings,
    handleThemeSurfaceChange,
    selectedSurfaceKey,
    setActiveSurfaceMode,
    setSelectedSurfaceKey,
    themeSections,
    toggleThemeSection,
    updateThemeBackgroundField,
    updateSelectedSurfaceField,
  };
};
