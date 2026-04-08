import React from 'react';
import type { ChangeEvent, RefObject } from 'react';
import { AlertTriangle, Database, Download, Shield, Trash2, Upload } from 'lucide-react';

interface SettingsDataTabProps {
  autoResolve: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onExportData: () => void;
  onImportJSON: (event: ChangeEvent<HTMLInputElement>) => void;
  onRequestClearData: () => void;
  onToggleAutoResolve: () => void;
  onToggleQuietMode: () => void;
  quietMode: boolean;
}

const PreferenceCard: React.FC<{
  checked: boolean;
  description: string;
  title: string;
  onToggle: () => void;
}> = ({ checked, description, title, onToggle }) => (
  <div className="border border-zinc-800 bg-zinc-900/40 p-6">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <div className="osint-meta-value">{title}</div>
        <p className="osint-body-small">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        data-state={checked ? 'on' : 'off'}
        className="osint-toggle"
      >
        <span className="osint-toggle-thumb" />
      </button>
    </div>
  </div>
);

export const SettingsDataTab: React.FC<SettingsDataTabProps> = ({
  autoResolve,
  fileInputRef,
  onExportData,
  onImportJSON,
  onRequestClearData,
  onToggleAutoResolve,
  onToggleQuietMode,
  quietMode,
}) => (
  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12 space-y-12">
    <section className="space-y-4">
      <div className="flex items-center space-x-2">
        <Shield className="w-4 h-4 text-osint-primary" />
        <h3 className="osint-eyebrow">Operational Preferences</h3>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PreferenceCard
          title="Auto-Resolve Entities"
          description="Automatically group nearby variations of entity names during analysis and review."
          checked={autoResolve}
          onToggle={onToggleAutoResolve}
        />
        <PreferenceCard
          title="Quiet Mode"
          description="Suppress non-critical system notifications while leaving core warnings and failures visible."
          checked={quietMode}
          onToggle={onToggleQuietMode}
        />
      </div>
    </section>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
      <section className="flex h-full flex-col border border-zinc-800 bg-zinc-900/40 p-8">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-osint-primary" />
          <h3 className="osint-meta-value">Data Management</h3>
        </div>
        <p className="osint-body-small mt-5 max-w-2xl">
          Sherlock stores workspace data locally in your browser. Exports and restores include
          workspaces, artifacts, runs, chat history, saved signals, manual graph data, templates,
          research boards, and workspace library items. Theme preferences, provider defaults, and
          API keys stay local to this device and are not part of workspace backups.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onExportData}
            className="group flex h-14 items-center justify-between gap-4 border border-zinc-800 bg-black/60 px-5 text-left transition-all hover:border-osint-primary/50 hover:bg-zinc-900"
          >
            <div className="min-w-0 osint-meta-label-strong">Export Workspace Data</div>
            <Download className="h-5 w-5 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-osint-primary" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex h-14 items-center justify-between gap-4 border border-zinc-800 bg-black/60 px-5 text-left transition-all hover:border-osint-primary/50 hover:bg-zinc-900"
          >
            <div className="min-w-0 osint-meta-label-strong">Restore Backup</div>
            <Upload className="h-5 w-5 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-osint-primary" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImportJSON}
            accept=".json"
            className="hidden"
          />
        </div>
      </section>

      <section className="osint-danger-panel flex h-full flex-col border p-8">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 osint-danger-text" />
          <h3 className="osint-meta-value osint-danger-text">System Purge</h3>
        </div>
        <p className="mt-5 max-w-2xl osint-body-small osint-danger-text">
          The purge protocol will permanently delete all local workspace data, including runs, chat
          history, saved signals, templates, research boards, workspace library items, and manual
          graph data. This action cannot be reversed.
        </p>

        <div className="mt-8 flex flex-1 items-end">
          <button
            type="button"
            onClick={onRequestClearData}
            className="osint-button-danger inline-flex items-center px-6 py-3 osint-meta-label-strong"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Execute System Purge
          </button>
        </div>
      </section>
    </div>
  </div>
);
