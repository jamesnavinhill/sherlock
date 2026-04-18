/* eslint-disable react-refresh/only-export-components */

import React from 'react';

export const SECTION_ACTION_BUTTON_CLASS = 'osint-workbench-header-action px-2 py-1 osint-meta-label';
export const SECTION_WRAPPER_CLASS = 'space-y-2';

export const toggleSection = (
  current: string[],
  sectionId: string
) => (current.includes(sectionId) ? current.filter((item) => item !== sectionId) : [...current, sectionId]);

export const copyText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Ignore clipboard failures in the workbench host panel.
  }
};

export const PaletteSwatch: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded border border-[color:var(--osint-border)] bg-[var(--osint-card-section-bg)] p-3">
    <div
      className="h-14 rounded border border-[color:var(--osint-raised-outline)]"
      style={{ background: value }}
    />
    <div className="mt-2 osint-meta-label">{label}</div>
    <div className="mt-1 break-all osint-body-quiet">{value}</div>
  </div>
);

export const CodePreview: React.FC<{ value: string }> = ({ value }) => (
  <pre className="max-h-72 overflow-auto rounded border border-[color:var(--osint-border)] bg-[var(--osint-card-section-bg)] p-3 text-[11px] leading-5 text-[color:var(--osint-text-muted)]">
    <code>{value}</code>
  </pre>
);
