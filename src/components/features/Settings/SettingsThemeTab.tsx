import React from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { Accordion } from '@/components/ui/Accordion';
import { AccentPicker } from '@/components/ui/AccentPicker';
import { OsintSelect } from '@/components/ui/OsintSelect';
import { buildAccentColor } from '@/utils/accent';
import type { ThemeBackgroundSettings } from '@/utils/themeBackground';
import {
  buildThemeBackgroundDotColor,
  DEFAULT_THEME_BACKGROUND_SETTINGS,
} from '@/utils/themeBackground';
import {
  THEME_SURFACE_PRESETS,
  type ThemeSurfaceScale,
  type ThemeSurfaceSettings,
} from '@/utils/themeSurfaces';
import {
  describeThemeFontSize,
  describeThemeFontWeight,
  getThemeFontOption,
  getThemeFontOptionsForRole,
  resolveThemeFontSizes,
  resolveThemeFontWeights,
  type ThemeFontSettings,
} from '@/utils/themeFonts';
import {
  FONT_ROLE_CARDS,
  SURFACE_LABELS,
  getSurfacePreviewTone,
} from './settingsUtils';

interface SettingsThemeTabProps {
  accentSettings: { hue: number; lightness: number; chroma: number };
  activeSurfaceMode: keyof ThemeSurfaceSettings;
  getSurfaceBounds: (
    mode: keyof ThemeSurfaceSettings,
    surfaceKey: keyof ThemeSurfaceScale
  ) => { lightnessMin: number; lightnessMax: number; chromaMax: number };
  handleAdjustModeChroma: (mode: keyof ThemeSurfaceSettings, delta: number) => void;
  handleAdjustModeSeparation: (mode: keyof ThemeSurfaceSettings, direction: 1 | -1) => void;
  handleApplySurfacePreset: (preset: ThemeSurfaceSettings) => void;
  handleThemeBackgroundVariantChange: (variant: ThemeBackgroundSettings['variant']) => void;
  handleMatchAccentHue: (mode: keyof ThemeSurfaceSettings) => void;
  handleResetFonts: () => void;
  handleResetSurfaceMode: (mode: keyof ThemeSurfaceSettings) => void;
  handleResetThemeSettings: () => void;
  onAccentChange: (settings: { hue: number; lightness: number; chroma: number }) => void;
  onThemeFontSettingsChange: (settings: ThemeFontSettings) => void;
  selectedSurfaceKey: keyof ThemeSurfaceScale;
  setActiveSurfaceMode: Dispatch<SetStateAction<keyof ThemeSurfaceSettings>>;
  setSelectedSurfaceKey: Dispatch<SetStateAction<keyof ThemeSurfaceScale>>;
  themeBackgroundSettings: ThemeBackgroundSettings;
  themeFontSettings: ThemeFontSettings;
  themeSections: {
    accent: boolean;
    fonts: boolean;
    surfaces: boolean;
  };
  themeSurfaceSettings: ThemeSurfaceSettings;
  toggleThemeSection: (section: 'accent' | 'fonts' | 'surfaces') => void;
  updateThemeBackgroundField: (
    field: Exclude<keyof ThemeBackgroundSettings, 'variant'>,
    rawValue: number
  ) => void;
  updateSelectedSurfaceField: (
    field: keyof ThemeSurfaceScale[keyof ThemeSurfaceScale],
    rawValue: number
  ) => void;
}

export const SettingsThemeTab: React.FC<SettingsThemeTabProps> = ({
  accentSettings,
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
  onAccentChange,
  onThemeFontSettingsChange,
  selectedSurfaceKey,
  setActiveSurfaceMode,
  setSelectedSurfaceKey,
  themeBackgroundSettings,
  themeFontSettings,
  themeSections,
  themeSurfaceSettings,
  toggleThemeSection,
  updateThemeBackgroundField,
  updateSelectedSurfaceField,
}) => {
  const fontSelections = FONT_ROLE_CARDS.map((role) => ({
    ...role,
    activeOption: getThemeFontOption(themeFontSettings[role.key]),
  }));
  const fontSelectionByRole = Object.fromEntries(
    fontSelections.map((role) => [role.key, role])
  ) as Record<(typeof FONT_ROLE_CARDS)[number]['key'], (typeof fontSelections)[number]>;
  const activeSizeProfile = describeThemeFontSize(themeFontSettings.size);
  const activeWeightProfile = describeThemeFontWeight(themeFontSettings.weight);
  const resolvedSizes = resolveThemeFontSizes(themeFontSettings.size);
  const resolvedWeights = resolveThemeFontWeights(themeFontSettings.weight);
  const backgroundVariantLabel =
    themeBackgroundSettings.variant === 'grid' ? 'Dot Grid' : 'Plain';
  const themeControlSectionClassName =
    'grid min-h-[5.75rem] gap-3 [grid-template-rows:auto_auto_1fr]';

  const renderThemeSurfaceEditor = () => {
    const selectedSurface = themeSurfaceSettings[activeSurfaceMode][selectedSurfaceKey];
    const bounds = getSurfaceBounds(activeSurfaceMode, selectedSurfaceKey);
    const backgroundTone = getSurfacePreviewTone(themeSurfaceSettings[activeSurfaceMode].background);
    const panelTone = getSurfacePreviewTone(themeSurfaceSettings[activeSurfaceMode].panel);
    const surfaceTone = getSurfacePreviewTone(themeSurfaceSettings[activeSurfaceMode].surface);

    return (
      <div className="space-y-6 px-3 pb-3 pt-1">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Theme Presets</div>
              <p className="osint-body-small mt-2 max-w-2xl">
                Start from a whole-system palette, then tune only the one surface that needs it.
                Full OKLCH values stay available without keeping eighteen sliders on screen.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetThemeSettings}
              className="osint-meta-label-strong border border-zinc-700 px-3 py-1 text-zinc-400 transition-colors hover:border-white hover:text-white"
            >
              Reset Theme
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {THEME_SURFACE_PRESETS.map((preset) => {
              const isActive =
                JSON.stringify(themeSurfaceSettings) === JSON.stringify(preset.settings);

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplySurfacePreset(preset.settings)}
                  className={`osint-raised-surface rounded border p-4 text-left transition-colors ${
                    isActive
                      ? 'border-osint-primary bg-osint-primary/8'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="osint-meta-label">{preset.label}</div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-sm border border-zinc-700"
                        style={{ background: buildAccentColor(preset.settings.dark.panel) }}
                      />
                      <div
                        className="h-3 w-3 rounded-sm border border-zinc-700"
                        style={{ background: buildAccentColor(preset.settings.light.panel) }}
                      />
                    </div>
                  </div>
                  <p className="osint-body-small mt-3">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="osint-raised-surface rounded border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Surface Workbench</div>
              <div className="osint-title-card mt-2">
                {activeSurfaceMode === 'dark' ? 'Dark' : 'Light'} mode
              </div>
            </div>
            <div className="inline-flex border border-zinc-800 bg-black">
              {(['dark', 'light'] as Array<keyof ThemeSurfaceSettings>).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActiveSurfaceMode(mode)}
                  className={`osint-meta-label px-4 py-2 transition-colors ${
                    activeSurfaceMode === mode
                      ? 'bg-osint-primary/12 text-osint-primary'
                      : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="osint-raised-surface rounded border border-zinc-800 bg-black p-4">
                <div className="osint-meta-label">Surface Preview</div>
                <div
                  className="mt-4 rounded border p-4"
                  style={{
                    background: buildAccentColor(themeSurfaceSettings[activeSurfaceMode].background),
                    borderColor:
                      selectedSurfaceKey === 'background'
                        ? 'color-mix(in oklab, var(--osint-primary) 55%, white)'
                        : backgroundTone.borderColor,
                    boxShadow:
                      selectedSurfaceKey === 'background'
                        ? '0 0 0 1px color-mix(in oklab, var(--osint-primary) 30%, transparent)'
                        : undefined,
                  }}
                >
                  <div
                    className="rounded border p-4"
                    style={{
                      background: buildAccentColor(themeSurfaceSettings[activeSurfaceMode].panel),
                      borderColor:
                        selectedSurfaceKey === 'panel'
                          ? 'color-mix(in oklab, var(--osint-primary) 55%, white)'
                          : panelTone.borderColor,
                      boxShadow:
                        selectedSurfaceKey === 'panel'
                          ? '0 0 0 1px color-mix(in oklab, var(--osint-primary) 30%, transparent)'
                          : undefined,
                    }}
                  >
                    <div
                      className="rounded border p-4"
                      style={{
                        background: buildAccentColor(themeSurfaceSettings[activeSurfaceMode].surface),
                        borderColor:
                          selectedSurfaceKey === 'surface'
                            ? 'color-mix(in oklab, var(--osint-primary) 55%, white)'
                            : surfaceTone.borderColor,
                        boxShadow:
                          selectedSurfaceKey === 'surface'
                            ? '0 0 0 1px color-mix(in oklab, var(--osint-primary) 30%, transparent)'
                            : undefined,
                      }}
                    >
                      <div className="osint-title-inline mt-2" style={{ color: surfaceTone.textColor }}>
                        {SURFACE_LABELS[selectedSurfaceKey]}
                      </div>
                      <div className="mt-3 h-8 rounded border" style={{ borderColor: surfaceTone.overlayColor }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="osint-raised-surface rounded border border-zinc-800 bg-black p-4">
                <div className="osint-meta-label">Surface Targets</div>
                <div className="mt-3 grid gap-2">
                  {(Object.keys(SURFACE_LABELS) as Array<keyof ThemeSurfaceScale>).map((surfaceKey) => {
                    const surface = themeSurfaceSettings[activeSurfaceMode][surfaceKey];
                    return (
                      <button
                        key={surfaceKey}
                        type="button"
                        onClick={() => setSelectedSurfaceKey(surfaceKey)}
                        className={`flex items-center justify-between border px-3 py-2 text-left transition-colors ${
                          selectedSurfaceKey === surfaceKey
                            ? 'border-osint-primary bg-osint-primary/10'
                            : 'border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <div>
                          <div className="osint-title-inline">{SURFACE_LABELS[surfaceKey]}</div>
                          <div className="osint-meta-label">
                            h {surface.hue.toFixed(0)} / l {surface.lightness.toFixed(3)} / c{' '}
                            {surface.chroma.toFixed(3)}
                          </div>
                        </div>
                        <div
                          className="h-6 w-6 rounded border border-zinc-700"
                          style={{ background: buildAccentColor(surface) }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="osint-raised-surface rounded border border-zinc-800 bg-black p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="osint-meta-label">Selected Surface</div>
                    <div className="osint-title-inline mt-1">
                      {SURFACE_LABELS[selectedSurfaceKey]}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResetSurfaceMode(activeSurfaceMode)}
                    className="osint-meta-label-strong border border-zinc-700 px-3 py-1 text-zinc-400 transition-colors hover:border-white hover:text-white"
                  >
                    Reset {activeSurfaceMode}
                  </button>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  {(
                    [
                      ['hue', 'Hue', 0, 360, 1],
                      ['lightness', 'Lightness', bounds.lightnessMin, bounds.lightnessMax, 0.001],
                      ['chroma', 'Chroma', 0, bounds.chromaMax, 0.001],
                    ] as const
                  ).map(([field, label, min, max, step]) => (
                    <label key={field} className="block">
                      <span className="osint-meta-label mb-2 block">{label}</span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={selectedSurface[field]}
                        onChange={(event) =>
                          updateSelectedSurfaceField(field, Number(event.target.value))
                        }
                        className="w-full accent-[var(--osint-primary)]"
                      />
                      <div className="osint-meta-label mt-2">
                        {selectedSurface[field].toFixed(field === 'hue' ? 0 : 3)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="osint-raised-surface rounded border border-zinc-800 bg-black p-4">
                <div className="osint-meta-label">Quick Adjust</div>
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleMatchAccentHue(activeSurfaceMode)}
                    className="osint-meta-label-strong w-full border border-zinc-800 px-3 py-2 text-zinc-300 transition hover:border-osint-primary hover:text-white"
                  >
                    Match Accent Hue
                  </button>
                  <div className="grid gap-2 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleAdjustModeChroma(activeSurfaceMode, 0.004)}
                      className="osint-meta-label-strong border border-zinc-800 px-3 py-2 text-zinc-300 transition hover:border-osint-primary hover:text-white"
                    >
                      Increase Chroma
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustModeChroma(activeSurfaceMode, -0.004)}
                      className="osint-meta-label-strong border border-zinc-800 px-3 py-2 text-zinc-300 transition hover:border-osint-primary hover:text-white"
                    >
                      Reduce Chroma
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleAdjustModeSeparation(activeSurfaceMode, 1)}
                      className="osint-meta-label-strong border border-zinc-800 px-3 py-2 text-zinc-300 transition hover:border-osint-primary hover:text-white"
                    >
                      Increase Separation
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustModeSeparation(activeSurfaceMode, -1)}
                      className="osint-meta-label-strong border border-zinc-800 px-3 py-2 text-zinc-300 transition hover:border-osint-primary hover:text-white"
                    >
                      Soften Separation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFontSection = () => (
    <div className="space-y-6 px-3 pb-3 pt-1">
      <div className="flex items-center justify-between gap-3">
        <div className="osint-meta-label">Font Roles</div>
        <button
          type="button"
          onClick={handleResetFonts}
          className="osint-meta-label-strong border border-zinc-700 px-3 py-1 text-zinc-400 transition-colors hover:border-white hover:text-white"
        >
          Reset Fonts
        </button>
      </div>

      <div className="osint-raised-surface rounded border border-zinc-800 bg-zinc-950/50 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          {fontSelections.map((role) => (
            <label key={role.key} className="osint-raised-surface rounded border border-zinc-800 bg-black/50 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="osint-title-inline">{role.label}</span>
                <span className="osint-meta-label">
                  {role.activeOption.label}
                </span>
              </div>
              <select
                value={themeFontSettings[role.key]}
                onChange={(event) =>
                  onThemeFontSettingsChange({
                    ...themeFontSettings,
                    [role.key]: event.target.value,
                  })
                }
                className="osint-meta-value mt-3 w-full border border-zinc-700 bg-black px-3 py-2.5 text-white outline-none focus:border-osint-primary"
              >
                {getThemeFontOptionsForRole(role.key).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="osint-raised-surface rounded border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="osint-meta-label">Global Size Scale</div>
              <p className="osint-body-small mt-2">
                Shift the whole typography system up or down without rewriting each screen.
              </p>
            </div>
            <span className="osint-meta-label">
              {activeSizeProfile.label}
            </span>
          </div>
          <div className="osint-raised-surface-subtle mt-4 rounded border border-zinc-800 bg-black/50 p-4">
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={themeFontSettings.size}
              onChange={(event) =>
                onThemeFontSettingsChange({
                  ...themeFontSettings,
                  size: Number(event.target.value),
                })
              }
              className="w-full accent-[var(--osint-primary)]"
            />
            <div className="osint-meta-label mt-3 flex items-center justify-between">
              <span>Compact</span>
              <span>Base {resolvedSizes.base}</span>
              <span>Large</span>
            </div>
          </div>
        </div>

        <div className="osint-raised-surface rounded border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="osint-meta-label">Global Weight Profile</div>
              <p className="osint-body-small mt-2">
                Keep emphasis consistent across labels, headings, and buttons.
              </p>
            </div>
            <span className="osint-meta-label">
              {activeWeightProfile.label}
            </span>
          </div>
          <div className="osint-raised-surface-subtle mt-4 rounded border border-zinc-800 bg-black/50 p-4">
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={themeFontSettings.weight}
              onChange={(event) =>
                onThemeFontSettingsChange({
                  ...themeFontSettings,
                  weight: Number(event.target.value),
                })
              }
              className="w-full accent-[var(--osint-primary)]"
            />
            <div className="osint-meta-label mt-3 flex items-center justify-between">
              <span>Regular</span>
              <span>Bold {resolvedWeights.bold}</span>
              <span>Strong</span>
            </div>
          </div>
        </div>
      </div>

      <div className="osint-raised-surface rounded border border-zinc-800 bg-black/60 p-5">
        <div
          className="osint-meta-label"
          style={{
            fontFamily: fontSelectionByRole.label.activeOption.cssValue,
            fontSize: resolvedSizes['2xs'],
            fontWeight: resolvedWeights.label,
          }}
        >
          Incident Desk / Theme Preview
        </div>
        <div
          className="mt-3 leading-tight text-white"
          style={{
            fontFamily: fontSelectionByRole.display.activeOption.cssValue,
            fontSize: resolvedSizes['3xl'],
            fontWeight: resolvedWeights.display,
          }}
        >
          Operational Summary
        </div>
        <p
          className="mt-4 max-w-3xl leading-7 text-zinc-300"
          style={{
            fontFamily: fontSelectionByRole.ui.activeOption.cssValue,
            fontSize: resolvedSizes.base,
          }}
        >
          Signal review should stay calm and readable while headings, chrome, and dense evidence
          still feel like part of the same system.
        </p>
        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="osint-raised-surface-subtle rounded border border-zinc-800 bg-zinc-950/70 p-4">
            <div
              className="osint-meta-label"
              style={{
                fontFamily: fontSelectionByRole.label.activeOption.cssValue,
                fontSize: resolvedSizes['2xs'],
                fontWeight: resolvedWeights.label,
              }}
            >
              Navigation Labels
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Data', 'Runtime', 'Scopes', 'Theme'].map((item) => (
                <span
                  key={item}
                  className="border border-zinc-700 px-2 py-1 uppercase text-zinc-300"
                  style={{
                    fontFamily: fontSelectionByRole.label.activeOption.cssValue,
                    fontSize: resolvedSizes.xs,
                    fontWeight: resolvedWeights.label,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="osint-raised-surface-subtle rounded border border-zinc-800 bg-zinc-950/70 p-4">
            <div
              className="osint-meta-label"
              style={{
                fontFamily: fontSelectionByRole.label.activeOption.cssValue,
                fontSize: resolvedSizes['2xs'],
                fontWeight: resolvedWeights.label,
              }}
            >
              Evidence Sample
            </div>
            <pre
              className="mt-3 overflow-x-auto leading-7 text-zinc-300"
              style={{
                fontFamily: fontSelectionByRole.mono.activeOption.cssValue,
                fontSize: resolvedSizes.sm,
              }}
            >
              <code>{`artifact_id=ops-17\noklch(0.21 0.01 286)\nstatus=monitoring`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );

  const renderThemeAccentSection = () => (
    <div className="space-y-6 px-3 pb-3 pt-1">
      <div className="grid auto-rows-fr gap-6 xl:grid-cols-2">
        <div className="osint-raised-surface flex h-full flex-col rounded border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="h-4 w-4 rounded-sm border border-zinc-700 shadow-[0_0_8px_rgba(255,255,255,0.08)]"
                style={{ background: buildAccentColor(accentSettings) }}
              />
              <div className="min-w-0">
                <div className="osint-meta-label block">Custom Accent</div>
                <div className="osint-meta-value mt-1 truncate">{buildAccentColor(accentSettings)}</div>
              </div>
            </div>
            <button
              onClick={handleResetThemeSettings}
              className="osint-meta-label-strong border border-zinc-700 px-3 py-1 text-zinc-400 transition-colors hover:border-white hover:text-white"
            >
              Reset Theme
            </button>
          </div>
          <div className="mt-8 flex-1">
            <AccentPicker
              hue={accentSettings.hue}
              lightness={accentSettings.lightness}
              chroma={accentSettings.chroma}
              containerClassName="flex h-full flex-col gap-8 py-3"
              sectionClassNames={{
                hue: themeControlSectionClassName,
                lightness: themeControlSectionClassName,
                chroma: themeControlSectionClassName,
              }}
              showPreview={false}
              onChange={onAccentChange}
            />
          </div>
        </div>

        <div className="osint-raised-surface flex h-full flex-col rounded border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="h-4 w-4 rounded-sm border border-zinc-700 shadow-[0_0_8px_rgba(255,255,255,0.08)]"
                style={{ background: buildThemeBackgroundDotColor(themeBackgroundSettings) }}
              />
              <div className="min-w-0">
                <div className="osint-meta-label block">Background Pattern</div>
                <div className="osint-meta-value mt-1 truncate">
                  {backgroundVariantLabel} / {Math.round(themeBackgroundSettings.dotOpacity * 100)}%
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                handleThemeBackgroundVariantChange(DEFAULT_THEME_BACKGROUND_SETTINGS.variant);
                updateThemeBackgroundField('dotColor', DEFAULT_THEME_BACKGROUND_SETTINGS.dotColor);
                updateThemeBackgroundField('dotOpacity', DEFAULT_THEME_BACKGROUND_SETTINGS.dotOpacity);
              }}
              className="osint-meta-label-strong border border-zinc-700 px-3 py-1 text-zinc-400 transition-colors hover:border-white hover:text-white"
            >
              Reset Background
            </button>
          </div>

          <div className="mt-8 flex flex-1 flex-col gap-8 py-3">
            <label className={themeControlSectionClassName}>
              <div className="flex items-center justify-between gap-3">
                <span className="osint-meta-label">Background Image</span>
                <span className="osint-meta-value">{backgroundVariantLabel}</span>
              </div>
              <OsintSelect
                ariaLabel="Background image"
                value={themeBackgroundSettings.variant}
                onChange={(value) =>
                  handleThemeBackgroundVariantChange(
                    value as ThemeBackgroundSettings['variant']
                  )
                }
                triggerClassName="h-12 px-4 pr-8 osint-meta-value"
                options={[
                  { value: 'plain', label: 'Plain' },
                  { value: 'grid', label: 'Grid' },
                ]}
              />
            </label>

            <label className={themeControlSectionClassName}>
              <div className="flex items-center justify-between gap-3">
                <span className="osint-meta-label">Dot Color</span>
                <span className="osint-meta-value">{themeBackgroundSettings.dotColor}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={themeBackgroundSettings.dotColor}
                onChange={(event) =>
                  updateThemeBackgroundField('dotColor', Number(event.target.value))
                }
                className="w-full accent-[var(--osint-primary)]"
              />
            </label>

            <label className={themeControlSectionClassName}>
              <div className="flex items-center justify-between gap-3">
                <span className="osint-meta-label">Dot Opacity</span>
                <span className="osint-meta-value">
                  {Math.round(themeBackgroundSettings.dotOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={themeBackgroundSettings.dotOpacity}
                onChange={(event) =>
                  updateThemeBackgroundField('dotOpacity', Number(event.target.value))
                }
                className="w-full accent-[var(--osint-primary)]"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6 pb-12">
      <Accordion
        title="Accent"
        isOpen={themeSections.accent}
        onToggle={() => toggleThemeSection('accent')}
        className="mb-0"
        disableActiveHeaderStyle
      >
        {renderThemeAccentSection()}
      </Accordion>

      <Accordion
        title="Fonts"
        isOpen={themeSections.fonts}
        onToggle={() => toggleThemeSection('fonts')}
        className="mb-0"
        disableActiveHeaderStyle
      >
        {renderFontSection()}
      </Accordion>

      <Accordion
        title="Surface System"
        isOpen={themeSections.surfaces}
        onToggle={() => toggleThemeSection('surfaces')}
        className="mb-0"
        disableActiveHeaderStyle
      >
        {renderThemeSurfaceEditor()}
      </Accordion>
    </div>
  );
};
