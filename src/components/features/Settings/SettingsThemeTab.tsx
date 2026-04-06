import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Palette, Type } from 'lucide-react';

import { Accordion } from '@/components/ui/Accordion';
import { AccentPicker } from '@/components/ui/AccentPicker';
import { buildAccentColor } from '@/utils/accent';
import {
  THEME_SURFACE_PRESETS,
  type ThemeSurfaceScale,
  type ThemeSurfaceSettings,
} from '@/utils/themeSurfaces';
import {
  THEME_FONT_OPTIONS,
  getThemeFontOption,
  getThemeFontOptionsForRole,
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
  handleMatchAccentHue: (mode: keyof ThemeSurfaceSettings) => void;
  handleResetFonts: () => void;
  handleResetSurfaceMode: (mode: keyof ThemeSurfaceSettings) => void;
  handleResetThemeSettings: () => void;
  onAccentChange: (settings: { hue: number; lightness: number; chroma: number }) => void;
  onThemeFontSettingsChange: (settings: ThemeFontSettings) => void;
  selectedSurfaceKey: keyof ThemeSurfaceScale;
  setActiveSurfaceMode: Dispatch<SetStateAction<keyof ThemeSurfaceSettings>>;
  setSelectedSurfaceKey: Dispatch<SetStateAction<keyof ThemeSurfaceScale>>;
  themeFontSettings: ThemeFontSettings;
  themeSections: {
    accent: boolean;
    fonts: boolean;
    surfaces: boolean;
  };
  themeSurfaceSettings: ThemeSurfaceSettings;
  toggleThemeSection: (section: 'accent' | 'fonts' | 'surfaces') => void;
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
  handleMatchAccentHue,
  handleResetFonts,
  handleResetSurfaceMode,
  handleResetThemeSettings,
  onAccentChange,
  onThemeFontSettingsChange,
  selectedSurfaceKey,
  setActiveSurfaceMode,
  setSelectedSurfaceKey,
  themeFontSettings,
  themeSections,
  themeSurfaceSettings,
  toggleThemeSection,
  updateSelectedSurfaceField,
}) => {
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
              <div className="font-osint-label text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                Theme Presets
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Start from a whole-system palette, then tune only the one surface that needs it.
                Full OKLCH values stay available without keeping eighteen sliders on screen.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetThemeSettings}
              className="font-osint-label px-3 py-1 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white text-[10px] uppercase transition-colors"
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
                  className={`rounded border p-4 text-left transition-colors ${
                    isActive
                      ? 'border-osint-primary bg-osint-primary/8'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-osint-label text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      {preset.label}
                    </div>
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
                  <p className="mt-3 text-sm leading-6 text-zinc-300">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-osint-label text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                Surface Workbench
              </div>
              <div className="mt-2 font-osint-display text-lg font-bold text-white">
                {activeSurfaceMode === 'dark' ? 'Dark' : 'Light'} mode
              </div>
            </div>
            <div className="inline-flex border border-zinc-800 bg-black">
              {(['dark', 'light'] as Array<keyof ThemeSurfaceSettings>).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActiveSurfaceMode(mode)}
                  className={`font-osint-label px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
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
              <div className="rounded border border-zinc-800 bg-black p-4">
                <div className="text-[10px] font-osint-label uppercase tracking-[0.22em] text-zinc-500">
                  Surface Preview
                </div>
                <div
                  className="mt-4 rounded border p-4"
                  style={{
                    background: buildAccentColor(themeSurfaceSettings[activeSurfaceMode].background),
                    borderColor: backgroundTone.borderColor,
                  }}
                >
                  <div
                    className="rounded border p-4"
                    style={{
                      background: buildAccentColor(themeSurfaceSettings[activeSurfaceMode].panel),
                      borderColor: panelTone.borderColor,
                    }}
                  >
                    <div
                      className="rounded border p-4"
                      style={{
                        background: buildAccentColor(themeSurfaceSettings[activeSurfaceMode].surface),
                        borderColor: surfaceTone.borderColor,
                      }}
                    >
                      <div
                        className="text-xs uppercase tracking-[0.22em]"
                        style={{ color: surfaceTone.labelColor }}
                      >
                        Selected Surface
                      </div>
                      <div className="mt-2 text-base font-semibold" style={{ color: surfaceTone.textColor }}>
                        {SURFACE_LABELS[selectedSurfaceKey]}
                      </div>
                      <div className="mt-3 h-8 rounded border" style={{ borderColor: surfaceTone.overlayColor }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded border border-zinc-800 bg-black p-4">
                <div className="text-[10px] font-osint-label uppercase tracking-[0.22em] text-zinc-500">
                  Surface Targets
                </div>
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
                          <div className="text-xs font-medium text-white">{SURFACE_LABELS[surfaceKey]}</div>
                          <div className="text-[10px] font-mono uppercase text-zinc-500">
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
              <div className="rounded border border-zinc-800 bg-black p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-osint-label uppercase tracking-[0.22em] text-zinc-500">
                      Selected Surface
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {SURFACE_LABELS[selectedSurfaceKey]}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResetSurfaceMode(activeSurfaceMode)}
                    className="font-osint-label px-3 py-1 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white text-[10px] uppercase transition-colors"
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
                      <span className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                        {label}
                      </span>
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
                      <div className="mt-2 text-[10px] font-mono uppercase text-zinc-500">
                        {selectedSurface[field].toFixed(field === 'hue' ? 0 : 3)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded border border-zinc-800 bg-black p-4">
                <div className="text-[10px] font-osint-label uppercase tracking-[0.22em] text-zinc-500">
                  Quick Adjust
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleMatchAccentHue(activeSurfaceMode)}
                    className="border border-zinc-800 px-3 py-2 text-xs font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                  >
                    Match Accent Hue
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustModeChroma(activeSurfaceMode, 0.004)}
                    className="border border-zinc-800 px-3 py-2 text-xs font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                  >
                    Increase Chroma
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustModeChroma(activeSurfaceMode, -0.004)}
                    className="border border-zinc-800 px-3 py-2 text-xs font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                  >
                    Reduce Chroma
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustModeSeparation(activeSurfaceMode, 1)}
                    className="border border-zinc-800 px-3 py-2 text-xs font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                  >
                    Increase Separation
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustModeSeparation(activeSurfaceMode, -1)}
                    className="border border-zinc-800 px-3 py-2 text-xs font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white md:col-span-2"
                  >
                    Soften Separation
                  </button>
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
        <div>
          <div className="font-osint-label text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            Font Roles
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Each role maps to a curated font set so headers, labels, and dense evidence can carry
            different voices without breaking the system.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetFonts}
          className="font-osint-label px-3 py-1 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white text-[10px] uppercase transition-colors"
        >
          Reset Fonts
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {FONT_ROLE_CARDS.map((role) => {
          const activeOption = getThemeFontOption(themeFontSettings[role.key]);
          return (
            <div key={role.key} className="rounded border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-white">{role.label}</div>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{role.description}</p>
                </div>
                <div className="text-[10px] font-mono uppercase text-zinc-500">
                  {activeOption?.label || themeFontSettings[role.key]}
                </div>
              </div>
              <div className="mt-4">
                <select
                  value={themeFontSettings[role.key]}
                  onChange={(event) =>
                    onThemeFontSettingsChange({
                      ...themeFontSettings,
                      [role.key]: event.target.value,
                    })
                  }
                  className="w-full border border-zinc-700 bg-black px-3 py-3 text-xs font-mono text-white outline-none focus:border-osint-primary"
                >
                  {getThemeFontOptionsForRole(role.key).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className="mt-4 rounded border border-zinc-800 bg-black/60 p-4"
                style={{
                  fontFamily: THEME_FONT_OPTIONS.find(
                    (option) => option.id === themeFontSettings[role.key]
                  )?.cssValue,
                }}
              >
                <div className="text-[10px] font-mono uppercase text-zinc-500">Preview</div>
                <div className="mt-3 text-lg text-white">{role.sample}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12 space-y-6">
      <Accordion
        title="Accent"
        icon={Palette}
        isOpen={themeSections.accent}
        onToggle={() => toggleThemeSection('accent')}
        className="mb-0"
      >
        <div className="space-y-6 px-3 pb-3 pt-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded-sm border border-zinc-700 shadow-[0_0_8px_rgba(255,255,255,0.08)]"
                style={{ background: buildAccentColor(accentSettings) }}
              />
              <label className="font-osint-label block text-[10px] text-zinc-500 uppercase">
                Custom Accent
              </label>
            </div>
            <button
              onClick={handleResetThemeSettings}
              className="font-osint-label px-3 py-1 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white text-[10px] uppercase transition-colors"
            >
              Reset Theme
            </button>
          </div>
          <div className="font-osint-label text-[10px] text-zinc-500">
            {buildAccentColor(accentSettings)}
          </div>
          <AccentPicker
            hue={accentSettings.hue}
            lightness={accentSettings.lightness}
            chroma={accentSettings.chroma}
            showPreview={false}
            onChange={onAccentChange}
          />
        </div>
      </Accordion>

      <Accordion
        title="Surface System"
        icon={Palette}
        isOpen={themeSections.surfaces}
        onToggle={() => toggleThemeSection('surfaces')}
        className="mb-0"
      >
        {renderThemeSurfaceEditor()}
      </Accordion>

      <Accordion
        title="Fonts"
        icon={Type}
        isOpen={themeSections.fonts}
        onToggle={() => toggleThemeSection('fonts')}
        className="mb-0"
      >
        {renderFontSection()}
      </Accordion>
    </div>
  );
};
