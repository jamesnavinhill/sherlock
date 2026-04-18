import React, { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, RefObject } from 'react';
import {
  ChevronDown,
  FileJson,
  Trash2,
  Upload,
} from 'lucide-react';

import { Accordion } from '@/components/ui/Accordion';
import {
  CompactMenuHeader,
  CompactMenuPanel,
  COMPACT_MENU_ICON_CLASS,
  COMPACT_MENU_ITEM_CLASS,
} from '@/components/ui/CompactMenu';
import {
  SETTINGS_ACCORDION_CLASS,
  SETTINGS_BUTTON_ROW_CLASS,
  SETTINGS_CARD_CLASS,
  SETTINGS_SECTION_BODY_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
} from './settingsUtils';

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

const PreferenceCard: React.FC<{
  checked: boolean;
  description: string;
  title: string;
  onToggle: () => void;
}> = ({ checked, description, title, onToggle }) => (
  <div className={`${SETTINGS_CARD_CLASS} flex h-full flex-col justify-between`}>
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
          isOpen={dataSections.preferences}
          onToggle={() => toggleDataSection('preferences')}
          className={SETTINGS_ACCORDION_CLASS}
          disableActiveHeaderStyle
        >
          <div className={SETTINGS_SECTION_BODY_CLASS}>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
          </div>
        </Accordion>

        <Accordion
          title="Workspace Data"
          isOpen={dataSections.workspaceData}
          onToggle={() => toggleDataSection('workspaceData')}
          className={SETTINGS_ACCORDION_CLASS}
          disableActiveHeaderStyle
        >
          <div className={SETTINGS_SECTION_BODY_CLASS}>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section className={`${SETTINGS_CARD_CLASS} flex h-full flex-col`}>
                <h3 className="osint-meta-value">Data Management</h3>
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
                      className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_ROW_CLASS} osint-meta-label-strong`}
                      aria-expanded={showExportMenu}
                      aria-haspopup="menu"
                    >
                      <span className="truncate">Export</span>
                      <ChevronDown className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                    </button>
                    {showExportMenu ? (
                      <CompactMenuPanel className="absolute left-0 top-full z-20 mt-1 min-w-full">
                        <CompactMenuHeader>Workspace Backup</CompactMenuHeader>
                        <button
                          type="button"
                          onClick={() => {
                            onExportData();
                            setShowExportMenu(false);
                          }}
                          className={COMPACT_MENU_ITEM_CLASS}
                          title="Export full local workspace backup data as JSON"
                        >
                          <FileJson className={COMPACT_MENU_ICON_CLASS} />
                          <span>Workspace Data as JSON Backup</span>
                        </button>
                      </CompactMenuPanel>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_ROW_CLASS} osint-meta-label-strong`}
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

              <section className={`${SETTINGS_CARD_CLASS} flex h-full flex-col`}>
                <h3 className="osint-meta-value osint-danger-text">Delete Data</h3>
                <p className="mt-5 max-w-xl osint-body-small osint-danger-text">
                  Permanently delete all local workspace data, including runs, chats, saved signals,
                  templates, research boards, workspace library items, and manual graph data. This
                  action cannot be reversed.
                </p>

                <div className="mt-8 flex flex-1 items-end">
                  <button
                    type="button"
                    onClick={onRequestClearData}
                    className={`${SETTINGS_BUTTON_ROW_CLASS} osint-button-danger osint-meta-label-strong sm:max-w-[18rem]`}
                  >
                    <span className="truncate">Delete Data</span>
                    <Trash2 className="h-4 w-4 flex-shrink-0" />
                  </button>
                </div>
              </section>
            </div>
          </div>
        </Accordion>
      </div>
    </div>
  );
};
