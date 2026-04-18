import React from 'react';

import { RangeField } from '@/components/system/controls';
import { Accordion } from '@/components/ui/Accordion';
import { buildAccentColor } from '@/utils/accent';
import {
  createDefaultSherlockThemeGraphs,
  SHERLOCK_THEME_CONTROL_CHROME_OPTIONS,
  SHERLOCK_THEME_LIBRARY_TEMPLATES,
  type SherlockTheme,
  type SherlockThemeMode,
  type SherlockThemeSurfaceScale,
} from '@/system/theme/schema';
import { SETTINGS_SURFACE_BUTTON_CLASS } from '../settingsUtils';
import {
  STRUCTURE_LABELS,
  clamp,
  getSurfaceBounds,
  getTone,
  type ThemeGraphField,
  type ThemeStructureKey,
  type ThemeSurfaceField,
} from './shared';
import { ThemeWorkbenchBackgroundSection } from './ThemeWorkbenchBackgroundSection';
import {
  SECTION_ACTION_BUTTON_CLASS,
  SECTION_WRAPPER_CLASS,
  toggleSection,
} from './workbenchPanelShared';

const SURFACE_BUTTON_CLASS = `${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2`;

interface ThemeWorkbenchThemeTabProps {
  activeGraphIndex: number;
  activeMode: SherlockThemeMode;
  activeTheme: SherlockTheme;
  activeThemeId: string;
  forkActiveTheme: () => void;
  openSections: string[];
  resetActiveThemeFactory: () => void;
  resetAllThemeFactories: () => void;
  savedTheme: SherlockTheme;
  selectTheme: (themeId: string) => void;
  selectedStructureKey: ThemeStructureKey;
  setActiveGraphIndex: (index: number) => void;
  setOpenSections: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedStructureKey: (key: ThemeStructureKey) => void;
  updateTheme: (updater: (theme: SherlockTheme) => SherlockTheme) => void;
}

export const ThemeWorkbenchThemeTab: React.FC<ThemeWorkbenchThemeTabProps> = ({
  activeGraphIndex,
  activeMode,
  activeTheme,
  activeThemeId,
  forkActiveTheme,
  openSections,
  resetActiveThemeFactory,
  resetAllThemeFactories,
  savedTheme,
  selectTheme,
  selectedStructureKey,
  setActiveGraphIndex,
  setOpenSections,
  setSelectedStructureKey,
  updateTheme,
}) => {
  const activeAccent = activeTheme.accent[activeMode];
  const savedAccent = savedTheme.accent[activeMode];
  const activeGraphs = activeTheme.graphs[activeMode];
  const savedGraphs = savedTheme.graphs[activeMode];
  const activeSurfaces = activeTheme.surfaces[activeMode];
  const selectedSurface = activeSurfaces[selectedStructureKey];
  const selectedGraph = activeGraphs[activeGraphIndex];
  const surfaceBounds = getSurfaceBounds(activeMode, selectedStructureKey);

  const onToggle = (sectionId: string) => {
    setOpenSections((current) => toggleSection(current, sectionId));
  };

  const updateSurfaceField = (field: ThemeSurfaceField, rawValue: number) => {
    updateTheme((theme) => ({
      ...theme,
      surfaces: {
        ...theme.surfaces,
        [activeMode]: {
          ...theme.surfaces[activeMode],
          [selectedStructureKey]: {
            ...theme.surfaces[activeMode][selectedStructureKey],
            [field]:
              field === 'hue'
                ? ((Math.round(rawValue) % 360) + 360) % 360
                : field === 'lightness'
                  ? clamp(
                      Number(rawValue.toFixed(3)),
                      surfaceBounds.lightnessMin,
                      surfaceBounds.lightnessMax
                    )
                  : field === 'opacity'
                    ? clamp(Number(rawValue.toFixed(3)), 0, 1)
                    : clamp(Number(rawValue.toFixed(3)), 0, surfaceBounds.chromaMax),
          },
        },
      },
    }));
  };

  const updateGraphField = (field: ThemeGraphField, rawValue: number) => {
    updateTheme((theme) => ({
      ...theme,
      graphs: {
        ...theme.graphs,
        [activeMode]: theme.graphs[activeMode].map((graph, index) =>
          index === activeGraphIndex
            ? {
                ...graph,
                [field]:
                  field === 'hue'
                    ? ((Math.round(rawValue) % 360) + 360) % 360
                    : field === 'opacity'
                      ? clamp(Number(rawValue.toFixed(3)), 0, 1)
                      : clamp(Number(rawValue.toFixed(3)), 0, field === 'lightness' ? 1 : 0.18),
              }
            : graph
        ),
      },
    }));
  };

  return (
    <div className={SECTION_WRAPPER_CLASS}>
      <Accordion
        title="Themes"
        isOpen={openSections.includes('themes')}
        onToggle={() => onToggle('themes')}
      >
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-2">
            {SHERLOCK_THEME_LIBRARY_TEMPLATES.map((template) => {
              const tileTone = template.theme.surfaces[activeMode].panel;
              const isActive = activeThemeId === template.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => selectTheme(template.id)}
                  data-active={isActive ? 'true' : undefined}
                  className={`${SURFACE_BUTTON_CLASS} flex min-h-12 items-center justify-center px-3 py-3 text-center`}
                  style={{
                    background: buildAccentColor(tileTone),
                    borderColor: isActive
                      ? 'color-mix(in oklab, var(--osint-primary) 44%, transparent)'
                      : getTone(tileTone.lightness).borderColor,
                    color: getTone(tileTone.lightness).textColor,
                    boxShadow: isActive
                      ? 'inset 0 0 0 1px color-mix(in oklab, var(--osint-primary) 28%, transparent), var(--osint-rail-interaction-shadow)'
                      : undefined,
                  }}
                >
                  <span className="truncate osint-title-inline">{template.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={forkActiveTheme}
              className={`${SURFACE_BUTTON_CLASS} text-center osint-meta-label`}
            >
              Fork To Custom Slot
            </button>
            <button
              type="button"
              onClick={resetActiveThemeFactory}
              className={`${SURFACE_BUTTON_CLASS} text-center osint-meta-label`}
            >
              Factory Reset Active Theme
            </button>
            <button
              type="button"
              onClick={resetAllThemeFactories}
              className={`${SURFACE_BUTTON_CLASS} text-center osint-meta-label`}
            >
              Factory Reset All Themes
            </button>
          </div>
        </div>
      </Accordion>

      <Accordion
        title="Chrome Family"
        isOpen={openSections.includes('chrome')}
        onToggle={() => onToggle('chrome')}
        actions={
          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                controls: { ...savedTheme.controls },
              }))
            }
            className={SECTION_ACTION_BUTTON_CLASS}
          >
            Reset
          </button>
        }
        showActionsWhenOpenOnly
      >
        <div className="grid gap-2">
          {SHERLOCK_THEME_CONTROL_CHROME_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                updateTheme((theme) => ({
                  ...theme,
                  controls: { chrome: option.id },
                }))
              }
              data-active={activeTheme.controls.chrome === option.id ? 'true' : undefined}
              className={`${SURFACE_BUTTON_CLASS} text-left`}
            >
              <div className="osint-title-inline">{option.label}</div>
              <div className="mt-1 osint-body-quiet">{option.description}</div>
            </button>
          ))}
        </div>
      </Accordion>

      <Accordion
        title="Accent"
        isOpen={openSections.includes('accent')}
        onToggle={() => onToggle('accent')}
        actions={
          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                accent: {
                  ...theme.accent,
                  [activeMode]: { ...savedAccent },
                },
              }))
            }
            className={SECTION_ACTION_BUTTON_CLASS}
          >
            Reset
          </button>
        }
        showActionsWhenOpenOnly
      >
        <div className="grid gap-4">
          <div className="rounded border border-[color:var(--osint-raised-outline)] p-4">
            <div className="osint-meta-label">Accent Preview</div>
            <div
              className="mt-3 h-14 rounded border border-[color:var(--osint-raised-outline)]"
              style={{ background: buildAccentColor(activeAccent) }}
            />
            <div className="mt-2 osint-body-quiet">{buildAccentColor(activeAccent)}</div>
          </div>
          <RangeField
            label="Hue"
            value={activeAccent.hue}
            min={0}
            max={360}
            step={1}
            onChange={(nextValue) =>
              updateTheme((theme) => ({
                ...theme,
                accent: {
                  ...theme.accent,
                  [activeMode]: { ...theme.accent[activeMode], hue: Math.round(nextValue) },
                },
              }))
            }
            formatValue={(nextValue) => `${Math.round(nextValue)}`}
          />
          <RangeField
            label="Lightness"
            value={activeAccent.lightness}
            min={0.3}
            max={0.8}
            step={0.005}
            onChange={(nextValue) =>
              updateTheme((theme) => ({
                ...theme,
                accent: {
                  ...theme.accent,
                  [activeMode]: {
                    ...theme.accent[activeMode],
                    lightness: Number(nextValue.toFixed(3)),
                  },
                },
              }))
            }
            formatValue={(nextValue) => nextValue.toFixed(3)}
          />
          <RangeField
            label="Chroma"
            value={activeAccent.chroma}
            min={0}
            max={0.18}
            step={0.002}
            onChange={(nextValue) =>
              updateTheme((theme) => ({
                ...theme,
                accent: {
                  ...theme.accent,
                  [activeMode]: {
                    ...theme.accent[activeMode],
                    chroma: Number(nextValue.toFixed(3)),
                  },
                },
              }))
            }
            formatValue={(nextValue) => nextValue.toFixed(3)}
          />
        </div>
      </Accordion>

      <Accordion
        title="Graphs"
        isOpen={openSections.includes('graphs')}
        onToggle={() => onToggle('graphs')}
        actions={
          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                graphs: {
                  ...theme.graphs,
                  [activeMode]: savedGraphs.map((graph) => ({ ...graph })),
                },
              }))
            }
            className={SECTION_ACTION_BUTTON_CLASS}
          >
            Reset
          </button>
        }
        showActionsWhenOpenOnly
      >
        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {activeGraphs.map((graph, index) => (
              <button
                key={`graph-${index}`}
                type="button"
                onClick={() => setActiveGraphIndex(index)}
                data-active={activeGraphIndex === index ? 'true' : undefined}
                className={`${SURFACE_BUTTON_CLASS} flex items-center justify-between text-left`}
              >
                <span className="osint-title-inline">Graph {index + 1}</span>
                <span
                  className="h-5 w-5 rounded-sm border border-[color:var(--osint-raised-outline)]"
                  style={{ background: buildAccentColor(graph) }}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                graphs: {
                  ...theme.graphs,
                  [activeMode]: createDefaultSherlockThemeGraphs(theme.accent[activeMode]),
                },
              }))
            }
            className={`${SURFACE_BUTTON_CLASS} text-left osint-meta-label`}
          >
            Derive From Accent
          </button>

          <div
            className="rounded border border-[color:var(--osint-raised-outline)] p-4"
            style={{ background: buildAccentColor(selectedGraph) }}
          >
            <div className="osint-meta-label text-white/75">Selected Graph</div>
            <div className="mt-1 text-sm text-white/90">Graph {activeGraphIndex + 1}</div>
          </div>

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
      </Accordion>

      <ThemeWorkbenchBackgroundSection
        activeMode={activeMode}
        activeTheme={activeTheme}
        isOpen={openSections.includes('background')}
        onToggle={() => onToggle('background')}
        savedTheme={savedTheme}
        updateTheme={updateTheme}
      />

      <Accordion
        title="Surfaces"
        isOpen={openSections.includes('surfaces')}
        onToggle={() => onToggle('surfaces')}
        actions={
          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                surfaces: {
                  ...theme.surfaces,
                  [activeMode]: {
                    shell: { ...savedTheme.surfaces[activeMode].shell },
                    panel: { ...savedTheme.surfaces[activeMode].panel },
                    rail: { ...savedTheme.surfaces[activeMode].rail },
                    surface: { ...savedTheme.surfaces[activeMode].surface },
                  },
                },
              }))
            }
            className={SECTION_ACTION_BUTTON_CLASS}
          >
            Reset
          </button>
        }
        showActionsWhenOpenOnly
      >
        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(STRUCTURE_LABELS) as ThemeStructureKey[]).map((surfaceKey) => (
              <button
                key={surfaceKey}
                type="button"
                onClick={() => setSelectedStructureKey(surfaceKey)}
                data-active={selectedStructureKey === surfaceKey ? 'true' : undefined}
                className={`${SURFACE_BUTTON_CLASS} flex items-center justify-between text-left`}
              >
                <span className="osint-title-inline">{STRUCTURE_LABELS[surfaceKey]}</span>
                <span
                  className="h-5 w-5 rounded-sm border border-[color:var(--osint-raised-outline)]"
                  style={{ background: buildAccentColor(activeSurfaces[surfaceKey]) }}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                surfaces: {
                  ...theme.surfaces,
                  [activeMode]: Object.fromEntries(
                    Object.entries(theme.surfaces[activeMode]).map(([key, surface]) => [
                      key,
                      { ...surface, hue: theme.accent[activeMode].hue },
                    ])
                  ) as SherlockThemeSurfaceScale,
                },
              }))
            }
            className={`${SURFACE_BUTTON_CLASS} text-left osint-meta-label`}
          >
            Match Accent Hue
          </button>

          <div
            className="grid min-h-[13rem] gap-3 rounded border p-4"
            style={{
              background: buildAccentColor(activeSurfaces.shell),
              borderColor: getTone(activeSurfaces.shell.lightness).borderColor,
            }}
          >
            <div
              className="grid min-h-[9rem] gap-3 rounded border p-3"
              style={{
                background: buildAccentColor(activeSurfaces.rail),
                borderColor: getTone(activeSurfaces.rail.lightness).borderColor,
              }}
            >
              <div
                className="rounded border p-3"
                style={{
                  background: buildAccentColor(activeSurfaces.panel),
                  borderColor: getTone(activeSurfaces.panel.lightness).borderColor,
                }}
              >
                <div
                  className="rounded border p-5"
                  style={{
                    background: buildAccentColor(activeSurfaces.surface),
                    borderColor: getTone(activeSurfaces.surface.lightness).borderColor,
                  }}
                />
              </div>
            </div>
          </div>

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
      </Accordion>
    </div>
  );
};
