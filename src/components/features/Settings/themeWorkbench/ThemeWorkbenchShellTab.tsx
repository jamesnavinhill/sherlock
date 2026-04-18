import React from 'react';

import { RangeField } from '@/components/system/controls';
import { Accordion } from '@/components/ui/Accordion';
import type { SherlockTheme, SherlockThemeMode } from '@/system/theme/schema';
import {
  SECTION_ACTION_BUTTON_CLASS,
  SECTION_WRAPPER_CLASS,
  toggleSection,
} from './workbenchPanelShared';

interface ThemeWorkbenchShellTabProps {
  activeMode: SherlockThemeMode;
  activeTheme: SherlockTheme;
  openSections: string[];
  savedTheme: SherlockTheme;
  setOpenSections: React.Dispatch<React.SetStateAction<string[]>>;
  updateTheme: (updater: (theme: SherlockTheme) => SherlockTheme) => void;
}

export const ThemeWorkbenchShellTab: React.FC<ThemeWorkbenchShellTabProps> = ({
  activeMode,
  activeTheme,
  openSections,
  savedTheme,
  setOpenSections,
  updateTheme,
}) => {
  const onToggle = (sectionId: string) => {
    setOpenSections((current) => toggleSection(current, sectionId));
  };

  return (
    <div className={SECTION_WRAPPER_CLASS}>
      <Accordion
        title="Geometry"
        isOpen={openSections.includes('geometry')}
        onToggle={() => onToggle('geometry')}
        actions={
          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                shell: {
                  ...theme.shell,
                  sidebarWidth: savedTheme.shell.sidebarWidth,
                  railWidth: savedTheme.shell.railWidth,
                  utilityWidth: savedTheme.shell.utilityWidth,
                  toolbarHeight: savedTheme.shell.toolbarHeight,
                  contentWidth: savedTheme.shell.contentWidth,
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
        </div>
      </Accordion>

      <Accordion
        title="Rendering"
        isOpen={openSections.includes('rendering')}
        onToggle={() => onToggle('rendering')}
        actions={
          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                shell: {
                  ...theme.shell,
                  surfaceOpacity: savedTheme.shell.surfaceOpacity,
                  density: savedTheme.shell.density,
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
          <RangeField
            label="Surface Solidity"
            value={activeTheme.shell.surfaceOpacity}
            min={0.4}
            max={1.4}
            step={0.05}
            onChange={(nextValue) =>
              updateTheme((theme) => ({
                ...theme,
                shell: { ...theme.shell, surfaceOpacity: nextValue },
              }))
            }
            formatValue={(nextValue) => `${Math.round(nextValue * 100)}%`}
          />

          <RangeField
            label="Density"
            value={activeTheme.shell.density}
            min={0.85}
            max={1.25}
            step={0.05}
            onChange={(nextValue) =>
              updateTheme((theme) => ({
                ...theme,
                shell: { ...theme.shell, density: nextValue },
              }))
            }
            formatValue={(nextValue) => `${Math.round(nextValue * 100)}%`}
          />
        </div>
      </Accordion>

      <Accordion
        title="Dividers"
        isOpen={openSections.includes('dividers')}
        onToggle={() => onToggle('dividers')}
        actions={
          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                shell: {
                  ...theme.shell,
                  dividerWidth: {
                    ...theme.shell.dividerWidth,
                    [activeMode]: savedTheme.shell.dividerWidth[activeMode],
                  },
                  dividerStrength: {
                    ...theme.shell.dividerStrength,
                    [activeMode]: savedTheme.shell.dividerStrength[activeMode],
                  },
                  dividerTint: {
                    ...theme.shell.dividerTint,
                    [activeMode]: savedTheme.shell.dividerTint[activeMode],
                  },
                  dividerGlow: {
                    ...theme.shell.dividerGlow,
                    [activeMode]: savedTheme.shell.dividerGlow[activeMode],
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
          {(
            [
              ['dividerWidth', 'Divider Width', 0, 4, 1, 'px'],
              ['dividerStrength', 'Divider Strength', 0, 1, 0.05, '%'],
              ['dividerTint', 'Accent Tint', 0, 1, 0.05, '%'],
              ['dividerGlow', 'Edge Glow', 0, 1, 0.05, '%'],
            ] as const
          ).map(([field, label, min, max, step, unit]) => (
            <RangeField
              key={field}
              label={label}
              value={activeTheme.shell[field][activeMode]}
              min={min}
              max={max}
              step={step}
              onChange={(nextValue) =>
                updateTheme((theme) => ({
                  ...theme,
                  shell: {
                    ...theme.shell,
                    [field]: {
                      ...theme.shell[field],
                      [activeMode]: nextValue,
                    },
                  },
                }))
              }
              formatValue={(nextValue) =>
                unit === '%' ? `${Math.round(nextValue * 100)}%` : `${Math.round(nextValue)}px`
              }
            />
          ))}
        </div>
      </Accordion>

      <Accordion
        title="Radius System"
        isOpen={openSections.includes('radius')}
        onToggle={() => onToggle('radius')}
        actions={
          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                radii: { ...savedTheme.radii },
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
        </div>
      </Accordion>
    </div>
  );
};
