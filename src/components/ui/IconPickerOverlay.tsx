import React from 'react';

import { AppIcon, APP_ICON_OPTIONS, getAppIconLabel, type AppIconId } from '@/lib/appIcons';
import { ModalShell } from './ModalShell';

interface IconPickerOverlayProps {
  title: string;
  description?: string;
  isOpen: boolean;
  selectedIconId?: AppIconId | null;
  allowDefault?: boolean;
  defaultLabel?: string;
  onClose: () => void;
  onSelect: (iconId: AppIconId | null) => void;
}

export const IconPickerOverlay: React.FC<IconPickerOverlayProps> = ({
  title,
  description,
  isOpen,
  selectedIconId,
  allowDefault = false,
  defaultLabel = 'Use Default',
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <ModalShell
      title={title}
      description={description}
      onClose={onClose}
      widthClassName="max-w-6xl"
    >
      <div className="space-y-4">
        {allowDefault ? (
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className={`flex w-full items-center justify-between border px-4 py-3 text-left transition ${
              !selectedIconId
                ? 'border-osint-primary bg-osint-primary/10 text-white'
                : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-600 hover:text-white'
            }`}
          >
            <span className="osint-meta-label-strong">{defaultLabel}</span>
            <span className="osint-body-quiet">
              {!selectedIconId ? 'Selected' : 'Use built-in icon'}
            </span>
          </button>
        ) : null}

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {APP_ICON_OPTIONS.map((option) => {
            const isSelected = selectedIconId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onSelect(option.id);
                  onClose();
                }}
                className={`group flex min-h-[5.5rem] flex-col items-center justify-center gap-2 border px-2 py-3 text-center transition ${
                  isSelected
                    ? 'border-osint-primary bg-osint-primary/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-white'
                }`}
                title={option.label}
                aria-label={`Select ${option.label} icon`}
              >
                <AppIcon
                  iconId={option.id}
                  className={isSelected ? 'text-osint-primary' : 'text-zinc-300 group-hover:text-white'}
                  size={22}
                  strokeWidth={1.85}
                />
                <span className="line-clamp-2 text-[10px] font-mono uppercase tracking-[0.14em]">
                  {getAppIconLabel(option.id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </ModalShell>
  );
};
