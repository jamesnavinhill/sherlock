import React, { useMemo } from 'react';

import { RangeField } from '@/components/system/controls';
import { Accordion } from '@/components/ui/Accordion';
import { OsintSelect } from '@/components/ui/OsintSelect';
import {
  describeThemeFontSize,
  describeThemeFontWeight,
  resolveThemeFontSizes,
  resolveThemeFontWeights,
  type ThemeFontRole,
} from '@/utils/themeFonts';
import {
  getSherlockThemeFontOptionsForRole,
  type SherlockTheme,
} from '@/system/theme/schema';
import {
  SETTINGS_SELECT_TRIGGER_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
} from '../settingsUtils';
import {
  FONT_ROLE_LABELS,
  THEME_FONT_ROLES,
  type ThemeFontProfileField,
} from './shared';
import {
  SECTION_ACTION_BUTTON_CLASS,
  SECTION_WRAPPER_CLASS,
  toggleSection,
} from './workbenchPanelShared';

const SURFACE_BUTTON_CLASS = `${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2`;

interface ThemeWorkbenchTypeTabProps {
  activeFontRole: ThemeFontRole;
  activeTheme: SherlockTheme;
  openSections: string[];
  savedTheme: SherlockTheme;
  setActiveFontRole: (role: ThemeFontRole) => void;
  setOpenSections: React.Dispatch<React.SetStateAction<string[]>>;
  updateTheme: (updater: (theme: SherlockTheme) => SherlockTheme) => void;
}

export const ThemeWorkbenchTypeTab: React.FC<ThemeWorkbenchTypeTabProps> = ({
  activeFontRole,
  activeTheme,
  openSections,
  savedTheme,
  setActiveFontRole,
  setOpenSections,
  updateTheme,
}) => {
  const selectedFontProfile = activeTheme.typography.profiles[activeFontRole];
  const activeSizeProfile = describeThemeFontSize(activeTheme.typography.size);
  const activeWeightProfile = describeThemeFontWeight(activeTheme.typography.weight);
  const resolvedSizes = resolveThemeFontSizes(activeTheme.typography.size);
  const resolvedWeights = resolveThemeFontWeights(activeTheme.typography.weight);
  const fontRoleOptions = useMemo(
    () =>
      getSherlockThemeFontOptionsForRole(activeFontRole).map((option) => ({
        value: option.id,
        label: option.label,
      })),
    [activeFontRole]
  );

  const onToggle = (sectionId: string) => {
    setOpenSections((current) => toggleSection(current, sectionId));
  };

  const updateFontProfileField = (field: ThemeFontProfileField, rawValue: number) => {
    updateTheme((theme) => ({
      ...theme,
      typography: {
        ...theme.typography,
        profiles: {
          ...theme.typography.profiles,
          [activeFontRole]: {
            ...theme.typography.profiles[activeFontRole],
            [field]:
              field === 'weightAdjust'
                ? Math.round(rawValue)
                : Number(rawValue.toFixed(field === 'trackingAdjust' ? 3 : 2)),
          },
        },
      },
    }));
  };

  return (
    <div className={SECTION_WRAPPER_CLASS}>
      <Accordion
        title="Role Profiles"
        isOpen={openSections.includes('roles')}
        onToggle={() => onToggle('roles')}
        actions={
          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                typography: {
                  ...theme.typography,
                  [activeFontRole]: savedTheme.typography[activeFontRole],
                  profiles: {
                    ...theme.typography.profiles,
                    [activeFontRole]: { ...savedTheme.typography.profiles[activeFontRole] },
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
            {THEME_FONT_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setActiveFontRole(role)}
                data-active={activeFontRole === role ? 'true' : undefined}
                className={`${SURFACE_BUTTON_CLASS} flex items-center text-left`}
              >
                <span className="osint-title-inline">{FONT_ROLE_LABELS[role]}</span>
              </button>
            ))}
          </div>

          <OsintSelect
            ariaLabel={`${FONT_ROLE_LABELS[activeFontRole]} family`}
            value={activeTheme.typography[activeFontRole]}
            onChange={(value) =>
              updateTheme((theme) => ({
                ...theme,
                typography: {
                  ...theme.typography,
                  [activeFontRole]: value,
                },
              }))
            }
            triggerClassName={SETTINGS_SELECT_TRIGGER_CLASS}
            menuStyle="legacy"
            menuClassName="z-[80] max-h-56 overflow-x-hidden overflow-y-auto overscroll-contain custom-scrollbar [scrollbar-gutter:stable]"
            options={fontRoleOptions}
          />

          {(
            [
              ['sizeAdjust', 'Size Adjust', -0.2, 0.2, 0.01],
              ['weightAdjust', 'Weight Adjust', -140, 140, 5],
              ['trackingAdjust', 'Tracking Adjust', -0.1, 0.2, 0.005],
              ['leadingAdjust', 'Leading Adjust', -0.2, 0.2, 0.01],
            ] as const
          ).map(([field, label, min, max, step]) => (
            <RangeField
              key={field}
              label={label}
              value={selectedFontProfile[field]}
              min={min}
              max={max}
              step={step}
              onChange={(nextValue) => updateFontProfileField(field, nextValue)}
              formatValue={(nextValue) =>
                field === 'weightAdjust'
                  ? `${Math.round(nextValue)}`
                  : field === 'trackingAdjust'
                    ? `${nextValue.toFixed(3)}em`
                    : nextValue.toFixed(2)
              }
            />
          ))}
        </div>
      </Accordion>

      <Accordion
        title="Global Scale"
        isOpen={openSections.includes('globals')}
        onToggle={() => onToggle('globals')}
        actions={
          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                typography: {
                  ...theme.typography,
                  size: savedTheme.typography.size,
                  weight: savedTheme.typography.weight,
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
            label="Global Size Scale"
            value={activeTheme.typography.size}
            min={-1}
            max={1}
            step={0.05}
            onChange={(nextValue) =>
              updateTheme((theme) => ({
                ...theme,
                typography: { ...theme.typography, size: nextValue },
              }))
            }
            formatValue={() => activeSizeProfile.label}
          />

          <RangeField
            label="Global Weight Profile"
            value={activeTheme.typography.weight}
            min={-1}
            max={1}
            step={0.05}
            onChange={(nextValue) =>
              updateTheme((theme) => ({
                ...theme,
                typography: { ...theme.typography, weight: nextValue },
              }))
            }
            formatValue={() => activeWeightProfile.label}
          />

          <div className="rounded border border-[color:var(--osint-border)] bg-[var(--osint-card-section-bg)] p-3">
            <div className="osint-meta-label">Typography Preview</div>
            <div
              className="mt-3"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'calc(var(--font-size-2xl) * var(--font-display-scale))',
                fontWeight: 'var(--font-display-weight)',
                letterSpacing: 'var(--font-display-tracking)',
                lineHeight: 'var(--font-display-leading)',
                color: 'var(--osint-text-heading)',
              }}
            >
              Operational Summary
            </div>
            <p
              className="mt-3"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'calc(var(--font-size-base) * var(--font-ui-scale))',
                fontWeight: 'var(--font-ui-weight)',
                letterSpacing: 'var(--font-ui-tracking)',
                lineHeight: 'var(--font-ui-leading)',
                color: 'var(--osint-text-strong)',
              }}
            >
              base={resolvedSizes.base} label={resolvedWeights.label}
            </p>
          </div>
        </div>
      </Accordion>
    </div>
  );
};
