import React from 'react';

import { buildAccentColor } from '@/utils/accent';
import {
  SHERLOCK_THEME_LIBRARY_TEMPLATES,
  type SherlockTheme,
  type SherlockThemeMode,
} from '@/system/theme/schema';

interface SettingsThemeWorkbenchPanelProps {
  activeTheme: SherlockTheme;
  activeThemeId: string;
  exportResolvedCss: string;
  exportThemeJson: string;
  previewMode: SherlockThemeMode;
  revertActiveTheme: () => void;
  saveActiveTheme: () => void;
  themeDirty: boolean;
}

const copyText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Ignore clipboard failures in the workbench host panel.
  }
};

export const SettingsThemeWorkbenchPanel: React.FC<SettingsThemeWorkbenchPanelProps> = ({
  activeTheme,
  activeThemeId,
  exportResolvedCss,
  exportThemeJson,
  previewMode,
  revertActiveTheme,
  saveActiveTheme,
  themeDirty,
}) => (
  <>
    <section className="osint-card-section rounded p-4">
      <div className="osint-meta-label">Preview Mode</div>
      <div className="mt-2 capitalize osint-title-inline">{previewMode}</div>
      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-4 w-4 rounded-sm border border-zinc-700"
          style={{ background: buildAccentColor(activeTheme.accent) }}
        />
        <div className="min-w-0">
          <div className="osint-meta-label">Draft Accent</div>
          <div className="truncate osint-body-small">{buildAccentColor(activeTheme.accent)}</div>
        </div>
      </div>
    </section>

    <section className="osint-card-section rounded p-4">
      <div className="osint-meta-label">Active Template</div>
      <div className="mt-2 osint-title-inline">
        {SHERLOCK_THEME_LIBRARY_TEMPLATES.find((template) => template.id === activeThemeId)?.label ??
          'Theme'}
      </div>
      <div className="mt-3 grid gap-2">
        <div className="osint-card-section-subtle rounded px-3 py-2">
          <div className="osint-meta-label">Draft Status</div>
          <div className="mt-1 osint-body-quiet">
            {themeDirty
              ? 'Unsaved changes are active in this draft.'
              : 'Draft matches the saved theme.'}
          </div>
        </div>
        <button
          type="button"
          onClick={saveActiveTheme}
          className="osint-settings-surface-button px-3 py-2 text-left osint-meta-label"
        >
          Save Active Theme
        </button>
        <button
          type="button"
          onClick={revertActiveTheme}
          className="osint-settings-surface-button px-3 py-2 text-left osint-meta-label"
        >
          Revert Draft
        </button>
      </div>
    </section>

    <section className="osint-card-section rounded p-4">
      <div className="osint-meta-label">Export</div>
      <div className="mt-2 osint-title-inline">Theme Snapshot</div>
      <div className="mt-3 grid gap-2">
        <button
          type="button"
          onClick={() => void copyText(exportThemeJson)}
          className="osint-settings-surface-button px-3 py-2 text-left osint-meta-label"
        >
          Copy Theme JSON
        </button>
        <button
          type="button"
          onClick={() => void copyText(exportResolvedCss)}
          className="osint-settings-surface-button px-3 py-2 text-left osint-meta-label"
        >
          Copy Resolved CSS
        </button>
      </div>
    </section>
  </>
);
