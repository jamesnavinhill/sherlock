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
  SETTINGS_ACCORDION_CLASS,
  SETTINGS_CARD_ACTIVE_CLASS,
  SETTINGS_CARD_CLASS,
  SETTINGS_CARD_INTERACTIVE_CLASS,
  SETTINGS_CARD_SECTION_SUBTLE_CLASS,
  SETTINGS_SELECT_TRIGGER_CLASS,
  SETTINGS_SECTION_BODY_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
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
  handleResetSelectedSurface: (
    mode: keyof ThemeSurfaceSettings,
    surfaceKey: keyof ThemeSurfaceScale
  ) => void;
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
  handleResetSelectedSurface,
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
  const themeWorkbenchActionClassName =
    `${SETTINGS_SURFACE_BUTTON_CLASS} osint-meta-label-strong flex h-[2.875rem] w-full items-center justify-center px-3 text-center transition-colors`;
  const activeSurfaceLabelClassName =
    'text-[color:var(--osint-primary)] [text-shadow:0_0_12px_color-mix(in_oklab,var(--osint-primary)_30%,transparent)]';

  const renderThemeSurfaceEditor = () => {
    const selectedSurface = themeSurfaceSettings[activeSurfaceMode][selectedSurfaceKey];
    const bounds = getSurfaceBounds(activeSurfaceMode, selectedSurfaceKey);
    const backgroundTone = getSurfacePreviewTone(themeSurfaceSettings[activeSurfaceMode].background);
    const panelTone = getSurfacePreviewTone(themeSurfaceSettings[activeSurfaceMode].panel);
    const surfaceTone = getSurfacePreviewTone(themeSurfaceSettings[activeSurfaceMode].surface);

    return (
      <div className={SETTINGS_SECTION_BODY_CLASS}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Theme Presets</div>
            </div>
            <button
              type="button"
              onClick={handleResetThemeSettings}
              className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-1 osint-meta-label-strong`}
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
                  data-active={isActive ? 'true' : undefined}
                  className={`${SETTINGS_CARD_INTERACTIVE_CLASS} text-left ${
                    isActive ? SETTINGS_CARD_ACTIVE_CLASS : ''
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

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Surface Workbench</div>
            </div>
            <div className="inline-flex gap-2">
              {(['dark', 'light'] as Array<keyof ThemeSurfaceSettings>).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActiveSurfaceMode(mode)}
                  aria-pressed={activeSurfaceMode === mode}
                  data-active={activeSurfaceMode === mode ? 'true' : undefined}
                  className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-4 py-2 osint-meta-label`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,2.05fr)]">
            <div className="grid gap-4 xl:auto-rows-fr">
              <div className={`${SETTINGS_CARD_CLASS} flex h-full flex-col`}>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="osint-meta-label">Surface Preview</div>
                  <div
                    className="osint-title-inline text-zinc-100 [text-shadow:0_0_14px_rgba(255,255,255,0.16)]"
                  >
                    {SURFACE_LABELS[selectedSurfaceKey]}
                  </div>
                </div>
                <div
                  className="mt-4 flex flex-1 items-center justify-center rounded border p-5"
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
                    className="flex h-full w-[86%] items-center justify-center rounded border p-5"
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
                      className="flex min-h-[3.25rem] w-[72%] max-w-[13rem] items-center justify-center rounded border p-2"
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
                      <div
                        className="flex h-full w-full items-center justify-center rounded border p-2 text-center"
                        style={{ borderColor: surfaceTone.overlayColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${SETTINGS_CARD_CLASS} flex h-full flex-col`}>
                <div className="osint-meta-label">Surface Targets</div>
                <div className="mt-3 grid flex-1 content-start gap-2">
                  {(Object.keys(SURFACE_LABELS) as Array<keyof ThemeSurfaceScale>).map((surfaceKey) => {
                    const surface = themeSurfaceSettings[activeSurfaceMode][surfaceKey];
                    return (
                      <button
                        key={surfaceKey}
                        type="button"
                        onClick={() => setSelectedSurfaceKey(surfaceKey)}
                        data-active={selectedSurfaceKey === surfaceKey ? 'true' : undefined}
                        className={`${SETTINGS_SURFACE_BUTTON_CLASS} flex items-center justify-between px-3 py-2 text-left transition-colors`}
                      >
                        <div>
                          <div
                            className={`osint-title-inline ${
                              selectedSurfaceKey === surfaceKey ? activeSurfaceLabelClassName : ''
                            }`}
                          >
                            {SURFACE_LABELS[surfaceKey]}
                          </div>
                          <div
                            className={`osint-meta-label ${
                              selectedSurfaceKey === surfaceKey ? activeSurfaceLabelClassName : ''
                            }`}
                          >
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

            <div className="grid gap-4 xl:auto-rows-fr">
              <div className={`${SETTINGS_CARD_CLASS} flex h-full flex-col`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="osint-meta-label">Selected Surface</div>
                    <div className={`osint-title-inline mt-1 ${activeSurfaceLabelClassName}`}>
                      {SURFACE_LABELS[selectedSurfaceKey]}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResetSurfaceMode(activeSurfaceMode)}
                    className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-1 osint-meta-label-strong`}
                  >
                    Reset {activeSurfaceMode}
                  </button>
                </div>

                <div className="mt-5 flex flex-1 items-center">
                  <div className="grid w-full gap-5 lg:grid-cols-3">
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
              </div>

              <div className={`${SETTINGS_CARD_CLASS} flex h-full flex-col`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="osint-meta-label">Quick Adjust</div>
                  <button
                    type="button"
                    onClick={() =>
                      handleResetSelectedSurface(activeSurfaceMode, selectedSurfaceKey)
                    }
                    className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-1 osint-meta-label-strong`}
                  >
                    Reset Surface
                  </button>
                </div>
                <div className="mt-4 flex flex-1 flex-col justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleMatchAccentHue(activeSurfaceMode)}
                    className={themeWorkbenchActionClassName}
                  >
                    Match Accent Hue
                  </button>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleAdjustModeChroma(activeSurfaceMode, 0.004)}
                      className={themeWorkbenchActionClassName}
                    >
                      Increase Chroma
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustModeChroma(activeSurfaceMode, -0.004)}
                      className={themeWorkbenchActionClassName}
                    >
                      Reduce Chroma
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleAdjustModeSeparation(activeSurfaceMode, 1)}
                      className={themeWorkbenchActionClassName}
                    >
                      Increase Separation
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustModeSeparation(activeSurfaceMode, -1)}
                      className={themeWorkbenchActionClassName}
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
          className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-1 osint-meta-label-strong`}
        >
          Reset Fonts
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {fontSelections.map((role) => (
          <label key={role.key} className={SETTINGS_CARD_CLASS}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="osint-title-inline">{role.label}</span>
              <span className="osint-meta-label">
                {role.activeOption.label}
              </span>
            </div>
            <OsintSelect
              ariaLabel={`${role.label} font family`}
              value={themeFontSettings[role.key]}
              onChange={(event) =>
                onThemeFontSettingsChange({
                  ...themeFontSettings,
                  [role.key]: event,
                })
              }
              triggerClassName={`mt-3 ${SETTINGS_SELECT_TRIGGER_CLASS}`}
              portalledMenu
              options={getThemeFontOptionsForRole(role.key).map((option) => ({
                value: option.id,
                label: option.label,
              }))}
            />
          </label>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className={SETTINGS_CARD_CLASS}>
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
          <div className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} mt-4`}>
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

        <div className={SETTINGS_CARD_CLASS}>
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
          <div className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} mt-4`}>
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

      <div className={`${SETTINGS_CARD_CLASS} p-5`}>
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
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div
            className="leading-tight text-white"
            style={{
              fontFamily: fontSelectionByRole.display.activeOption.cssValue,
              fontSize: resolvedSizes['3xl'],
              fontWeight: resolvedWeights.display,
            }}
          >
            Operational Summary
          </div>
          <div className="flex flex-wrap gap-2">
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
        <pre
          className="mt-5 overflow-x-auto leading-7 text-zinc-300"
          style={{
            fontFamily: fontSelectionByRole.mono.activeOption.cssValue,
            fontSize: resolvedSizes.sm,
          }}
        >
          <code>{`artifact_id=ops-17\noklch(0.21 0.01 286)\nstatus=monitoring`}</code>
        </pre>
      </div>
    </div>
  );

  const renderThemeAccentSection = () => (
    <div className="space-y-6 px-3 pb-3 pt-1">
      <div className="grid auto-rows-fr gap-6 xl:grid-cols-2">
        <div className={`${SETTINGS_CARD_CLASS} flex h-full flex-col`}>
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
              className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-1 osint-meta-label-strong`}
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

        <div className={`${SETTINGS_CARD_CLASS} flex h-full flex-col`}>
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
              className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-1 osint-meta-label-strong`}
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
                triggerClassName={SETTINGS_SELECT_TRIGGER_CLASS}
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
        className={SETTINGS_ACCORDION_CLASS}
        disableActiveHeaderStyle
      >
        {renderThemeAccentSection()}
      </Accordion>

      <Accordion
        title="Fonts"
        isOpen={themeSections.fonts}
        onToggle={() => toggleThemeSection('fonts')}
        className={SETTINGS_ACCORDION_CLASS}
        disableActiveHeaderStyle
      >
        {renderFontSection()}
      </Accordion>

      <Accordion
        title="Surface System"
        isOpen={themeSections.surfaces}
        onToggle={() => toggleThemeSection('surfaces')}
        className={SETTINGS_ACCORDION_CLASS}
        disableActiveHeaderStyle
      >
        {renderThemeSurfaceEditor()}
      </Accordion>
    </div>
  );
};
