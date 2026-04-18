import React from 'react';

import { RangeField } from '@/components/system/controls';
import { AccentPicker } from '@/components/ui/AccentPicker';
import { OsintSelect } from '@/components/ui/OsintSelect';
import { buildAccentColor } from '@/utils/accent';
import {
  createDefaultSherlockThemeGraphs,
  SHERLOCK_THEME_BACKGROUND_VARIANTS,
  SHERLOCK_THEME_LIBRARY_TEMPLATES,
  type SherlockTheme,
  type SherlockThemeMode,
  type SherlockThemeSurfaceScale,
} from '@/system/theme/schema';
import {
  SETTINGS_CARD_ACTIVE_CLASS,
  SETTINGS_CARD_CLASS,
  SETTINGS_CARD_INTERACTIVE_CLASS,
  SETTINGS_CARD_SECTION_SUBTLE_CLASS,
  SETTINGS_SECTION_BODY_CLASS,
  SETTINGS_SELECT_TRIGGER_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
} from '../settingsUtils';
import type {
  ThemeBackgroundField,
  ThemeGraphField,
  ThemeStructureKey,
  ThemeSurfaceField,
} from './shared';
import { STRUCTURE_LABELS, getTone } from './shared';

interface ThemeWorkbenchThemeTabProps {
  activeGraphIndex: number;
  activeTheme: SherlockTheme;
  activeThemeId: string;
  editingMode: SherlockThemeMode;
  forkActiveTheme: () => void;
  previewMode: SherlockThemeMode;
  saveActiveTheme: () => void;
  selectedBackground: SherlockTheme['background']['dark'];
  selectedGraph: SherlockTheme['graphs'][number];
  selectedStructureKey: ThemeStructureKey;
  selectedSurface: SherlockThemeSurfaceScale[ThemeStructureKey];
  selectTheme: (themeId: string) => void;
  setActiveGraphIndex: React.Dispatch<React.SetStateAction<number>>;
  setEditingMode: React.Dispatch<React.SetStateAction<SherlockThemeMode>>;
  setPreviewMode: (mode: SherlockThemeMode) => void;
  setSelectedStructureKey: React.Dispatch<React.SetStateAction<ThemeStructureKey>>;
  surfaceBounds: { chromaMax: number; lightnessMax: number; lightnessMin: number };
  updateBackgroundField: (field: ThemeBackgroundField, rawValue: number) => void;
  updateGraphField: (field: ThemeGraphField, rawValue: number) => void;
  updateSurfaceField: (field: ThemeSurfaceField, rawValue: number) => void;
  updateTheme: (updater: (theme: SherlockTheme) => SherlockTheme) => void;
}

export const ThemeWorkbenchThemeTab: React.FC<ThemeWorkbenchThemeTabProps> = ({
  activeGraphIndex,
  activeTheme,
  activeThemeId,
  editingMode,
  forkActiveTheme,
  previewMode,
  saveActiveTheme,
  selectedBackground,
  selectedGraph,
  selectedStructureKey,
  selectedSurface,
  selectTheme,
  setActiveGraphIndex,
  setEditingMode,
  setPreviewMode,
  setSelectedStructureKey,
  surfaceBounds,
  updateBackgroundField,
  updateGraphField,
  updateSurfaceField,
  updateTheme,
}) => {
  const previewShell = activeTheme.surfaces[previewMode].shell;
  const previewRail = activeTheme.surfaces[previewMode].rail;
  const previewPanel = activeTheme.surfaces[previewMode].panel;
  const previewSurface = activeTheme.surfaces[previewMode].surface;

  return (
    <div className={SETTINGS_SECTION_BODY_CLASS}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)]">
        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Preview Mode</div>
              <div className="mt-1 osint-title-inline capitalize">{previewMode}</div>
            </div>
            <div className="inline-flex gap-2">
              {(['dark', 'light'] as SherlockThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPreviewMode(mode)}
                  data-active={previewMode === mode ? 'true' : undefined}
                  className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-4 py-2 osint-meta-label`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div
            className="grid min-h-[18rem] gap-4 rounded border p-5"
            style={{
              background: buildAccentColor(previewShell),
              borderColor: getTone(previewShell.lightness).borderColor,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className="osint-meta-label"
                  style={{ color: getTone(previewShell.lightness).textColor }}
                >
                  Sherlock Shell Preview
                </div>
                <div
                  className="mt-2 text-2xl"
                  style={{
                    color: getTone(previewShell.lightness).textColor,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 'var(--font-weight-display)',
                  }}
                >
                  Theme Workbench
                </div>
              </div>
              <div
                className="rounded border px-3 py-2"
                style={{
                  borderColor: getTone(previewShell.lightness).borderColor,
                  color: getTone(previewShell.lightness).textColor,
                }}
              >
                {activeTheme.controls.chrome}
              </div>
            </div>

            <div
              className="grid min-h-[11rem] gap-4 rounded border p-4"
              style={{
                background: buildAccentColor(previewRail),
                borderColor: getTone(previewRail.lightness).borderColor,
              }}
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div
                  className="rounded border p-4"
                  style={{
                    background: buildAccentColor(previewPanel),
                    borderColor: getTone(previewPanel.lightness).borderColor,
                    color: getTone(previewPanel.lightness).textColor,
                  }}
                >
                  <div className="osint-meta-label">Utility Rail</div>
                  <div className="mt-3 space-y-2">
                    <div
                      className="rounded border px-3 py-2"
                      style={{ borderColor: getTone(previewPanel.lightness).borderColor }}
                    >
                      Runtime
                    </div>
                    <div
                      className="rounded border px-3 py-2"
                      style={{ borderColor: getTone(previewPanel.lightness).borderColor }}
                    >
                      Templates
                    </div>
                  </div>
                </div>

                <div
                  className="rounded border p-4"
                  style={{
                    background: buildAccentColor(previewSurface),
                    borderColor: getTone(previewSurface.lightness).borderColor,
                    color: getTone(previewSurface.lightness).textColor,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="osint-meta-label">Content Surface</div>
                    <div
                      className="rounded border px-2 py-1"
                      style={{ borderColor: getTone(previewSurface.lightness).borderColor }}
                    >
                      {activeTheme.shell.toolbarHeight}px toolbar
                    </div>
                  </div>
                  <div
                    className="mt-4 text-lg"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 'var(--font-weight-display)',
                    }}
                  >
                    Operational Summary
                  </div>
                  <p
                    className="mt-3"
                    style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--font-size-base)' }}
                  >
                    The shell preview responds to the active theme&apos;s surfaces, typography, chrome,
                    radii, and divider tuning.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Active Theme</div>
              <div className="mt-1 osint-title-inline">
                {SHERLOCK_THEME_LIBRARY_TEMPLATES.find((template) => template.id === activeThemeId)
                  ?.label ?? 'Theme'}
              </div>
            </div>
            <div className="inline-flex gap-2">
              {(['dark', 'light'] as SherlockThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEditingMode(mode)}
                  data-active={editingMode === mode ? 'true' : undefined}
                  className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-4 py-2 osint-meta-label`}
                >
                  Edit {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SHERLOCK_THEME_LIBRARY_TEMPLATES.map((template) => {
              const isActive = template.id === activeThemeId;
              const darkPanel = template.theme.surfaces.dark.panel;
              const lightPanel = template.theme.surfaces.light.panel;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => selectTheme(template.id)}
                  data-active={isActive ? 'true' : undefined}
                  className={`${SETTINGS_CARD_INTERACTIVE_CLASS} text-left ${
                    isActive ? SETTINGS_CARD_ACTIVE_CLASS : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="osint-meta-label">{template.label}</div>
                      <div className="mt-1 osint-body-quiet">{template.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-sm border border-zinc-700"
                        style={{ background: buildAccentColor(darkPanel) }}
                      />
                      <div
                        className="h-4 w-4 rounded-sm border border-zinc-700"
                        style={{ background: buildAccentColor(lightPanel) }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Accent</div>
              <div className="mt-1 osint-title-inline">{buildAccentColor(activeTheme.accent)}</div>
            </div>
            <div
              className="h-5 w-5 rounded-sm border border-zinc-700"
              style={{ background: buildAccentColor(activeTheme.accent) }}
            />
          </div>

          <AccentPicker
            hue={activeTheme.accent.hue}
            lightness={activeTheme.accent.lightness}
            chroma={activeTheme.accent.chroma}
            containerClassName="flex flex-col gap-8"
            showPreview={false}
            onChange={(accent) =>
              updateTheme((theme) => ({
                ...theme,
                accent,
              }))
            }
          />
        </section>

        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Background</div>
              <div className="mt-1 osint-title-inline capitalize">
                {activeTheme.background.variant.replace('-', ' ')}
              </div>
            </div>
            <div
              className="h-5 w-5 rounded-sm border border-zinc-700"
              style={{ background: buildAccentColor(selectedBackground) }}
            />
          </div>

          <div className="grid gap-4">
            <div>
              <div className="osint-meta-label mb-2 block">Pattern</div>
              <OsintSelect
                ariaLabel="Theme background pattern"
                value={activeTheme.background.variant}
                onChange={(variant) =>
                  updateTheme((theme) => ({
                    ...theme,
                    background: {
                      ...theme.background,
                      variant: variant as SherlockTheme['background']['variant'],
                    },
                  }))
                }
                triggerClassName={SETTINGS_SELECT_TRIGGER_CLASS}
                options={SHERLOCK_THEME_BACKGROUND_VARIANTS.map((variant) => ({
                  value: variant.id,
                  label: variant.label,
                }))}
              />
            </div>

            {(
              [
                ['hue', 'Background Hue', 0, 360, 1],
                ['lightness', 'Background Lightness', 0, 1, 0.001],
                ['chroma', 'Background Chroma', 0, 0.12, 0.001],
                ['opacity', 'Background Opacity', 0, 1, 0.01],
                ['dotColor', 'Grid Ink', 0, 100, 1],
                ['dotOpacity', 'Pattern Opacity', 0, 1, 0.01],
                ['gridSize', 'Grid Size', 8, 40, 1],
                ['glowOpacity', 'Background Glow', 0, 1, 0.01],
                ['scanlineOpacity', 'Scanline Strength', 0, 1, 0.01],
              ] as const
            ).map(([field, label, min, max, step]) => {
              const value =
                field in selectedBackground
                  ? selectedBackground[field as keyof typeof selectedBackground]
                  : activeTheme.background[field as keyof SherlockTheme['background']];

              return (
                <RangeField
                  key={field}
                  label={label}
                  value={Number(value)}
                  min={min}
                  max={max}
                  step={step}
                  onChange={(nextValue) => updateBackgroundField(field, nextValue)}
                  formatValue={(nextValue) =>
                    field === 'opacity' ||
                    field === 'dotOpacity' ||
                    field === 'glowOpacity' ||
                    field === 'scanlineOpacity'
                      ? `${Math.round(nextValue * 100)}%`
                      : nextValue.toFixed(
                          field === 'hue' || field === 'dotColor' || field === 'gridSize' ? 0 : 3
                        )
                  }
                />
              );
            })}
          </div>
        </section>
      </div>

      <section className={`${SETTINGS_CARD_CLASS} grid gap-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="osint-meta-label">Graph Colors</div>
            <div className="mt-1 osint-title-inline">Graph {activeGraphIndex + 1}</div>
          </div>
          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                graphs: createDefaultSherlockThemeGraphs(theme.accent),
              }))
            }
            className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-4 py-2 osint-meta-label`}
          >
            Derive From Accent
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {activeTheme.graphs.map((graph, index) => (
                <button
                  key={`graph-${index}`}
                  type="button"
                  onClick={() => setActiveGraphIndex(index)}
                  data-active={activeGraphIndex === index ? 'true' : undefined}
                  className={`${SETTINGS_SURFACE_BUTTON_CLASS} flex items-center justify-between px-3 py-3 text-left`}
                >
                  <span className="osint-title-inline">Graph {index + 1}</span>
                  <span
                    className="h-5 w-5 rounded-sm border border-zinc-700"
                    style={{ background: buildAccentColor(graph) }}
                  />
                </button>
              ))}
            </div>

            <div
              className="min-h-[8rem] rounded border p-5"
              style={{
                background: `linear-gradient(135deg, ${buildAccentColor(selectedGraph)} 0%, color-mix(in oklab, ${buildAccentColor(selectedGraph)} 42%, var(--osint-panel)) 100%)`,
                borderColor:
                  'color-mix(in oklab, var(--osint-graph-4, var(--osint-border)) 32%, var(--osint-border))',
              }}
            >
              <div className="osint-meta-label text-white/70">Graph Palette Preview</div>
              <div className="mt-2 text-lg text-white" style={{ fontFamily: 'var(--font-display)' }}>
                Graph {activeGraphIndex + 1}
              </div>
              <div className="mt-3 text-sm text-white/80">
                This palette now drives shared graph-theme tokens and graph-linked UI accents.
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {(
              [
                ['hue', 'Hue', 0, 360, 1],
                ['lightness', 'Lightness', 0.3, 0.8, 0.001],
                ['chroma', 'Chroma', 0, 0.18, 0.001],
                ['opacity', 'Opacity', 0, 1, 0.01],
              ] as const
            ).map(([field, label, min, max, step]) => (
              <RangeField
                key={field}
                label={label}
                value={selectedGraph[field]}
                min={min}
                max={max}
                step={step}
                onChange={(nextValue) => updateGraphField(field, nextValue)}
                formatValue={(nextValue) =>
                  field === 'opacity'
                    ? `${Math.round(nextValue * 100)}%`
                    : nextValue.toFixed(field === 'hue' ? 0 : 3)
                }
              />
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,2.05fr)]">
        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-4`}>
          <div className="osint-meta-label">Shell Surfaces</div>
          <div className="grid gap-2">
            {(Object.keys(STRUCTURE_LABELS) as ThemeStructureKey[]).map((surfaceKey) => {
              const surface = activeTheme.surfaces[editingMode][surfaceKey];

              return (
                <button
                  key={surfaceKey}
                  type="button"
                  onClick={() => setSelectedStructureKey(surfaceKey)}
                  data-active={selectedStructureKey === surfaceKey ? 'true' : undefined}
                  className={`${SETTINGS_SURFACE_BUTTON_CLASS} flex items-center justify-between px-3 py-3 text-left`}
                >
                  <div>
                    <div className="osint-title-inline">{STRUCTURE_LABELS[surfaceKey]}</div>
                    <div className="mt-1 osint-meta-label">
                      h {surface.hue.toFixed(0)} / l {surface.lightness.toFixed(3)} / c{' '}
                      {surface.chroma.toFixed(3)} / o {Math.round(surface.opacity * 100)}%
                    </div>
                  </div>
                  <div
                    className="h-6 w-6 rounded-sm border border-zinc-700"
                    style={{ background: buildAccentColor(surface) }}
                  />
                </button>
              );
            })}
          </div>

          <div className={SETTINGS_CARD_SECTION_SUBTLE_CLASS}>
            <div className="osint-meta-label">Workbench Actions</div>
            <div className="mt-3 grid gap-3">
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    surfaces: {
                      ...theme.surfaces,
                      [editingMode]: Object.fromEntries(
                        Object.entries(theme.surfaces[editingMode]).map(([key, surface]) => [
                          key,
                          { ...surface, hue: theme.accent.hue },
                        ])
                      ) as SherlockThemeSurfaceScale,
                    },
                  }))
                }
                className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2 osint-meta-label`}
              >
                Match Accent Hue
              </button>
              <button
                type="button"
                onClick={forkActiveTheme}
                className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2 osint-meta-label`}
              >
                Fork To Custom Slot
              </button>
              <button
                type="button"
                onClick={saveActiveTheme}
                className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2 osint-meta-label`}
              >
                Save Current Theme
              </button>
            </div>
          </div>
        </section>

        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Selected Surface</div>
              <div className="mt-1 osint-title-inline">{STRUCTURE_LABELS[selectedStructureKey]}</div>
            </div>
            <div className="osint-meta-label capitalize">Editing {editingMode}</div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div
              className="grid min-h-[16rem] gap-4 rounded border p-5"
              style={{
                background: buildAccentColor(activeTheme.surfaces[editingMode].shell),
                borderColor: getTone(activeTheme.surfaces[editingMode].shell.lightness).borderColor,
              }}
            >
              <div
                className="grid min-h-[11rem] gap-4 rounded border p-4"
                style={{
                  background: buildAccentColor(activeTheme.surfaces[editingMode].rail),
                  borderColor: getTone(activeTheme.surfaces[editingMode].rail.lightness).borderColor,
                }}
              >
                <div
                  className="rounded border p-4"
                  style={{
                    background: buildAccentColor(activeTheme.surfaces[editingMode].panel),
                    borderColor:
                      getTone(activeTheme.surfaces[editingMode].panel.lightness).borderColor,
                  }}
                >
                  <div
                    className="rounded border p-4"
                    style={{
                      background: buildAccentColor(activeTheme.surfaces[editingMode].surface),
                      borderColor:
                        getTone(activeTheme.surfaces[editingMode].surface.lightness).borderColor,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {(
                [
                  ['hue', 'Hue', 0, 360, 1],
                  [
                    'lightness',
                    'Lightness',
                    surfaceBounds.lightnessMin,
                    surfaceBounds.lightnessMax,
                    0.001,
                  ],
                  ['chroma', 'Chroma', 0, surfaceBounds.chromaMax, 0.001],
                  ['opacity', 'Opacity', 0, 1, 0.01],
                ] as const
              ).map(([field, label, min, max, step]) => (
                <RangeField
                  key={field}
                  label={label}
                  value={selectedSurface[field]}
                  min={min}
                  max={max}
                  step={step}
                  onChange={(nextValue) => updateSurfaceField(field, nextValue)}
                  formatValue={(nextValue) =>
                    field === 'opacity'
                      ? `${Math.round(nextValue * 100)}%`
                      : nextValue.toFixed(field === 'hue' ? 0 : 3)
                  }
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
