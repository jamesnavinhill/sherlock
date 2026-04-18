import React from 'react';

import { RangeField } from '@/components/system/controls';
import { Accordion } from '@/components/ui/Accordion';
import { OsintSelect } from '@/components/ui/OsintSelect';
import { buildAccentColor } from '@/utils/accent';
import {
  SHERLOCK_THEME_BACKGROUND_VARIANTS,
  type SherlockTheme,
  type SherlockThemeMode,
} from '@/system/theme/schema';
import { SETTINGS_SELECT_TRIGGER_CLASS } from '../settingsUtils';
import { updateThemeBackgroundField, type ThemeBackgroundNumericField } from './backgroundState';
import { SECTION_ACTION_BUTTON_CLASS } from './workbenchPanelShared';

interface ThemeWorkbenchBackgroundSectionProps {
  activeMode: SherlockThemeMode;
  isOpen: boolean;
  onToggle: () => void;
  savedTheme: SherlockTheme;
  updateTheme: (updater: (theme: SherlockTheme) => SherlockTheme) => void;
  activeTheme: SherlockTheme;
}

export const ThemeWorkbenchBackgroundSection: React.FC<ThemeWorkbenchBackgroundSectionProps> = ({
  activeMode,
  activeTheme,
  isOpen,
  onToggle,
  savedTheme,
  updateTheme,
}) => {
  const selectedBackground = activeTheme.background[activeMode];
  const savedBackground = savedTheme.background[activeMode];

  const updateBackgroundField = (field: ThemeBackgroundNumericField, rawValue: number) => {
    updateTheme((theme) =>
      updateThemeBackgroundField({
        theme,
        mode: activeMode,
        field,
        rawValue,
      })
    );
  };

  return (
    <Accordion
      title="Background"
      isOpen={isOpen}
      onToggle={onToggle}
      actions={
        <button
          type="button"
          onClick={() =>
            updateTheme((theme) => ({
              ...theme,
              background: {
                ...theme.background,
                [activeMode]: { ...savedBackground },
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
        <div className="rounded border border-[color:var(--osint-raised-outline)] p-3">
          <div className="osint-meta-label">Background</div>
          <div
            className="mt-3 h-14 rounded border border-[color:var(--osint-raised-outline)]"
            style={{ background: buildAccentColor(selectedBackground) }}
          />
        </div>

        <OsintSelect
          ariaLabel="Theme background pattern"
          value={selectedBackground.variant}
          onChange={(variant) =>
            updateTheme((theme) => ({
              ...theme,
              background: {
                ...theme.background,
                [activeMode]: {
                  ...theme.background[activeMode],
                  variant: variant as SherlockTheme['background'][typeof activeMode]['variant'],
                },
              },
            }))
          }
          triggerClassName={SETTINGS_SELECT_TRIGGER_CLASS}
          portalledMenu
          menuStyle="legacy"
          options={SHERLOCK_THEME_BACKGROUND_VARIANTS.map((variant) => ({
            value: variant.id,
            label: variant.label,
          }))}
        />

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
          const value = selectedBackground[field];

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
    </Accordion>
  );
};
