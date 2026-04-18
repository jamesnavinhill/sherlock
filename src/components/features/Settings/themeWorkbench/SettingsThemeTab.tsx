import React, { useState } from 'react';

import { useAppWorkbenchHost } from '@/app/workbench/useAppWorkbenchHost';
import { buildAccentColor } from '@/utils/accent';
import {
  SHERLOCK_THEME_LIBRARY_TEMPLATES,
  type SherlockTheme,
  type SherlockThemeMode,
} from '@/system/theme/schema';
import {
  SETTINGS_CARD_CLASS,
  SETTINGS_SECTION_BODY_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
  SETTINGS_BUTTON_MD_CLASS,
  SETTINGS_CARD_SECTION_CLASS,
  SETTINGS_CARD_SECTION_SUBTLE_CLASS,
} from '../settingsUtils';
import {
  CHROME_ACTION_BUTTON_CLASS,
  CHROME_COMPACT_ACTION_BUTTON_CLASS,
  CHROME_THIN_ACTION_BUTTON_CLASS,
  CHROME_GHOST_ICON_BUTTON_CLASS,
  CHROME_NESTED_ITEM_CLASS,
  CHROME_NESTED_ACTION_ITEM_CLASS,
  CHROME_NESTED_ITEM_BADGE_CLASS,
  CHROME_COMPACT_NESTED_ITEM_CLASS,
  CHROME_COMPACT_NESTED_ACTION_ITEM_CLASS,
  CHROME_THIN_NESTED_ITEM_CLASS,
  CHROME_THIN_NESTED_ACTION_ITEM_CLASS,
  CHROME_CARD_SURFACE_CLASS,
  CHROME_CARD_SECTION_CLASS,
  CHROME_CARD_SECTION_SUBTLE_CLASS,
  CHROME_RAISED_SURFACE_CLASS,
  CHROME_RAISED_SURFACE_SUBTLE_CLASS,
  getChromeToggleButtonClass,
  getChromePanelTabButtonClass,
} from '@/components/ui/chrome';
import { Accordion } from '@/components/ui/Accordion';
import { RangeField } from '@/components/system/controls';
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
  themeMode: SherlockThemeMode;
  themeDirty: boolean;
  updateTheme: (updater: (theme: SherlockTheme) => SherlockTheme) => void;
}

/* ── Section title helper ──────────────────────────────────────────── */
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="osint-eyebrow mb-3">{children}</div>
);

const SURFACE_BUTTON = `${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2`;

/* ── Main component ────────────────────────────────────────────────── */
export const SettingsThemeTab: React.FC<SettingsThemeTabProps> = ({
  activeTheme,
  activeThemeId,
  themeMode,
  themeDirty,
}) => {
  const { openWorkbench } = useAppWorkbenchHost();
  const [demoToggle, setDemoToggle] = useState(false);
  const [demoAccordion, setDemoAccordion] = useState(false);
  const [demoNestedAccordion, setDemoNestedAccordion] = useState(false);
  const [demoRange, setDemoRange] = useState(0.5);
  const [demoTabIndex, setDemoTabIndex] = useState(0);

  const activeThemeLabel =
    SHERLOCK_THEME_LIBRARY_TEMPLATES.find((t) => t.id === activeThemeId)?.label ?? 'Theme';
  const activeAccent = activeTheme.accent[themeMode];
  const surfaces = activeTheme.surfaces[themeMode];
  const graphs = activeTheme.graphs[themeMode];

  return (
    <div className={`${SETTINGS_SECTION_BODY_CLASS} animate-in fade-in slide-in-from-bottom-2 duration-300`}>

      {/* ── Header Card ────────────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} flex flex-wrap items-center justify-between gap-4 p-4`}>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="osint-meta-label">Design System</div>
          <div className="osint-title-section">{activeThemeLabel}</div>
          <div className="osint-body-quiet">
            {themeDirty ? 'Unsaved changes · ' : ''}
            {themeMode === 'dark' ? 'Dark' : 'Light'} mode
          </div>
        </div>
        <button
          type="button"
          onClick={openWorkbench}
          className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-meta-label`}
        >
          Open Workbench
        </button>
      </section>

      {/* ── Color Tokens ───────────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} p-4`}>
        <SectionTitle>Color Tokens</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Accent */}
          <div className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} rounded p-3`}>
            <div
              className="h-12 rounded border border-[color:var(--osint-raised-outline)]"
              style={{ background: buildAccentColor(activeAccent) }}
            />
            <div className="mt-2 osint-meta-label">Accent</div>
            <div className="mt-1 font-mono text-[10px] text-[color:var(--osint-text-quiet)]">
              {buildAccentColor(activeAccent)}
            </div>
          </div>

          {/* Graph Colors */}
          {graphs.map((g, i) => (
            <div key={i} className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} rounded p-3`}>
              <div
                className="h-12 rounded border border-[color:var(--osint-raised-outline)]"
                style={{ background: buildAccentColor(g) }}
              />
              <div className="mt-2 osint-meta-label">Graph {i + 1}</div>
              <div className="mt-1 font-mono text-[10px] text-[color:var(--osint-text-quiet)]">
                {buildAccentColor(g)}
              </div>
            </div>
          ))}

          {/* Semantic tokens rendered from CSS vars */}
          {(['--osint-text-heading', '--osint-text-strong', '--osint-text-muted', '--osint-text-quiet'] as const).map((v) => (
            <div key={v} className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} rounded p-3`}>
              <div
                className="h-12 rounded border border-[color:var(--osint-raised-outline)]"
                style={{ background: `var(${v})` }}
              />
              <div className="mt-2 osint-meta-label">{v.replace('--osint-', '').replaceAll('-', ' ')}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Surface Stack ──────────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} p-4`}>
        <SectionTitle>Surface Stack</SectionTitle>
        <div
          className="grid min-h-[14rem] gap-3 rounded border p-4"
          style={{
            background: buildAccentColor(surfaces.shell),
            borderColor: getTone(surfaces.shell.lightness).borderColor,
          }}
        >
          <div className="osint-meta-label" style={{ color: getTone(surfaces.shell.lightness).textColor }}>
            Shell
          </div>
          <div
            className="grid min-h-[10rem] gap-3 rounded border p-3 lg:grid-cols-[0.4fr_1fr]"
            style={{
              background: buildAccentColor(surfaces.rail),
              borderColor: getTone(surfaces.rail.lightness).borderColor,
            }}
          >
            <div
              className="rounded border p-3"
              style={{
                background: buildAccentColor(surfaces.panel),
                borderColor: getTone(surfaces.panel.lightness).borderColor,
                color: getTone(surfaces.panel.lightness).textColor,
              }}
            >
              <div className="osint-meta-label">Panel</div>
              <div className="mt-2 space-y-1">
                <div
                  className="rounded border px-3 py-1.5"
                  style={{ borderColor: getTone(surfaces.panel.lightness).borderColor }}
                >
                  <span className="osint-title-inline">Nav Item</span>
                </div>
                <div
                  className="rounded border px-3 py-1.5"
                  style={{ borderColor: getTone(surfaces.panel.lightness).borderColor }}
                >
                  <span className="osint-title-inline">Nav Item</span>
                </div>
              </div>
            </div>
            <div
              className="rounded border p-4"
              style={{
                background: buildAccentColor(surfaces.surface),
                borderColor: getTone(surfaces.surface.lightness).borderColor,
                color: getTone(surfaces.surface.lightness).textColor,
              }}
            >
              <div className="osint-meta-label">Surface</div>
              <div
                className="mt-3"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'calc(var(--font-size-xl) * var(--font-display-scale))',
                  fontWeight: 'var(--font-display-weight)',
                  letterSpacing: 'var(--font-display-tracking)',
                }}
              >
                Content Area
              </div>
              <p className="mt-2 opacity-70" style={{ fontSize: 'var(--font-size-sm)' }}>
                Primary content renders on this surface layer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Typography Scale ───────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} p-4`}>
        <SectionTitle>Typography Scale</SectionTitle>
        <div className="space-y-4">
          <div className="osint-title-page">Page Title</div>
          <div className="osint-title-section">Section Title</div>
          <div className="osint-title-card">Card Title</div>
          <div className="osint-title-inline">Inline Title</div>
          <div className="osint-panel-title">Panel Title</div>
          <div className="osint-body-copy">Body copy — primary content text set at the UI scale.</div>
          <div className="osint-body-small">Body small — secondary detail text.</div>
          <div className="osint-body-muted">Body muted — de‑emphasized supporting text.</div>
          <div className="osint-body-quiet">Body quiet — the lowest-contrast text tier.</div>
          <div className="osint-prose">Prose — long-form readable block at comfortable measure and leading.</div>
          <div className="border-t border-[color:var(--osint-raised-outline)] pt-4">
            <div className="flex flex-wrap items-baseline gap-4">
              <span className="osint-eyebrow">Eyebrow</span>
              <span className="osint-meta-label">Meta Label</span>
              <span className="osint-meta-label-strong">Meta Label Strong</span>
              <span className="osint-meta-value">osint-meta-value</span>
            </div>
          </div>
          <div className="border-t border-[color:var(--osint-raised-outline)] pt-4">
            <div className="flex flex-wrap items-baseline gap-4">
              <span className="osint-menu-section-label">Menu Section</span>
              <span className="osint-menu-item-title">Menu Item</span>
              <span className="osint-menu-item-description">Menu item description</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Controls ───────────────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} p-4`}>
        <SectionTitle>Controls</SectionTitle>
        <div className="space-y-5">

          {/* Buttons */}
          <div>
            <div className="osint-meta-label mb-2">Buttons</div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="osint-button-primary inline-flex h-9 items-center gap-2 px-4 osint-meta-label-strong">
                Primary
              </button>
              <button type="button" className="osint-button-chrome inline-flex h-9 items-center gap-2 px-4 osint-meta-label-strong">
                Chrome
              </button>
              <button type="button" className={CHROME_ACTION_BUTTON_CLASS}>
                Action
              </button>
              <button type="button" className={CHROME_COMPACT_ACTION_BUTTON_CLASS}>
                Compact
              </button>
              <button type="button" className={CHROME_THIN_ACTION_BUTTON_CLASS}>
                Thin
              </button>
              <button type="button" className={`${CHROME_GHOST_ICON_BUTTON_CLASS}`}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
          </div>

          {/* Surface Buttons */}
          <div>
            <div className="osint-meta-label mb-2">Surface Buttons</div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={`${SURFACE_BUTTON} osint-meta-label`}>Default</button>
              <button type="button" data-active="true" className={`${SURFACE_BUTTON} osint-meta-label`}>Active</button>
              <button type="button" disabled className={`${SURFACE_BUTTON} osint-meta-label`}>Disabled</button>
              <button type="button" className={`osint-surface-button inline-flex h-9 items-center gap-2 px-4 osint-meta-label-strong`}>
                Surface
              </button>
            </div>
          </div>

          {/* Toggle + Tab Buttons */}
          <div>
            <div className="osint-meta-label mb-2">Toggles & Tabs</div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDemoToggle(!demoToggle)}
                className={`${getChromeToggleButtonClass(demoToggle)} h-9 px-4`}
              >
                Toggle {demoToggle ? 'On' : 'Off'}
              </button>
              {['Alpha', 'Beta', 'Gamma'].map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setDemoTabIndex(i)}
                  className={getChromePanelTabButtonClass(demoTabIndex === i, 'default')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Inline Actions */}
          <div>
            <div className="osint-meta-label mb-2">Inline Actions</div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="osint-link-list-item rounded border border-transparent px-3 py-1.5 cursor-pointer">Link Item</span>
              <span className="osint-inline-text-link cursor-pointer">Text Link</span>
              <span className="osint-inline-reference">Reference</span>
              <span className="osint-danger-inline cursor-pointer">Danger Inline</span>
            </div>
          </div>

          {/* Input */}
          <div>
            <div className="osint-meta-label mb-2">Input</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Text input"
                readOnly
                className="osint-input-field w-full px-3 py-2 osint-meta-value"
              />
              <input
                type="text"
                defaultValue="Filled value"
                readOnly
                className="osint-input-field w-full px-3 py-2 osint-meta-value"
              />
            </div>
          </div>

          {/* Range */}
          <div>
            <div className="osint-meta-label mb-2">Range</div>
            <RangeField
              label="Sample Range"
              value={demoRange}
              min={0}
              max={1}
              step={0.01}
              onChange={setDemoRange}
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
          </div>

          {/* Badges */}
          <div>
            <div className="osint-meta-label mb-2">Badges & Chips</div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={CHROME_NESTED_ITEM_BADGE_CLASS}>badge</span>
              <span className={CHROME_NESTED_ITEM_BADGE_CLASS}>status:active</span>
              <span className="osint-entity-chip rounded px-3 py-1.5 text-xs font-mono">Entity Chip</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Surfaces & Cards ───────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} p-4`}>
        <SectionTitle>Surfaces & Cards</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className={`${CHROME_RAISED_SURFACE_CLASS} rounded p-4`}>
            <div className="osint-meta-label">Raised Surface</div>
            <div className="mt-1 osint-body-quiet">osint-raised-surface</div>
          </div>
          <div className={`${CHROME_RAISED_SURFACE_SUBTLE_CLASS} rounded p-4`}>
            <div className="osint-meta-label">Raised Subtle</div>
            <div className="mt-1 osint-body-quiet">osint-raised-surface-subtle</div>
          </div>
          <div className={`${CHROME_CARD_SURFACE_CLASS} rounded p-4`}>
            <div className="osint-meta-label">Card Surface</div>
            <div className="mt-1 osint-body-quiet">osint-card-surface</div>
          </div>
          <div className={`${CHROME_CARD_SECTION_CLASS} rounded p-4`}>
            <div className="osint-meta-label">Card Section</div>
            <div className="mt-1 osint-body-quiet">osint-card-section</div>
          </div>
          <div className={`${CHROME_CARD_SECTION_SUBTLE_CLASS} rounded p-4`}>
            <div className="osint-meta-label">Card Section Subtle</div>
            <div className="mt-1 osint-body-quiet">osint-card-section-subtle</div>
          </div>
          <div className={`${SETTINGS_CARD_SECTION_CLASS} rounded p-4`}>
            <div className="osint-meta-label">Settings Card Section</div>
            <div className="mt-1 osint-body-quiet">Settings variant</div>
          </div>
        </div>
      </section>

      {/* ── Panel Items ────────────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} p-4`}>
        <SectionTitle>Panel Items</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={`${CHROME_NESTED_ITEM_CLASS} rounded`}>
            <div className="osint-title-inline">Panel Item</div>
            <div className="mt-1 osint-body-quiet">Default density</div>
          </div>
          <div className={`${CHROME_NESTED_ACTION_ITEM_CLASS} rounded cursor-pointer`}>
            <div className="osint-title-inline">Action Item</div>
            <div className="mt-1 osint-body-quiet">Accent-outlined interactive</div>
          </div>
          <div className={`${CHROME_COMPACT_NESTED_ITEM_CLASS} rounded`}>
            <div className="osint-title-inline">Compact Item</div>
          </div>
          <div className={`${CHROME_COMPACT_NESTED_ACTION_ITEM_CLASS} rounded cursor-pointer`}>
            <div className="osint-title-inline">Compact Action</div>
          </div>
          <div className={`${CHROME_THIN_NESTED_ITEM_CLASS} rounded`}>
            <span className="osint-meta-label-strong text-[11px]">Thin Item</span>
          </div>
          <div className={`${CHROME_THIN_NESTED_ACTION_ITEM_CLASS} rounded cursor-pointer`}>
            <span className="osint-meta-label-strong text-[11px]">Thin Action</span>
          </div>
        </div>
      </section>

      {/* ── Accordion ──────────────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} p-4`}>
        <SectionTitle>Accordion</SectionTitle>
        <div className="space-y-2">
          <Accordion
            title="Section Variant"
            isOpen={demoAccordion}
            onToggle={() => setDemoAccordion(!demoAccordion)}
          >
            <div className="osint-body-muted p-2">
              This is a collapsible section accordion. The header follows the rail section trigger pattern with hover and active states driven by the theme system.
            </div>
          </Accordion>
          <Accordion
            title="Nested Variant"
            variant="nested"
            isOpen={demoNestedAccordion}
            onToggle={() => setDemoNestedAccordion(!demoNestedAccordion)}
            actions={
              <button type="button" className="osint-workbench-header-action px-2 py-1 osint-meta-label">
                Reset
              </button>
            }
            showActionsWhenOpenOnly
          >
            <div className="osint-body-muted p-1.5">
              Nested accordion with an action button visible only when open.
            </div>
          </Accordion>
        </div>
      </section>

      {/* ── Geometry & Radii ───────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} p-4`}>
        <SectionTitle>Radius System</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ['Shell', '--osint-shell-radius', activeTheme.radii.shell],
            ['Panel', '--osint-panel-radius', activeTheme.radii.panel],
            ['Control', '--osint-control-radius', activeTheme.radii.control],
            ['Pill', '--osint-pill-radius', activeTheme.radii.pill],
          ] as const).map(([label, cssVar, value]) => (
            <div key={label} className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} rounded p-3`}>
              <div
                className="h-14 border border-[color:var(--osint-raised-outline)] bg-[var(--osint-card-section-bg)]"
                style={{ borderRadius: `var(${cssVar})` }}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="osint-meta-label">{label}</span>
                <span className="osint-meta-value">{value}px</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Shell Metrics ──────────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} p-4`}>
        <SectionTitle>Shell Metrics</SectionTitle>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {([
            ['Sidebar', activeTheme.shell.sidebarWidth],
            ['Rail', activeTheme.shell.railWidth],
            ['Utility Dock', activeTheme.shell.utilityWidth],
            ['Toolbar', activeTheme.shell.toolbarHeight],
            ['Content Measure', activeTheme.shell.contentWidth],
            ['Density', Math.round(activeTheme.shell.density * 100)],
          ] as const).map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-[color:var(--osint-raised-outline)] py-2"
            >
              <span className="osint-meta-label">{label}</span>
              <span className="osint-meta-value">
                {typeof value === 'number' && label === 'Density' ? `${value}%` : `${value}px`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider Tokens ─────────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} p-4`}>
        <SectionTitle>Dividers</SectionTitle>
        <div className="space-y-3">
          <div className="h-px" style={{ background: 'var(--osint-shell-divider-color)' }} />
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ['Tone', buildAccentColor(activeTheme.shell.dividerTone[themeMode])],
              ['Width', `${activeTheme.shell.dividerWidth[themeMode]}px`],
              ['Strength', `${Math.round(activeTheme.shell.dividerStrength[themeMode] * 100)}%`],
              ['Accent Tint', `${Math.round(activeTheme.shell.dividerTint[themeMode] * 100)}%`],
              ['Edge Glow', `${Math.round(activeTheme.shell.dividerGlow[themeMode] * 100)}%`],
            ] as const).map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-[color:var(--osint-raised-outline)] py-2"
              >
                <span className="osint-meta-label">{label}</span>
                <span className="osint-meta-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Font Families ──────────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} p-4`}>
        <SectionTitle>Font Families</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ['UI', '--font-sans', 'The quick brown fox jumps over the lazy dog.'],
            ['Display', '--font-display', 'Operational Intelligence'],
            ['Label', '--font-label', 'CLASSIFICATION · ACTIVE'],
            ['Mono', '--font-mono', 'fn resolve(query) => Result<T>'],
          ] as const).map(([role, cssVar, sample]) => (
            <div key={role} className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} rounded p-3`}>
              <div className="osint-meta-label mb-2">{role}</div>
              <div
                className="text-[color:var(--osint-text-strong)]"
                style={{ fontFamily: `var(${cssVar})`, fontSize: 'var(--font-size-base)' }}
              >
                {sample}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Chrome Family ──────────────────────────────────────── */}
      <section className={`${SETTINGS_CARD_CLASS} p-4`}>
        <SectionTitle>Chrome Family</SectionTitle>
        <div className="flex items-center gap-3">
          <span className={CHROME_NESTED_ITEM_BADGE_CLASS}>{activeTheme.controls.chrome}</span>
          <span className="osint-body-quiet">
            {activeTheme.controls.chrome === 'glass'
              ? 'Translucent controls with surface depth'
              : activeTheme.controls.chrome === 'solid'
                ? 'Denser controls with stronger body fill'
                : 'Minimal chrome with restrained fills'}
          </span>
        </div>
      </section>
    </div>
  );
};
