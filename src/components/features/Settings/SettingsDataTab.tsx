import React, { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, RefObject } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  Database,
  FileJson,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react';

import { Accordion } from '@/components/ui/Accordion';

interface SettingsDataTabProps {
  autoResolve: boolean;
  dataSections: {
    preferences: boolean;
    workspaceData: boolean;
  };
  fileInputRef: RefObject<HTMLInputElement | null>;
  onExportData: () => void;
  onImportJSON: (event: ChangeEvent<HTMLInputElement>) => void;
  onRequestClearData: () => void;
  onToggleAutoResolve: () => void;
  onToggleQuietMode: () => void;
  quietMode: boolean;
  toggleDataSection: (section: 'preferences' | 'workspaceData') => void;
}

const SETTINGS_ACTION_BUTTON_CLASS =
  'inline-flex h-14 w-full items-center justify-between gap-4 px-5 text-left osint-meta-label-strong';

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
  dataSections,
  fileInputRef,
  onExportData,
  onImportJSON,
  onRequestClearData,
  onToggleAutoResolve,
  onToggleQuietMode,
  quietMode,
  toggleDataSection,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
      <div className="space-y-4">
        <Accordion
          title="Operational Preferences"
          icon={Shield}
          isOpen={dataSections.preferences}
          onToggle={() => toggleDataSection('preferences')}
          className="bg-zinc-900/40"
          contentClassName="p-4 sm:p-6"
        >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
        </Accordion>

        <Accordion
          title="Workspace Data"
          icon={Database}
          isOpen={dataSections.workspaceData}
          onToggle={() => toggleDataSection('workspaceData')}
          className="bg-zinc-900/40"
          contentClassName="p-4 sm:p-6"
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="flex h-full flex-col border border-zinc-800 bg-zinc-900/40 p-8">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-osint-primary" />
                <h3 className="osint-meta-value">Data Management</h3>
              </div>
              <p className="mt-5 max-w-xl osint-body-small">
                Sherlock keeps workspace data local to this browser. Backups include workspaces,
                artifacts, runs, chats, saved signals, graph data, templates, boards, and library
                items. Theme settings, provider defaults, and API keys stay device-local.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative" ref={exportMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowExportMenu((current) => !current)}
                    className={`${SETTINGS_ACTION_BUTTON_CLASS} osint-button-chrome`}
                    aria-expanded={showExportMenu}
                    aria-haspopup="menu"
                  >
                    <span className="truncate">Export</span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                  </button>
                  {showExportMenu ? (
                    <div className="osint-menu-panel absolute left-0 top-full z-20 mt-1 min-w-full border border-zinc-700 bg-zinc-900">
                      <div className="border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5 osint-menu-section-label">
                        Workspace Backup
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onExportData();
                          setShowExportMenu(false);
                        }}
                        className="osint-menu-item flex w-full items-center px-4 py-2.5 text-left osint-body-small text-zinc-300"
                        title="Export full local workspace backup data as JSON"
                      >
                        <FileJson className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                        <span>Workspace Data as JSON Backup</span>
                      </button>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`${SETTINGS_ACTION_BUTTON_CLASS} osint-button-chrome`}
                >
                  <span className="truncate">Restore Backup</span>
                  <Upload className="h-4 w-4 flex-shrink-0 text-zinc-500" />
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
                <h3 className="osint-meta-value osint-danger-text">Delete Data</h3>
              </div>
              <p className="mt-5 max-w-xl osint-body-small osint-danger-text">
                Permanently delete all local workspace data, including runs, chats, saved signals,
                templates, research boards, workspace library items, and manual graph data. This
                action cannot be reversed.
              </p>

              <div className="mt-8 flex flex-1 items-end">
                <button
                  type="button"
                  onClick={onRequestClearData}
                  className={`${SETTINGS_ACTION_BUTTON_CLASS} osint-button-danger sm:max-w-[18rem]`}
                >
                  <span className="truncate">Delete Data</span>
                  <Trash2 className="h-4 w-4 flex-shrink-0" />
                </button>
              </div>
            </section>
          </div>
        </Accordion>
      </div>
    </div>
  );
};
