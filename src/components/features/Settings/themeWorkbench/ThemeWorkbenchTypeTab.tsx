import React from 'react';

import { RangeField } from '@/components/system/controls';
import { OsintSelect } from '@/components/ui/OsintSelect';
import {
  getThemeFontOption,
  type ThemeFontFamilyProfile,
  type ThemeFontRole,
} from '@/utils/themeFonts';
import type { SherlockTheme, SherlockThemeMode } from '@/system/theme/schema';
import {
  SETTINGS_CARD_CLASS,
  SETTINGS_CARD_SECTION_SUBTLE_CLASS,
  SETTINGS_SECTION_BODY_CLASS,
  SETTINGS_SELECT_TRIGGER_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
} from '../settingsUtils';
import {
  FONT_ROLE_LABELS,
  THEME_FONT_ROLES,
  type ThemeFontProfileField,
} from './shared';

interface ThemeWorkbenchTypeTabProps {
  activeFontRole: ThemeFontRole;
  activeSizeProfile: { label: string };
  activeTheme: SherlockTheme;
  activeWeightProfile: { label: string };
  fontRoleOptions: Array<{ id: string; label: string }>;
  previewMode: SherlockThemeMode;
  resolvedSizes: Record<string, string>;
  resolvedWeights: { label: number };
  selectedFontProfile: ThemeFontFamilyProfile;
  setActiveFontRole: React.Dispatch<React.SetStateAction<ThemeFontRole>>;
  updateFontProfileField: (field: ThemeFontProfileField, rawValue: number) => void;
  updateTheme: (updater: (theme: SherlockTheme) => SherlockTheme) => void;
}

export const ThemeWorkbenchTypeTab: React.FC<ThemeWorkbenchTypeTabProps> = ({
  activeFontRole,
  activeSizeProfile,
  activeTheme,
  activeWeightProfile,
  fontRoleOptions,
  previewMode,
  resolvedSizes,
  resolvedWeights,
  selectedFontProfile,
  setActiveFontRole,
  updateFontProfileField,
  updateTheme,
}) => (
  <div className={SETTINGS_SECTION_BODY_CLASS}>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-4`}>
        <div className="osint-meta-label">Font Roles</div>
        <div className="grid gap-2">
          {THEME_FONT_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setActiveFontRole(role)}
              data-active={activeFontRole === role ? 'true' : undefined}
              className={`${SETTINGS_SURFACE_BUTTON_CLASS} flex items-center justify-between px-3 py-3 text-left`}
            >
              <span className="osint-title-inline">{FONT_ROLE_LABELS[role]}</span>
              <span className="osint-meta-label">
                {getThemeFontOption(activeTheme.typography[role]).label}
              </span>
            </button>
          ))}
        </div>

        <div className={SETTINGS_CARD_SECTION_SUBTLE_CLASS}>
          <div className="osint-meta-label">Global Scale</div>
          <div className="mt-3 grid gap-4">
            <RangeField
              label="Size Profile"
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
              label="Weight Profile"
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
          </div>
        </div>
      </section>

      <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-5`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="osint-meta-label">Active Role</div>
            <div className="mt-1 osint-title-inline">{FONT_ROLE_LABELS[activeFontRole]}</div>
          </div>
          <div className="osint-meta-label">
            {getThemeFontOption(activeTheme.typography[activeFontRole]).label}
          </div>
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
          portalledMenu
          options={fontRoleOptions.map((option) => ({
            value: option.id,
            label: option.label,
          }))}
        />

        <div className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} space-y-4`}>
          <div className="osint-meta-label">Selected Role Tuning</div>
          <div className="grid gap-4">
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
        </div>

        <div className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} space-y-4`}>
          <div className="osint-meta-label">Typography Preview</div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'calc(var(--font-size-3xl) * var(--font-display-scale))',
              fontWeight: 'var(--font-display-weight)',
              letterSpacing: 'var(--font-display-tracking)',
              lineHeight: 'var(--font-display-leading)',
              color: 'var(--osint-text-heading)',
            }}
          >
            Operational Summary
          </div>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'calc(var(--font-size-base) * var(--font-ui-scale))',
              fontWeight: 'var(--font-ui-weight)',
              letterSpacing: 'var(--font-ui-tracking)',
              lineHeight: 'var(--font-ui-leading)',
              color: 'var(--osint-text-strong)',
            }}
          >
            Theme typography now travels through one source of truth, so shell labels, workspace
            copy, and dense evidence text stay aligned.
          </p>
          <div
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: 'calc(var(--font-size-xs) * var(--font-label-scale))',
              fontWeight: 'var(--font-label-weight)',
              letterSpacing: 'var(--font-label-tracking)',
              lineHeight: 'var(--font-label-leading)',
              color: 'var(--osint-text-meta)',
            }}
          >
            THEME WORKSPACE
          </div>
          <pre
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'calc(var(--font-size-sm) * var(--font-mono-scale))',
              fontWeight: 'var(--font-mono-weight)',
              letterSpacing: 'var(--font-mono-tracking)',
              lineHeight: 'var(--font-mono-leading)',
              color: 'var(--osint-text-muted)',
            }}
          >
            <code>{`mode=${previewMode}\nbase=${resolvedSizes.base}\nlabel=${resolvedWeights.label}\nroleScale=${(1 + selectedFontProfile.sizeAdjust).toFixed(2)}`}</code>
          </pre>
        </div>
      </section>
    </div>
  </div>
);
