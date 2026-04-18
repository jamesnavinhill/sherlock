import React from 'react';

import {
  SETTINGS_CARD_CLASS,
  SETTINGS_CARD_SECTION_SUBTLE_CLASS,
  SETTINGS_SECTION_BODY_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
} from '../settingsUtils';

interface ThemeWorkbenchExportTabProps {
  copyText: (value: string) => Promise<void>;
  exportResolvedCss: string;
  exportThemeJson: string;
}

export const ThemeWorkbenchExportTab: React.FC<ThemeWorkbenchExportTabProps> = ({
  copyText,
  exportResolvedCss,
  exportThemeJson,
}) => (
  <div className={SETTINGS_SECTION_BODY_CLASS}>
    <div className="grid gap-4 xl:grid-cols-2">
      <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-4`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="osint-meta-label">Theme JSON</div>
            <div className="mt-1 osint-body-quiet">Saved theme object for import/export.</div>
          </div>
          <button
            type="button"
            onClick={() => void copyText(exportThemeJson)}
            className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2 osint-meta-label`}
          >
            Copy JSON
          </button>
        </div>
        <pre
          className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} overflow-x-auto text-xs leading-6 text-zinc-300`}
        >
          <code>{exportThemeJson}</code>
        </pre>
      </section>

      <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-4`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="osint-meta-label">Resolved CSS Vars</div>
            <div className="mt-1 osint-body-quiet">Computed tokens driving the live shell.</div>
          </div>
          <button
            type="button"
            onClick={() => void copyText(exportResolvedCss)}
            className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2 osint-meta-label`}
          >
            Copy CSS
          </button>
        </div>
        <pre
          className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} overflow-x-auto text-xs leading-6 text-zinc-300`}
        >
          <code>{exportResolvedCss}</code>
        </pre>
      </section>
    </div>
  </div>
);
