import React from 'react';

import { useAppWorkbenchHost } from '@/app/workbench/useAppWorkbenchHost';
import { buildAccentColor } from '@/utils/accent';
import {
  SHERLOCK_THEME_LIBRARY_TEMPLATES,
  type SherlockTheme,
} from '@/system/theme/schema';
import { SETTINGS_CARD_CLASS, SETTINGS_SECTION_BODY_CLASS, SETTINGS_SURFACE_BUTTON_CLASS } from '../settingsUtils';
import { getTone } from './shared';

export interface SettingsThemeTabProps {
  activeTheme: SherlockTheme;
  activeThemeId: string;
  exportResolvedCss: string;
  exportThemeJson: string;
  forkActiveTheme: () => void;
  resetActiveThemeFactory: () => void;
  resetAllThemeFactories: () => void;
  revertActiveTheme: () => void;
  saveActiveTheme: () => void;
  selectTheme: (themeId: string) => void;
  themeDirty: boolean;
  updateTheme: (updater: (theme: SherlockTheme) => SherlockTheme) => void;
}

export const SettingsThemeTab: React.FC<SettingsThemeTabProps> = ({
  activeTheme,
  activeThemeId,
  themeDirty,
}) => {
  const { openWorkbench } = useAppWorkbenchHost();
  const activeThemeLabel =
    SHERLOCK_THEME_LIBRARY_TEMPLATES.find((template) => template.id === activeThemeId)?.label ??
    'Theme';
  const liveSurfaces = activeTheme.surfaces[activeTheme.mode];
  const previewShell = liveSurfaces.shell;
  const previewRail = liveSurfaces.rail;
  const previewPanel = liveSurfaces.panel;
  const previewSurface = liveSurfaces.surface;

  return (
    <div className={`${SETTINGS_SECTION_BODY_CLASS} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Theme Workbench</div>
              <div className="mt-1 osint-title-inline">{activeThemeLabel}</div>
              <div className="mt-2 osint-body-quiet">
                The docked workbench now owns the canon-style controls, section ordering, and export surface.
              </div>
            </div>
            <button
              type="button"
              onClick={openWorkbench}
              className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-4 py-2 osint-meta-label`}
            >
              Open Workbench
            </button>
          </div>

          <div className="grid gap-3">
            <div className="osint-card-section-subtle rounded p-3">
              <div className="osint-meta-label">Draft Status</div>
              <div className="mt-1 osint-title-inline">
                {themeDirty ? 'Unsaved Changes' : 'Saved'}
              </div>
            </div>
          </div>

          <div className="rounded border border-[color:var(--osint-raised-outline)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="osint-meta-label">Accent</div>
              <div
                className="h-5 w-5 rounded-sm border border-[color:var(--osint-raised-outline)]"
                style={{ background: buildAccentColor(activeTheme.accent) }}
              />
            </div>
            <div className="mt-2 osint-body-quiet">{buildAccentColor(activeTheme.accent)}</div>
          </div>
        </section>

        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-4`}>
          <div className="osint-meta-label">Live Shell Preview</div>

          <div
            className="grid min-h-[20rem] gap-4 rounded border p-5"
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
                  Sherlock Shell
                </div>
                <div
                  className="mt-2 text-2xl"
                  style={{
                    color: getTone(previewShell.lightness).textColor,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 'var(--font-weight-display)',
                  }}
                >
                  Theme Preview
                </div>
              </div>
            </div>

            <div
              className="grid min-h-[12rem] gap-4 rounded border p-4"
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
                  <div className="osint-meta-label">Workbench Rail</div>
                  <div className="mt-3 space-y-2">
                    <div
                      className="rounded border px-3 py-2"
                      style={{ borderColor: getTone(previewPanel.lightness).borderColor }}
                    >
                      Theme
                    </div>
                    <div
                      className="rounded border px-3 py-2"
                      style={{ borderColor: getTone(previewPanel.lightness).borderColor }}
                    >
                      Type
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
                  <div className="osint-meta-label">Content Surface</div>
                  <div
                    className="mt-4 text-lg"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 'var(--font-weight-display)',
                    }}
                  >
                    Operational Summary
                  </div>
                  <p className="mt-3">
                    Settings now keeps the stage for preview while the docked workbench carries the full control language.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
