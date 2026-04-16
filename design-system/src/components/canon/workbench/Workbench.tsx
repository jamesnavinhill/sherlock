import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { useEffect, useState } from 'react';

import { buildThemeCssText, buildThemeCssVars } from '../../../system/cssVars';
import {
  BACKGROUND_VARIANTS,
  DEFAULT_THEME,
  SURFACE_PRESETS,
  THEME_TEMPLATES,
  cloneTheme,
  createDefaultGraphs,
  getFontOptionsForRole,
  type FontRole,
  type StudioTheme,
} from '../../../system/schema';
import { Button } from '../controls/Button';
import { CopyButton } from '../controls/CopyButton';
import { IconButton } from '../controls/IconButton';
import { RangeField } from '../controls/RangeField';
import { NavTabs } from '../controls/NavTabs';
import { OptionGroup } from '../controls/OptionGroup';
import { SegmentedTabs } from '../controls/SegmentedTabs';
import { SelectField } from '../controls/SelectField';
import { TokenSwatch } from '../controls/TokenSwatch';
import { AccordionSection } from '../disclosure/AccordionSection';
import { DockPanel } from '../layout/DockPanel';
import { CodeBlock, Eyebrow } from '../typography';

type WorkbenchTab = 'theme' | 'type' | 'shell' | 'export';

const WORKBENCH_TABS: Array<{ id: WorkbenchTab; label: string }> = [
  { id: 'theme', label: 'Theme' },
  { id: 'type', label: 'Type' },
  { id: 'shell', label: 'Shell' },
  { id: 'export', label: 'Export' },
];

const round = (value: number, digits = 3) => Number(value.toFixed(digits));

const buildExportJson = (theme: StudioTheme) => JSON.stringify(theme, null, 2);
const buildColorThemeJson = (theme: StudioTheme) =>
  JSON.stringify(
    {
      mode: theme.mode,
      accent: theme.accent,
      graphs: theme.graphs,
      surfaces: theme.surfaces,
      background: theme.background,
      controls: theme.controls,
    },
    null,
    2
  );
const splitColorReadout = (value: string) => {
  const match = /^([a-z-]+)\((.*)\)$/.exec(value.trim());
  if (!match) {
    return { value, label: '' };
  }

  return {
    value: match[2],
    label: match[1],
  };
};

export interface WorkbenchProps {
  open: boolean;
  placement: 'left' | 'right';
  mobileOpen?: boolean;
  onClose: () => void;
  onMove: (placement: 'left' | 'right') => void;
  theme: StudioTheme;
  setTheme: (updater: (current: StudioTheme) => StudioTheme) => void;
}

export function Workbench({
  open,
  placement,
  mobileOpen = false,
  onClose,
  onMove,
  theme,
  setTheme,
}: WorkbenchProps) {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('theme');
  const [selectedBackgroundMode, setSelectedBackgroundMode] = useState<'dark' | 'light'>(theme.mode);
  const [selectedStructureMode, setSelectedStructureMode] = useState<'dark' | 'light'>(theme.mode);
  const [selectedStructureKey, setSelectedStructureKey] = useState<
    'shell' | 'panel' | 'rail' | 'surface'
  >('panel');
  const [selectedPresetMode, setSelectedPresetMode] = useState<'both' | 'dark' | 'light'>('both');
  const [activeGraphIndex, setActiveGraphIndex] = useState<number>(0);
  const [activeFontRole, setActiveFontRole] = useState<FontRole>('ui');
  const [openTypeSections, setOpenTypeSections] = useState<string[]>([]);
  const [openThemeSections, setOpenThemeSections] = useState<string[]>([]);
  const [openShellSections, setOpenShellSections] = useState<string[]>([]);
  const [openExportSections, setOpenExportSections] = useState<string[]>([]);

  useEffect(() => {
    setSelectedBackgroundMode(theme.mode);
    setSelectedStructureMode(theme.mode);
  }, [theme.mode]);

  const selectedBackground = theme.background[selectedBackgroundMode];
  const selectedStructure = theme.surfaces[selectedStructureMode][selectedStructureKey];
  const exportJson = buildExportJson(theme);
  const colorThemeJson = buildColorThemeJson(theme);
  const exportCss = buildThemeCssText(theme);
  const themeCssVars = buildThemeCssVars(theme);
  const accentReadout = splitColorReadout(themeCssVars['--ds-accent']);
  const backgroundReadout = splitColorReadout(themeCssVars['--ds-background']);
  const shellReadout = splitColorReadout(themeCssVars['--ds-shell']);
  const railReadout = splitColorReadout(themeCssVars['--ds-rail']);
  const panelReadout = splitColorReadout(themeCssVars['--ds-panel']);
  const surfaceReadout = splitColorReadout(themeCssVars['--ds-surface']);
  const themeChoiceOptions = [
    ...THEME_TEMPLATES.map((template) => ({
      id: `theme:${template.id}`,
      label: template.label,
    })),
    ...SURFACE_PRESETS.map((preset) => ({
      id: `surface:${preset.id}`,
      label: preset.label,
    })),
  ];
  const activeThemeChoiceId = (() => {
    const activeThemeTemplate = THEME_TEMPLATES.find(
      (template) =>
        JSON.stringify(theme.surfaces) === JSON.stringify(template.theme.surfaces) &&
        JSON.stringify(theme.background) === JSON.stringify(template.theme.background)
    );

    if (activeThemeTemplate) {
      return `theme:${activeThemeTemplate.id}`;
    }

    const activeSurfacePreset = SURFACE_PRESETS.find((preset) =>
      selectedPresetMode === 'both'
        ? JSON.stringify(theme.surfaces) === JSON.stringify(preset.surfaces)
        : selectedPresetMode === 'dark'
          ? JSON.stringify(theme.surfaces.dark) === JSON.stringify(preset.surfaces.dark)
          : JSON.stringify(theme.surfaces.light) === JSON.stringify(preset.surfaces.light)
    );

    return activeSurfacePreset ? `surface:${activeSurfacePreset.id}` : '';
  })();

  const applySurfacePreset = (presetId: string) => {
    const preset = SURFACE_PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) {
      return;
    }

    setTheme((current) => {
      const nextSurfaces = { ...current.surfaces };
      const nextBackground = { ...current.background };
      if (selectedPresetMode === 'both' || selectedPresetMode === 'dark') {
        nextSurfaces.dark = preset.surfaces.dark;
        nextBackground.dark = { ...preset.surfaces.dark.shell };
      }
      if (selectedPresetMode === 'both' || selectedPresetMode === 'light') {
        nextSurfaces.light = preset.surfaces.light;
        nextBackground.light = { ...preset.surfaces.light.shell };
      }
      return {
        ...current,
        surfaces: nextSurfaces,
        background: nextBackground,
      };
    });
  };

  const handleThemeChoiceChange = (value: string) => {
    if (value.startsWith('theme:')) {
      const template = THEME_TEMPLATES.find((candidate) => `theme:${candidate.id}` === value);
      if (template) {
        setTheme(() => cloneTheme(template.theme));
      }
      return;
    }

    if (value.startsWith('surface:')) {
      applySurfacePreset(value.replace('surface:', ''));
    }
  };

  return (
    <DockPanel
      placement={placement}
      open={open}
      mobileOpen={mobileOpen}
      eyebrow="Workbench Rail"
      title="System Controls"
      closeLabel="Close system controls"
      onClose={onClose}
      headerActions={
        <>
          <IconButton
            appearance="ghost"
            label="Dock workbench left"
            icon={<PanelLeftOpen size={16} />}
            data-active={placement === 'left' ? 'true' : undefined}
            onClick={() => onMove('left')}
          />
          <IconButton
            appearance="ghost"
            label="Dock workbench right"
            icon={<PanelRightOpen size={16} />}
            data-active={placement === 'right' ? 'true' : undefined}
            onClick={() => onMove('right')}
          />
        </>
      }
      topBar={<NavTabs value={activeTab} onChange={setActiveTab} items={WORKBENCH_TABS} stretch />}
      className="ds-workbench-panel"
      bodyClassName="ds-workbench-body"
    >
        {activeTab === 'theme' ? (
          <div className="ds-stack">
            <AccordionSection
              title="Templates"
              isOpen={openThemeSections.includes('templates')}
              onToggle={() =>
                setOpenThemeSections((current) =>
                  current.includes('templates')
                    ? current.filter((s) => s !== 'templates')
                    : [...current, 'templates']
                )
              }
              showActionsWhenOpenOnly
              actions={
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      surfaces: cloneTheme(DEFAULT_THEME).surfaces,
                    }))
                  }
                >
                  Reset
                </Button>
              }
            >
              <div className="ds-stack">
                <div className="ds-field-row">
                  <div className="ds-field-row-header">
                    <Eyebrow>Apply To</Eyebrow>
                  </div>
                  <SegmentedTabs
                    value={selectedPresetMode}
                    onChange={(value) => setSelectedPresetMode(value as 'both' | 'dark' | 'light')}
                    size="compact"
                    items={[
                      { id: 'both', label: 'Both' },
                      { id: 'dark', label: 'Dark Only' },
                      { id: 'light', label: 'Light Only' },
                    ]}
                    stretch
                  />
                </div>
                <OptionGroup
                  columns={3}
                  presentation="choice-grid"
                  value={activeThemeChoiceId}
                  onChange={handleThemeChoiceChange}
                  options={themeChoiceOptions}
                />
              </div>
            </AccordionSection>

            <AccordionSection
              title="Chrome Family"
              isOpen={openThemeSections.includes('chrome')}
              onToggle={() =>
                setOpenThemeSections((current) =>
                  current.includes('chrome')
                    ? current.filter((s) => s !== 'chrome')
                    : [...current, 'chrome']
                )
              }
              showActionsWhenOpenOnly
              actions={
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      controls: { ...DEFAULT_THEME.controls },
                    }))
                  }
                >
                  Reset
                </Button>
              }
            >
              <div className="ds-stack">
                <SegmentedTabs
                  value={theme.controls.chrome}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      controls: {
                        ...current.controls,
                        chrome: value as StudioTheme['controls']['chrome'],
                      },
                    }))
                  }
                  items={[
                    { id: 'glass', label: 'Glass' },
                    { id: 'solid', label: 'Solid' },
                    { id: 'line', label: 'Line' },
                  ]}
                  stretch
                />
              </div>
            </AccordionSection>

            <AccordionSection
              title="Accent"
              isOpen={openThemeSections.includes('accent')}
              onToggle={() =>
                setOpenThemeSections((current) =>
                  current.includes('accent')
                    ? current.filter((s) => s !== 'accent')
                    : [...current, 'accent']
                )
              }
              showActionsWhenOpenOnly
              actions={
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      accent: { ...DEFAULT_THEME.accent },
                    }))
                  }
                >
                  Reset
                </Button>
              }
            >
              <div className="ds-stack">
                <div className="ds-surface-preview">
                  <div
                    className="ds-surface-preview-bg"
                    style={{ background: 'var(--ds-accent)' }}
                  />
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
              </div>
            </AccordionSection>

            <AccordionSection
              title="Graphs"
              isOpen={openThemeSections.includes('graphs')}
              onToggle={() =>
                setOpenThemeSections((current) =>
                  current.includes('graphs')
                    ? current.filter((s) => s !== 'graphs')
                    : [...current, 'graphs']
                )
              }
              showActionsWhenOpenOnly
              actions={
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      graphs: createDefaultGraphs(current.accent),
                    }))
                  }
                >
                  Reset
                </Button>
              }
            >
              <div className="ds-stack">
                <div className="ds-chip-grid ds-action-row">
                  {[0, 1, 2, 3].map((index) => (
                    <Button
                      key={index}
                      variant="secondary"
                      size="compact"
                      textStyle="body"
                      data-active={activeGraphIndex === index ? 'true' : undefined}
                      onClick={() => setActiveGraphIndex(index)}
                    >
                      Graph {index + 1}
                    </Button>
                  ))}
                </div>

                <div className="ds-surface-preview">
                  <div
                    className="ds-surface-preview-bg"
                    style={{ background: `var(--ds-graph-${activeGraphIndex + 1})` }}
                  />
                </div>

                <div className="ds-stack">
                  <RangeField
                    label="Hue"
                    value={theme.graphs?.[activeGraphIndex]?.hue ?? 0}
                    onChange={(value) =>
                      setTheme((current) => {
                        const nextGraphs = [...current.graphs];
                        nextGraphs[activeGraphIndex] = {
                          ...nextGraphs[activeGraphIndex],
                          hue: value,
                        };
                        return { ...current, graphs: nextGraphs };
                      })
                    }
                    min={0}
                    max={360}
                    step={1}
                    format={(value) => `${Math.round(value)}`}
                  />
                  <RangeField
                    label="Lightness"
                    value={theme.graphs?.[activeGraphIndex]?.lightness ?? 0.5}
                    onChange={(value) =>
                      setTheme((current) => {
                        const nextGraphs = [...current.graphs];
                        nextGraphs[activeGraphIndex] = {
                          ...nextGraphs[activeGraphIndex],
                          lightness: value,
                        };
                        return { ...current, graphs: nextGraphs };
                      })
                    }
                    min={0.3}
                    max={0.8}
                    step={0.005}
                    format={(value) => round(value).toString()}
                  />
                  <RangeField
                    label="Chroma"
                    value={theme.graphs?.[activeGraphIndex]?.chroma ?? 0.1}
                    onChange={(value) =>
                      setTheme((current) => {
                        const nextGraphs = [...current.graphs];
                        nextGraphs[activeGraphIndex] = {
                          ...nextGraphs[activeGraphIndex],
                          chroma: value,
                        };
                        return { ...current, graphs: nextGraphs };
                      })
                    }
                    min={0}
                    max={0.18}
                    step={0.002}
                    format={(value) => round(value).toString()}
                  />
                  <RangeField
                    label="Opacity"
                    value={theme.graphs?.[activeGraphIndex]?.opacity ?? 1}
                    onChange={(value) =>
                      setTheme((current) => {
                        const nextGraphs = [...current.graphs];
                        nextGraphs[activeGraphIndex] = {
                          ...nextGraphs[activeGraphIndex],
                          opacity: value,
                        };
                        return { ...current, graphs: nextGraphs };
                      })
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    format={(value) => `${Math.round(value * 100)}%`}
                  />
                </div>
              </div>
            </AccordionSection>

            <AccordionSection
              title="Background"
              isOpen={openThemeSections.includes('background')}
              onToggle={() =>
                setOpenThemeSections((current) =>
                  current.includes('background')
                    ? current.filter((s) => s !== 'background')
                    : [...current, 'background']
                )
              }
              showActionsWhenOpenOnly
              actions={
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      background: { ...DEFAULT_THEME.background },
                    }))
                  }
                >
                  Reset
                </Button>
              }
            >
              <div className="ds-stack">
                <div className="ds-field-row">
                  <div className="ds-field-row-header">
                    <Eyebrow>Tuning Mode</Eyebrow>
                  </div>
                  <SegmentedTabs
                    value={selectedBackgroundMode}
                    onChange={(value) => setSelectedBackgroundMode(value as 'dark' | 'light')}
                    items={[
                      { id: 'dark', label: 'Dark Mode' },
                      { id: 'light', label: 'Light Mode' },
                    ]}
                    stretch
                  />
                </div>
                <div className="ds-stack">
                  <RangeField
                    label="Background Hue"
                    value={selectedBackground.hue}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        background: {
                          ...current.background,
                          [selectedBackgroundMode]: {
                            ...current.background[selectedBackgroundMode],
                            hue: value,
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
                    label="Background Lightness"
                    value={selectedBackground.lightness}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        background: {
                          ...current.background,
                          [selectedBackgroundMode]: {
                            ...current.background[selectedBackgroundMode],
                            lightness: value,
                          },
                        },
                      }))
                    }
                    min={selectedBackgroundMode === 'dark' ? 0 : 0.82}
                    max={selectedBackgroundMode === 'dark' ? 0.35 : 1}
                    step={0.002}
                    format={(value) => round(value).toString()}
                  />
                  <RangeField
                    label="Background Chroma"
                    value={selectedBackground.chroma}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        background: {
                          ...current.background,
                          [selectedBackgroundMode]: {
                            ...current.background[selectedBackgroundMode],
                            chroma: value,
                          },
                        },
                      }))
                    }
                    min={0}
                    max={selectedBackgroundMode === 'dark' ? 0.06 : 0.08}
                    step={0.001}
                    format={(value) => round(value).toString()}
                  />
                  <RangeField
                    label="Background Opacity"
                    value={selectedBackground.opacity}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        background: {
                          ...current.background,
                          [selectedBackgroundMode]: {
                            ...current.background[selectedBackgroundMode],
                            opacity: value,
                          },
                        },
                      }))
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    format={(value) => `${Math.round(value * 100)}%`}
                  />
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
              </div>
            </AccordionSection>

            <AccordionSection
              title="Surfaces"
              isOpen={openThemeSections.includes('surfaces')}
              onToggle={() =>
                setOpenThemeSections((current) =>
                  current.includes('surfaces')
                    ? current.filter((s) => s !== 'surfaces')
                    : [...current, 'surfaces']
                )
              }
              showActionsWhenOpenOnly
              actions={
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      surfaces: cloneTheme(DEFAULT_THEME).surfaces,
                    }))
                  }
                >
                  Reset
                </Button>
              }
            >
              <div className="ds-stack">
                <div className="ds-field-row">
                  <div className="ds-field-row-header">
                    <Eyebrow>Tuning Mode</Eyebrow>
                  </div>
                  <SegmentedTabs
                    value={selectedStructureMode}
                    onChange={(v) => setSelectedStructureMode(v as 'dark' | 'light')}
                    items={[
                      { id: 'dark', label: 'Dark Mode' },
                      { id: 'light', label: 'Light Mode' },
                    ]}
                    stretch
                  />
                </div>
                <div className="ds-chip-grid ds-action-row">
                  {(['shell', 'rail', 'panel', 'surface'] as const).map((key) => (
                    <Button
                      key={key}
                      variant="secondary"
                      size="compact"
                      textStyle="body"
                      data-active={selectedStructureKey === key ? 'true' : undefined}
                      onClick={() => setSelectedStructureKey(key)}
                    >
                      {key === 'shell'
                        ? 'Shell'
                        : key === 'panel'
                          ? 'Panel'
                        : key === 'rail'
                            ? 'Rail'
                            : 'Surface'}
                    </Button>
                  ))}
                </div>
                <div className="ds-stack">
                  <RangeField
                    label="Hue"
                    value={selectedStructure.hue}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        surfaces: {
                          ...current.surfaces,
                          [selectedStructureMode]: {
                            ...current.surfaces[selectedStructureMode],
                            [selectedStructureKey]: {
                              ...current.surfaces[selectedStructureMode][selectedStructureKey],
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
                    value={selectedStructure.lightness}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        surfaces: {
                          ...current.surfaces,
                          [selectedStructureMode]: {
                            ...current.surfaces[selectedStructureMode],
                            [selectedStructureKey]: {
                              ...current.surfaces[selectedStructureMode][selectedStructureKey],
                              lightness: value,
                            },
                          },
                        },
                      }))
                    }
                    min={selectedStructureMode === 'dark' ? 0 : 0.82}
                    max={selectedStructureMode === 'dark' ? 0.35 : 1}
                    step={0.002}
                    format={(value) => round(value).toString()}
                  />
                  <RangeField
                    label="Chroma"
                    value={selectedStructure.chroma}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        surfaces: {
                          ...current.surfaces,
                          [selectedStructureMode]: {
                            ...current.surfaces[selectedStructureMode],
                            [selectedStructureKey]: {
                              ...current.surfaces[selectedStructureMode][selectedStructureKey],
                              chroma: value,
                            },
                          },
                        },
                      }))
                    }
                    min={0}
                    max={selectedStructureMode === 'dark' ? 0.06 : 0.08}
                    step={0.001}
                    format={(value) => round(value).toString()}
                  />
                  <RangeField
                    label="Opacity"
                    value={selectedStructure.opacity}
                    onChange={(value) =>
                      setTheme((current) => ({
                        ...current,
                        surfaces: {
                          ...current.surfaces,
                          [selectedStructureMode]: {
                            ...current.surfaces[selectedStructureMode],
                            [selectedStructureKey]: {
                              ...current.surfaces[selectedStructureMode][selectedStructureKey],
                              opacity: value,
                            },
                          },
                        },
                      }))
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    format={(value) => `${Math.round(value * 100)}%`}
                  />
                </div>
              </div>
            </AccordionSection>
          </div>
        ) : null}

        {activeTab === 'type' ? (
          <div className="ds-stack">
            <AccordionSection
              title="Role Profiles"
              isOpen={openTypeSections.includes('roles')}
              onToggle={() =>
                setOpenTypeSections((current) =>
                  current.includes('roles')
                    ? current.filter((s) => s !== 'roles')
                    : [...current, 'roles']
                )
              }
              showActionsWhenOpenOnly
              actions={
                <Button
                  variant="ghost"
                  onClick={() => {
                    const defaultId = DEFAULT_THEME.typography[activeFontRole];
                    setTheme((current) => ({
                      ...current,
                      typography: {
                        ...current.typography,
                        [activeFontRole]: defaultId,
                        profiles: {
                          ...current.typography.profiles,
                          [activeFontRole]: { ...DEFAULT_THEME.typography.profiles[activeFontRole] },
                        },
                      },
                    }));
                  }}
                >
                  Reset
                </Button>
              }
            >
              <div className="ds-stack">
                <SegmentedTabs
                  value={activeFontRole}
                  onChange={(value) => setActiveFontRole(value as FontRole)}
                  size="compact"
                  items={[
                    { id: 'ui', label: 'Body' },
                    { id: 'display', label: 'Display' },
                    { id: 'label', label: 'Labels' },
                    { id: 'mono', label: 'Data' },
                  ]}
                  stretch
                />

                <SelectField
                  label="Selected Family"
                  value={theme.typography[activeFontRole]}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      typography: { ...current.typography, [activeFontRole]: value },
                    }))
                  }
                  options={getFontOptionsForRole(activeFontRole).map((font) => ({
                    value: font.id,
                    label: font.label,
                  }))}
                />

                <div className="ds-stack">
                  {(() => {
                    const profile = theme.typography.profiles[activeFontRole];
                    if (!profile) return null;

                    return (
                      <>
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
                                  [activeFontRole]: {
                                    ...current.typography.profiles[activeFontRole],
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
                                  [activeFontRole]: {
                                    ...current.typography.profiles[activeFontRole],
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
                                  [activeFontRole]: {
                                    ...current.typography.profiles[activeFontRole],
                                    trackingAdjust: value,
                                  },
                                },
                              },
                            }))
                          }
                          min={-0.1}
                          max={0.2}
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
                                  [activeFontRole]: {
                                    ...current.typography.profiles[activeFontRole],
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
                      </>
                    );
                  })()}
                </div>
              </div>
            </AccordionSection>

            <AccordionSection
              title="Global Scale"
              isOpen={openTypeSections.includes('globals')}
              onToggle={() =>
                setOpenTypeSections((current) =>
                  current.includes('globals')
                    ? current.filter((s) => s !== 'globals')
                    : [...current, 'globals']
                )
              }
              showActionsWhenOpenOnly
              actions={
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      typography: {
                        ...current.typography,
                        size: DEFAULT_THEME.typography.size,
                        weight: DEFAULT_THEME.typography.weight,
                      },
                    }))
                  }
                >
                  Reset
                </Button>
              }
            >
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
            </AccordionSection>
          </div>
        ) : null}

        {activeTab === 'shell' ? (
          <div className="ds-stack">
            <AccordionSection
              title="Geometry"
              isOpen={openShellSections.includes('geometry')}
              onToggle={() =>
                setOpenShellSections((current) =>
                  current.includes('geometry')
                    ? current.filter((s) => s !== 'geometry')
                    : [...current, 'geometry']
                )
              }
              showActionsWhenOpenOnly
              actions={
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      shell: {
                        ...current.shell,
                        sidebarWidth: DEFAULT_THEME.shell.sidebarWidth,
                        railWidth: DEFAULT_THEME.shell.railWidth,
                        utilityWidth: DEFAULT_THEME.shell.utilityWidth,
                        toolbarHeight: DEFAULT_THEME.shell.toolbarHeight,
                        contentWidth: DEFAULT_THEME.shell.contentWidth,
                      },
                    }))
                  }
                >
                  Reset
                </Button>
              }
            >
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
                  label="Utility Width"
                  value={theme.shell.utilityWidth}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      shell: { ...current.shell, utilityWidth: value },
                    }))
                  }
                  min={320}
                  max={520}
                  step={8}
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
            </AccordionSection>

            <AccordionSection
              title="Rendering"
              isOpen={openShellSections.includes('rendering')}
              onToggle={() =>
                setOpenShellSections((current) =>
                  current.includes('rendering')
                    ? current.filter((s) => s !== 'rendering')
                    : [...current, 'rendering']
                )
              }
              showActionsWhenOpenOnly
              actions={
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      shell: { ...current.shell, surfaceOpacity: DEFAULT_THEME.shell.surfaceOpacity },
                    }))
                  }
                >
                  Reset
                </Button>
              }
            >
              <div className="ds-stack">
                <RangeField
                  label="Surface Solidarity"
                  value={theme.shell.surfaceOpacity}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      shell: { ...current.shell, surfaceOpacity: value },
                    }))
                  }
                  min={0}
                  max={1.5}
                  step={0.05}
                  format={(value) => `${Math.round(value * 100)}%`}
                />
              </div>
            </AccordionSection>

            <AccordionSection
              title="Dividers"
              isOpen={openShellSections.includes('dividers')}
              onToggle={() =>
                setOpenShellSections((current) =>
                  current.includes('dividers')
                    ? current.filter((s) => s !== 'dividers')
                    : [...current, 'dividers']
                )
              }
              showActionsWhenOpenOnly
              actions={
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      shell: {
                        ...current.shell,
                        dividerWidth: DEFAULT_THEME.shell.dividerWidth,
                        dividerStrength: DEFAULT_THEME.shell.dividerStrength,
                        dividerTint: DEFAULT_THEME.shell.dividerTint,
                        dividerGlow: DEFAULT_THEME.shell.dividerGlow,
                      },
                    }))
                  }
                >
                  Reset
                </Button>
              }
            >
              <div className="ds-stack">
                <RangeField
                  label="Divider Width"
                  value={theme.shell.dividerWidth}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      shell: { ...current.shell, dividerWidth: value },
                    }))
                  }
                  min={0}
                  max={4}
                  step={1}
                  format={(value) => `${Math.round(value)}px`}
                />
                <RangeField
                  label="Divider Strength"
                  value={theme.shell.dividerStrength}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      shell: { ...current.shell, dividerStrength: value },
                    }))
                  }
                  min={0}
                  max={1}
                  step={0.05}
                  format={(value) => `${Math.round(value * 100)}%`}
                />
                <RangeField
                  label="Accent Tint"
                  value={theme.shell.dividerTint}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      shell: { ...current.shell, dividerTint: value },
                    }))
                  }
                  min={0}
                  max={1}
                  step={0.05}
                  format={(value) => `${Math.round(value * 100)}%`}
                />
                <RangeField
                  label="Edge Glow"
                  value={theme.shell.dividerGlow}
                  onChange={(value) =>
                    setTheme((current) => ({
                      ...current,
                      shell: { ...current.shell, dividerGlow: value },
                    }))
                  }
                  min={0}
                  max={1}
                  step={0.05}
                  format={(value) => `${Math.round(value * 100)}%`}
                />
              </div>
            </AccordionSection>

            <AccordionSection
              title="Radius System"
              isOpen={openShellSections.includes('radius')}
              onToggle={() =>
                setOpenShellSections((current) =>
                  current.includes('radius')
                    ? current.filter((s) => s !== 'radius')
                    : [...current, 'radius']
                )
              }
              showActionsWhenOpenOnly
              actions={
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      radii: { ...DEFAULT_THEME.radii },
                    }))
                  }
                >
                  Reset
                </Button>
              }
            >
              <div className="ds-stack">
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
                  min={0}
                  max={24}
                  step={1}
                  format={(value) => `${Math.round(value)}px`}
                />
              </div>
            </AccordionSection>
          </div>
        ) : null}

        {activeTab === 'export' ? (
          <div className="ds-stack">
            <AccordionSection
              title="Token Snapshot"
              isOpen={openExportSections.includes('tokens')}
              onToggle={() =>
                setOpenExportSections((current) =>
                  current.includes('tokens')
                    ? current.filter((s) => s !== 'tokens')
                    : [...current, 'tokens']
                )
              }
              showActionsWhenOpenOnly
              actions={<CopyButton text={exportJson} variant="ghost" />}
            >
              <CodeBlock maxHeight="18rem">{exportJson}</CodeBlock>
            </AccordionSection>

            <AccordionSection
              title="Resolved Styles"
              isOpen={openExportSections.includes('css')}
              onToggle={() =>
                setOpenExportSections((current) =>
                  current.includes('css') ? current.filter((s) => s !== 'css') : [...current, 'css']
                )
              }
              showActionsWhenOpenOnly
              actions={<CopyButton text={exportCss} variant="ghost" />}
            >
              <CodeBlock maxHeight="18rem">{exportCss}</CodeBlock>
            </AccordionSection>

            <AccordionSection
              title="Palette Swatches"
              isOpen={openExportSections.includes('swatches')}
              onToggle={() =>
                setOpenExportSections((current) =>
                  current.includes('swatches')
                    ? current.filter((s) => s !== 'swatches')
                    : [...current, 'swatches']
                )
              }
              showActionsWhenOpenOnly
              actions={<CopyButton text={colorThemeJson} variant="ghost" />}
            >
              <div className="ds-token-grid">
                <TokenSwatch
                  label="Accent"
                  style={{ background: 'var(--ds-accent)' }}
                  readoutValue={accentReadout.value}
                  readoutLabel={accentReadout.label}
                />
                <TokenSwatch
                  label="Background"
                  style={{ background: 'var(--ds-background)' }}
                  readoutValue={backgroundReadout.value}
                  readoutLabel={backgroundReadout.label}
                />
                <TokenSwatch
                  label="Shell"
                  style={{ background: 'var(--ds-shell)' }}
                  readoutValue={shellReadout.value}
                  readoutLabel={shellReadout.label}
                />
                <TokenSwatch
                  label="Rail"
                  style={{ background: 'var(--ds-rail)' }}
                  readoutValue={railReadout.value}
                  readoutLabel={railReadout.label}
                />
                <TokenSwatch
                  label="Panel"
                  style={{ background: `var(--ds-panel)` }}
                  readoutValue={panelReadout.value}
                  readoutLabel={panelReadout.label}
                />
                <TokenSwatch
                  label="Surface"
                  style={{ background: `var(--ds-surface)` }}
                  readoutValue={surfaceReadout.value}
                  readoutLabel={surfaceReadout.label}
                />
              </div>
            </AccordionSection>
          </div>
        ) : null}
    </DockPanel>
  );
}
