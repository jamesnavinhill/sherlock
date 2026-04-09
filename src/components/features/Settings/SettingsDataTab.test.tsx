import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SettingsDataTab } from './SettingsDataTab';

describe('SettingsDataTab', () => {
  it('shows the export menu and updated delete-data labels', () => {
    render(
      <SettingsDataTab
        autoResolve={false}
        dataSections={{
          preferences: false,
          workspaceData: true,
        }}
        quietMode={false}
        fileInputRef={createRef<HTMLInputElement>()}
        onExportData={vi.fn()}
        onImportJSON={vi.fn()}
        onRequestClearData={vi.fn()}
        onToggleAutoResolve={vi.fn()}
        onToggleQuietMode={vi.fn()}
        toggleDataSection={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /^Export$/i }));

    expect(screen.getByText('Workspace Backup')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Workspace Data as JSON Backup/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delete Data' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Delete Data$/i })).toBeInTheDocument();
  });
});
