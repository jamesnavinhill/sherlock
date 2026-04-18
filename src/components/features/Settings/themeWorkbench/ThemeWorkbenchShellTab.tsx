import React from 'react';

import { RangeField } from '@/components/system/controls';
import {
  SHERLOCK_THEME_CONTROL_CHROME_OPTIONS,
  type SherlockTheme,
} from '@/system/theme/schema';
import {
  SETTINGS_CARD_CLASS,
  SETTINGS_SECTION_BODY_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
} from '../settingsUtils';

interface ThemeWorkbenchShellTabProps {
  activeTheme: SherlockTheme;
  resetActiveThemeFactory: () => void;
  resetAllThemeFactories: () => void;
  revertActiveTheme: () => void;
  saveActiveTheme: () => void;
  themeDirty: boolean;
  updateTheme: (updater: (theme: SherlockTheme) => SherlockTheme) => void;
}

export const ThemeWorkbenchShellTab: React.FC<ThemeWorkbenchShellTabProps> = ({
  activeTheme,
  resetActiveThemeFactory,
  resetAllThemeFactories,
  revertActiveTheme,
  saveActiveTheme,
  themeDirty,
  updateTheme,
}) => (
  <div className={SETTINGS_SECTION_BODY_CLASS}>
    <div className="grid gap-4 xl:grid-cols-2">
      <section className={`${SETTINGS_CARD_CLASS} grid gap-5`}>
        <div className="osint-meta-label">Geometry</div>
        {(
          [
            ['sidebarWidth', 'Sidebar Width', 200, 320, 4],
            ['railWidth', 'Rail Width', 260, 420, 4],
            ['utilityWidth', 'Utility Dock Width', 300, 520, 4],
            ['toolbarHeight', 'Toolbar Height', 64, 104, 2],
            ['contentWidth', 'Content Measure', 920, 1360, 20],
          ] as const
        ).map(([field, label, min, max, step]) => (
          <RangeField
            key={field}
            label={label}
            value={activeTheme.shell[field]}
            min={min}
            max={max}
            step={step}
            onChange={(nextValue) =>
              updateTheme((theme) => ({
                ...theme,
                shell: {
                  ...theme.shell,
                  [field]: nextValue,
                },
              }))
            }
            formatValue={(nextValue) => `${Math.round(nextValue)}px`}
          />
        ))}
      </section>

      <section className={`${SETTINGS_CARD_CLASS} grid gap-5`}>
        <div className="osint-meta-label">Rendering And Chrome</div>

        <div>
          <div className="osint-meta-label mb-2 block">Control Chrome</div>
          <div className="grid gap-2 md:grid-cols-3">
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
                className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-3 text-left`}
              >
                <div className="osint-title-inline">{option.label}</div>
                <div className="mt-1 osint-body-quiet">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {(
          [
            ['surfaceOpacity', 'Surface Solidity', 0.4, 1.4, 0.05, '%'],
            ['density', 'Density', 0.85, 1.25, 0.05, '%'],
            ['dividerWidth', 'Divider Width', 0, 4, 1, 'px'],
            ['dividerStrength', 'Divider Strength', 0, 1, 0.05, '%'],
            ['dividerTint', 'Accent Tint', 0, 1, 0.05, '%'],
            ['dividerGlow', 'Divider Glow', 0, 1, 0.05, '%'],
          ] as const
        ).map(([field, label, min, max, step, unit]) => (
          <RangeField
            key={field}
            label={label}
            value={activeTheme.shell[field]}
            min={min}
            max={max}
            step={step}
            onChange={(nextValue) =>
              updateTheme((theme) => ({
                ...theme,
                shell: {
                  ...theme.shell,
                  [field]: nextValue,
                },
              }))
            }
            formatValue={(nextValue) =>
              unit === '%' ? `${Math.round(nextValue * 100)}%` : `${Math.round(nextValue)}${unit}`
            }
          />
        ))}
      </section>
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <section className={`${SETTINGS_CARD_CLASS} grid gap-5`}>
        <div className="osint-meta-label">Radius System</div>
        {(
          [
            ['shell', 'Shell Radius'],
            ['panel', 'Panel Radius'],
            ['control', 'Control Radius'],
            ['pill', 'Pill Radius'],
          ] as const
        ).map(([field, label]) => (
          <RangeField
            key={field}
            label={label}
            value={activeTheme.radii[field]}
            min={0}
            max={28}
            step={1}
            onChange={(nextValue) =>
              updateTheme((theme) => ({
                ...theme,
                radii: {
                  ...theme.radii,
                  [field]: nextValue,
                },
              }))
            }
            formatValue={(nextValue) => `${Math.round(nextValue)}px`}
          />
        ))}
      </section>

      <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-5`}>
        <div className="osint-meta-label">Theme Lifecycle</div>
        <div className="grid gap-3">
          <button
            type="button"
            onClick={saveActiveTheme}
            className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-3 osint-meta-label`}
          >
            Save Active Theme
          </button>
          <button
            type="button"
            onClick={revertActiveTheme}
            disabled={!themeDirty}
            className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-3 osint-meta-label disabled:opacity-50`}
          >
            Revert Unsaved Draft
          </button>
          <button
            type="button"
            onClick={resetActiveThemeFactory}
            className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-3 osint-meta-label`}
          >
            Factory Reset Active Theme
          </button>
          <button
            type="button"
            onClick={resetAllThemeFactories}
            className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-3 osint-meta-label`}
          >
            Factory Reset All Themes
          </button>
        </div>
      </section>
    </div>
  </div>
);
