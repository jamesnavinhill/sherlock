import {
  BrushCleaning,
  LayoutPanelTop,
  Palette,
  Pilcrow,
  RefreshCw,
  WandSparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { buildThemeCssText } from '../system/cssVars';
import {
  BACKGROUND_VARIANTS,
  DEFAULT_THEME,
  FONT_OPTIONS,
  FONT_ROLE_LABELS,
  SURFACE_PRESETS,
  cloneTheme,
  getFontOptionsForRole,
  getSelectedFontIds,
  type FontRole,
  type StudioTheme,
} from '../system/schema';
import {
  AccordionSection,
  CopyButton,
  RangeField,
  SegmentedTabs,
  SelectField,
  TokenSwatch,
} from './canon';

type WorkbenchTab = 'theme' | 'type' | 'shell' | 'export';

const WORKBENCH_TABS: Array<{ id: WorkbenchTab; label: string }> = [
  { id: 'theme', label: 'Theme' },
  { id: 'type', label: 'Type' },
  { id: 'shell', label: 'Shell' },
  { id: 'export', label: 'Export' },
];

const round = (value: number, digits = 3) => Number(value.toFixed(digits));

const buildExportJson = (theme: StudioTheme) => JSON.stringify(theme, null, 2);

export interface WorkbenchProps {
  isOpen: boolean;
  onClose: () => void;
  theme: StudioTheme;
  setTheme: (updater: (current: StudioTheme) => StudioTheme) => void;
}

export function Workbench({ isOpen, onClose, theme, setTheme }: WorkbenchProps) {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('theme');
  const [themeSection, setThemeSection] = useState<'accent' | 'surfaces' | 'background'>(
    'surfaces'
  );
  const [selectedSurfaceMode, setSelectedSurfaceMode] = useState<'dark' | 'light'>(theme.mode);
  const [selectedSurfaceKey, setSelectedSurfaceKey] = useState<
    'background' | 'panel' | 'surface'
  >('panel');
  const [openFontProfiles, setOpenFontProfiles] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSurfaceMode(theme.mode);
  }, [theme.mode]);

  useEffect(() => {
    const nextFontIds = getSelectedFontIds(theme);
    setOpenFontProfiles((current) => {
      const merged = Array.from(new Set([...current, ...nextFontIds]));
      return merged.filter((fontId) => nextFontIds.includes(fontId));
    });
  }, [theme]);

  if (!isOpen) {
    return null;
  }

  const selectedSurface = theme.surfaces[selectedSurfaceMode][selectedSurfaceKey];
  const selectedFontIds = getSelectedFontIds(theme);
  const exportJson = buildExportJson(theme);
  const exportCss = buildThemeCssText(theme);

  return (
    <aside className="ds-workbench">
      <div className="ds-workbench-header">
        <div>
          <span className="ds-meta-label">Workbench</span>
          <h2 className="ds-title-section">System Controls</h2>
        </div>
        <div className="ds-toolbar-inline">
          <button
            type="button"
            className="ds-toolbar-button"
            onClick={() => setTheme(() => cloneTheme(DEFAULT_THEME))}
          >
            <RefreshCw size={14} />
            Reset
          </button>
          <button type="button" className="ds-toolbar-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <SegmentedTabs value={activeTab} onChange={setActiveTab} items={WORKBENCH_TABS} stretch />

      <div className="ds-workbench-body">
        {activeTab === 'theme' ? (
          <div className="ds-stack">
            <SegmentedTabs
              value={themeSection}
              onChange={setThemeSection}
              items={[
                { id: 'surfaces', label: 'Surfaces' },
                { id: 'background', label: 'Background' },
                { id: 'accent', label: 'Accent' },
              ]}
              stretch
            />

            {themeSection === 'accent' ? (
              <section className="ds-panel-section">
                <div className="ds-panel-section-header">
                  <span className="ds-meta-label">Accent</span>
                  <div className="ds-inline-swatch" style={{ background: `var(--ds-accent)` }} />
                </div>
                <div className="ds-stack">
                  <RangeField
                    label="Hue"
                    value={theme.accent.hue}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        accent: { ...current.accent, hue: value },
                      }))
                    }
                    min={0}
                    max={360}
                    step={1}
                    format={(value) => `${Math.round(value)}`}
                  />
                  <RangeField
                    label="Lightness"
                    value={theme.accent.lightness}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        accent: { ...current.accent, lightness: value },
                      }))
                    }
                    min={0.3}
                    max={0.8}
                    step={0.005}
                    format={(value) => round(value).toString()}
                  />
                  <RangeField
                    label="Chroma"
                    value={theme.accent.chroma}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        accent: { ...current.accent, chroma: value },
                      }))
                    }
                    min={0}
                    max={0.18}
                    step={0.002}
                    format={(value) => round(value).toString()}
                  />
                </div>
              </section>
            ) : null}

            {themeSection === 'surfaces' ? (
              <section className="ds-panel-section">
                <div className="ds-panel-section-header">
                  <span className="ds-meta-label">Surface Canon</span>
                  <div className="ds-toolbar-inline">
                    <button
                      type="button"
                      className="ds-toolbar-button"
                      onClick={() =>
                        setTheme((current) => ({
                          ...current,
                          surfaces: cloneTheme(DEFAULT_THEME).surfaces,
                        }))
                      }
                    >
                      <BrushCleaning size={14} />
                      Reset
                    </button>
                  </div>
                </div>

                <div className="ds-chip-grid">
                  {SURFACE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="ds-filter-chip"
                      data-active={
                        JSON.stringify(theme.surfaces) === JSON.stringify(preset.surfaces)
                          ? 'true'
                          : undefined
                      }
                      onClick={() =>
                        setTheme((current) => ({
                          ...current,
                          surfaces: cloneTheme({ ...current, surfaces: preset.surfaces }).surfaces,
                        }))
                      }
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="ds-toolbar-inline">
                  <SegmentedTabs
                    value={selectedSurfaceMode}
                    onChange={(value) => setSelectedSurfaceMode(value)}
                    items={[
                      { id: 'dark', label: 'Dark' },
                      { id: 'light', label: 'Light' },
                    ]}
                    stretch
                  />
                </div>

                <div className="ds-chip-grid">
                  {(['background', 'panel', 'surface'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="ds-filter-chip"
                      data-active={selectedSurfaceKey === key ? 'true' : undefined}
                      onClick={() => setSelectedSurfaceKey(key)}
                    >
                      {key === 'background'
                        ? 'Workspace Background'
                        : key === 'panel'
                          ? 'Panel Background'
                          : 'Raised Surface'}
                    </button>
                  ))}
                </div>

                <div className="ds-surface-preview">
                  <div className="ds-surface-preview-bg">
                    <div className="ds-surface-preview-panel">
                      <div className="ds-surface-preview-surface" />
                    </div>
                  </div>
                </div>

                <div className="ds-stack">
                  <RangeField
                    label="Hue"
                    value={selectedSurface.hue}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        surfaces: {
                          ...current.surfaces,
                          [selectedSurfaceMode]: {
                            ...current.surfaces[selectedSurfaceMode],
                            [selectedSurfaceKey]: {
                              ...current.surfaces[selectedSurfaceMode][selectedSurfaceKey],
                              hue: value,
                            },
                          },
                        },
                      }))
                    }
                    min={0}
                    max={360}
                    step={1}
                    format={(value) => `${Math.round(value)}`}
                  />
                  <RangeField
                    label="Lightness"
                    value={selectedSurface.lightness}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        surfaces: {
                          ...current.surfaces,
                          [selectedSurfaceMode]: {
                            ...current.surfaces[selectedSurfaceMode],
                            [selectedSurfaceKey]: {
                              ...current.surfaces[selectedSurfaceMode][selectedSurfaceKey],
                              lightness: value,
                            },
                          },
                        },
                      }))
                    }
                    min={selectedSurfaceMode === 'dark' ? 0 : 0.82}
                    max={selectedSurfaceMode === 'dark' ? 0.35 : 1}
                    step={0.002}
                    format={(value) => round(value).toString()}
                  />
                  <RangeField
                    label="Chroma"
                    value={selectedSurface.chroma}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        surfaces: {
                          ...current.surfaces,
                          [selectedSurfaceMode]: {
                            ...current.surfaces[selectedSurfaceMode],
                            [selectedSurfaceKey]: {
                              ...current.surfaces[selectedSurfaceMode][selectedSurfaceKey],
                              chroma: value,
                            },
                          },
                        },
                      }))
                    }
                    min={0}
                    max={selectedSurfaceMode === 'dark' ? 0.06 : 0.08}
                    step={0.001}
                    format={(value) => round(value).toString()}
                  />
                </div>
              </section>
            ) : null}

            {themeSection === 'background' ? (
              <section className="ds-panel-section">
                <div className="ds-panel-section-header">
                  <span className="ds-meta-label">Background System</span>
                  <button
                    type="button"
                    className="ds-toolbar-button"
                    onClick={() =>
                      setTheme((current) => ({
                        ...current,
                        background: { ...DEFAULT_THEME.background },
                      }))
                    }
                  >
                    <WandSparkles size={14} />
                    Reset
                  </button>
                </div>
                <SelectField
                  label="Variant"
                  value={theme.background.variant}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      background: {
                        ...current.background,
                        variant: value as StudioTheme['background']['variant'],
                      },
                    }))
                  }
                  options={BACKGROUND_VARIANTS.map((variant) => ({
                    value: variant.id,
                    label: variant.label,
                  }))}
                />
                <div className="ds-stack">
                  <RangeField
                    label="Pattern Intensity"
                    value={theme.background.dotOpacity}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        background: { ...current.background, dotOpacity: value },
                      }))
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    format={(value) => `${Math.round(value * 100)}%`}
                  />
                  <RangeField
                    label="Grid Size"
                    value={theme.background.gridSize}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        background: { ...current.background, gridSize: value },
                      }))
                    }
                    min={12}
                    max={40}
                    step={1}
                    format={(value) => `${Math.round(value)}px`}
                  />
                  <RangeField
                    label="Dot Tone"
                    value={theme.background.dotColor}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        background: { ...current.background, dotColor: value },
                      }))
                    }
                    min={0}
                    max={100}
                    step={1}
                    format={(value) => `${Math.round(value)}%`}
                  />
                  <RangeField
                    label="Accent Glow"
                    value={theme.background.glowOpacity}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        background: { ...current.background, glowOpacity: value },
                      }))
                    }
                    min={0}
                    max={0.3}
                    step={0.01}
                    format={(value) => `${Math.round(value * 100)}%`}
                  />
                  <RangeField
                    label="Scanlines"
                    value={theme.background.scanlineOpacity}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        background: { ...current.background, scanlineOpacity: value },
                      }))
                    }
                    min={0}
                    max={0.25}
                    step={0.01}
                    format={(value) => `${Math.round(value * 100)}%`}
                  />
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'type' ? (
          <div className="ds-stack">
            <section className="ds-panel-section">
              <div className="ds-panel-section-header">
                <span className="ds-meta-label">Typography</span>
                <button
                  type="button"
                  className="ds-toolbar-button"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      typography: cloneTheme(DEFAULT_THEME).typography,
                    }))
                  }
                >
                  <Pilcrow size={14} />
                  Reset
                </button>
              </div>
              <div className="ds-grid-two">
                {(['ui', 'display', 'label', 'mono'] as FontRole[]).map((role) => (
                  <SelectField
                    key={role}
                    label={FONT_ROLE_LABELS[role]}
                    value={theme.typography[role]}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        typography: { ...current.typography, [role]: value },
                      }))
                    }
                    options={getFontOptionsForRole(role).map((font) => ({
                      value: font.id,
                      label: font.label,
                    }))}
                  />
                ))}
              </div>

              <div className="ds-stack">
                <RangeField
                  label="Global Size Scale"
                  value={theme.typography.size}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      typography: { ...current.typography, size: value },
                    }))
                  }
                  min={-1}
                  max={1}
                  step={0.05}
                  format={(value) => round(value, 2).toString()}
                />
                <RangeField
                  label="Global Weight Profile"
                  value={theme.typography.weight}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      typography: { ...current.typography, weight: value },
                    }))
                  }
                  min={-1}
                  max={1}
                  step={0.05}
                  format={(value) => round(value, 2).toString()}
                />
              </div>
            </section>

            <section className="ds-panel-section">
              <div className="ds-panel-section-header">
                <span className="ds-meta-label">Selected Families</span>
                <span className="ds-body-quiet">Only active assignments show controls.</span>
              </div>
              <div className="ds-stack">
                {selectedFontIds.map((fontId) => {
                  const font = FONT_OPTIONS.find((option) => option.id === fontId);
                  const profile = theme.typography.profiles[fontId];
                  if (!font || !profile) return null;

                  return (
                    <AccordionSection
                      key={font.id}
                      title={font.label}
                      meta={font.category}
                      isOpen={openFontProfiles.includes(font.id)}
                      onToggle={() =>
                        setOpenFontProfiles((current) =>
                          current.includes(font.id)
                            ? current.filter((item) => item !== font.id)
                            : [...current, font.id]
                        )
                      }
                      className="ds-font-profile-card"
                    >
                      <p className="ds-body-quiet" style={{ fontFamily: font.cssValue }}>
                        {font.preview}
                      </p>
                      <div className="ds-stack">
                        <RangeField
                          label="Size Adjust"
                          value={profile.sizeAdjust}
                          onChange={(value) =>
                            setTheme((current) => ({
                              ...current,
                              typography: {
                                ...current.typography,
                                profiles: {
                                  ...current.typography.profiles,
                                  [fontId]: {
                                    ...current.typography.profiles[fontId],
                                    sizeAdjust: value,
                                  },
                                },
                              },
                            }))
                          }
                          min={-0.2}
                          max={0.2}
                          step={0.01}
                          format={(value) => round(value, 2).toString()}
                        />
                        <RangeField
                          label="Weight Adjust"
                          value={profile.weightAdjust}
                          onChange={(value) =>
                            setTheme((current) => ({
                              ...current,
                              typography: {
                                ...current.typography,
                                profiles: {
                                  ...current.typography.profiles,
                                  [fontId]: {
                                    ...current.typography.profiles[fontId],
                                    weightAdjust: value,
                                  },
                                },
                              },
                            }))
                          }
                          min={-140}
                          max={140}
                          step={5}
                          format={(value) => `${Math.round(value)}`}
                        />
                        <RangeField
                          label="Tracking Adjust"
                          value={profile.trackingAdjust}
                          onChange={(value) =>
                            setTheme((current) => ({
                              ...current,
                              typography: {
                                ...current.typography,
                                profiles: {
                                  ...current.typography.profiles,
                                  [fontId]: {
                                    ...current.typography.profiles[fontId],
                                    trackingAdjust: value,
                                  },
                                },
                              },
                            }))
                          }
                          min={-0.06}
                          max={0.12}
                          step={0.005}
                          format={(value) => `${round(value, 3)}em`}
                        />
                        <RangeField
                          label="Leading Adjust"
                          value={profile.leadingAdjust}
                          onChange={(value) =>
                            setTheme((current) => ({
                              ...current,
                              typography: {
                                ...current.typography,
                                profiles: {
                                  ...current.typography.profiles,
                                  [fontId]: {
                                    ...current.typography.profiles[fontId],
                                    leadingAdjust: value,
                                  },
                                },
                              },
                            }))
                          }
                          min={-0.2}
                          max={0.2}
                          step={0.01}
                          format={(value) => round(value, 2).toString()}
                        />
                      </div>
                    </AccordionSection>
                  );
                })}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === 'shell' ? (
          <div className="ds-stack">
            <section className="ds-panel-section">
              <div className="ds-panel-section-header">
                <span className="ds-meta-label">Shell Geometry</span>
                <button
                  type="button"
                  className="ds-toolbar-button"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      shell: { ...DEFAULT_THEME.shell },
                      radii: { ...DEFAULT_THEME.radii },
                    }))
                  }
                >
                  <LayoutPanelTop size={14} />
                  Reset
                </button>
              </div>

              <div className="ds-stack">
                <RangeField
                  label="Sidebar Width"
                  value={theme.shell.sidebarWidth}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      shell: { ...current.shell, sidebarWidth: value },
                    }))
                  }
                  min={200}
                  max={320}
                  step={4}
                  format={(value) => `${Math.round(value)}px`}
                />
                <RangeField
                  label="Rail Width"
                  value={theme.shell.railWidth}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      shell: { ...current.shell, railWidth: value },
                    }))
                  }
                  min={260}
                  max={420}
                  step={4}
                  format={(value) => `${Math.round(value)}px`}
                />
                <RangeField
                  label="Toolbar Height"
                  value={theme.shell.toolbarHeight}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      shell: { ...current.shell, toolbarHeight: value },
                    }))
                  }
                  min={64}
                  max={96}
                  step={2}
                  format={(value) => `${Math.round(value)}px`}
                />
                <RangeField
                  label="Content Width"
                  value={theme.shell.contentWidth}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      shell: { ...current.shell, contentWidth: value },
                    }))
                  }
                  min={840}
                  max={1320}
                  step={20}
                  format={(value) => `${Math.round(value)}px`}
                />
              </div>
            </section>

            <section className="ds-panel-section">
              <div className="ds-panel-section-header">
                <span className="ds-meta-label">Radius System</span>
                <Palette size={14} />
              </div>
              <div className="ds-stack">
                <RangeField
                  label="Shell Radius"
                  value={theme.radii.shell}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      radii: { ...current.radii, shell: value },
                    }))
                  }
                  min={0}
                  max={24}
                  step={1}
                  format={(value) => `${Math.round(value)}px`}
                />
                <RangeField
                  label="Panel Radius"
                  value={theme.radii.panel}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      radii: { ...current.radii, panel: value },
                    }))
                  }
                  min={0}
                  max={28}
                  step={1}
                  format={(value) => `${Math.round(value)}px`}
                />
                <RangeField
                  label="Control Radius"
                  value={theme.radii.control}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      radii: { ...current.radii, control: value },
                    }))
                  }
                  min={0}
                  max={24}
                  step={1}
                  format={(value) => `${Math.round(value)}px`}
                />
                <RangeField
                  label="Pill Radius"
                  value={theme.radii.pill}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      radii: { ...current.radii, pill: value },
                    }))
                  }
                  min={16}
                  max={999}
                  step={1}
                  format={(value) => `${Math.round(value)}px`}
                />
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === 'export' ? (
          <div className="ds-stack">
            <section className="ds-panel-section">
              <div className="ds-panel-section-header">
                <span className="ds-meta-label">Token Snapshot</span>
                <CopyButton text={exportJson} />
              </div>
              <pre className="ds-code-block">
                <code>{exportJson}</code>
              </pre>
            </section>

            <section className="ds-panel-section">
              <div className="ds-panel-section-header">
                <span className="ds-meta-label">Resolved CSS Vars</span>
                <CopyButton text={exportCss} />
              </div>
              <pre className="ds-code-block">
                <code>{exportCss}</code>
              </pre>
            </section>

            <section className="ds-panel-section">
              <div className="ds-panel-section-header">
                <span className="ds-meta-label">Current Swatches</span>
                <Palette size={14} />
              </div>
              <div className="ds-token-grid">
                <TokenSwatch label="Accent" style={{ background: 'var(--ds-accent)' }} meta="Accent" />
                <TokenSwatch
                  label="Background"
                  style={{ background: `var(--ds-bg)` }}
                  meta={theme.mode}
                />
                <TokenSwatch label="Panel" style={{ background: `var(--ds-panel)` }} meta={theme.mode} />
                <TokenSwatch
                  label="Surface"
                  style={{ background: `var(--ds-surface)` }}
                  meta={theme.mode}
                />
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
