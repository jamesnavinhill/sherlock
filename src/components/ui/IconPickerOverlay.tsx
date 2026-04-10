import React, { useState } from 'react';
import { Search } from 'lucide-react';

import {
  AppIcon,
  APP_ICON_OPTIONS,
  APP_ICON_PACKS,
  getAppIconLabel,
  getAppIconPack,
  getAppIconPackLabel,
  type AppIconId,
  type AppIconPackId,
} from '@/lib/appIcons';
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

type IconPackFilter = AppIconPackId | 'all';

const getInitialPackFilter = (selectedIconId?: AppIconId | null): IconPackFilter =>
  selectedIconId ? getAppIconPack(selectedIconId) : 'tabler';

const OpenIconPickerOverlay: React.FC<IconPickerOverlayProps> = ({
  title,
  description,
  selectedIconId,
  allowDefault = false,
  defaultLabel = 'Use Default',
  onClose,
  onSelect,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [packFilter, setPackFilter] = useState<IconPackFilter>(() =>
    getInitialPackFilter(selectedIconId)
  );

  const normalizedSearch = searchValue.trim().toLowerCase();
  const visibleOptions = APP_ICON_OPTIONS.filter((option) => {
    if (packFilter !== 'all' && option.pack !== packFilter) return false;
    if (!normalizedSearch) return true;
    return option.searchText.includes(normalizedSearch);
  });

  return (
    <ModalShell
      title={title}
      description={description}
      onClose={onClose}
      widthClassName="max-w-6xl"
      scrollContent
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

        <div className="space-y-3 border border-zinc-800 bg-zinc-950/40 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search icons, packs, or themes"
                aria-label="Search icons"
                className="w-full border border-zinc-800 bg-zinc-950/40 py-2 pl-10 pr-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-osint-primary"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPackFilter('all')}
                className={`border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] transition ${
                  packFilter === 'all'
                    ? 'border-osint-primary bg-osint-primary/10 text-white'
                    : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-600 hover:text-white'
                }`}
              >
                All Packs
              </button>
              {APP_ICON_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => setPackFilter(pack.id)}
                  className={`border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] transition ${
                    packFilter === pack.id
                      ? 'border-osint-primary bg-osint-primary/10 text-white'
                      : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-600 hover:text-white'
                  }`}
                  title={pack.description}
                >
                  {pack.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
            <span>{visibleOptions.length} icons</span>
            <span>{packFilter === 'all' ? 'Mixed catalogue' : getAppIconPackLabel(packFilter)}</span>
          </div>
        </div>

        {visibleOptions.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {visibleOptions.map((option) => {
              const isSelected = selectedIconId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                  className={`group flex min-h-[6.25rem] flex-col items-start justify-between border px-3 py-3 text-left transition ${
                    isSelected
                      ? 'border-osint-primary bg-osint-primary/10 text-white'
                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-white'
                  }`}
                  title={`${option.label} · ${getAppIconPackLabel(option.pack)}`}
                  aria-label={`Select ${option.label} icon from ${getAppIconPackLabel(option.pack)}`}
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <AppIcon
                      iconId={option.id}
                      className={isSelected ? 'text-osint-primary' : 'text-zinc-200 group-hover:text-white'}
                      size={24}
                      strokeWidth={1.85}
                    />
                    <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-zinc-500 group-hover:text-zinc-300">
                      {APP_ICON_PACKS.find((pack) => pack.id === option.pack)?.shortLabel}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="block line-clamp-2 text-[11px] font-semibold leading-tight text-white">
                      {getAppIconLabel(option.id)}
                    </span>
                    <span className="block text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-500 group-hover:text-zinc-300">
                      {option.group}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-8 text-center">
            <p className="text-sm text-zinc-300">No icons match that search.</p>
            <p className="mt-2 text-xs text-zinc-500">
              Try a different pack, or search for terms like &quot;robot&quot;,
              &quot;building&quot;, or &quot;signal&quot;.
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
};

export const IconPickerOverlay: React.FC<IconPickerOverlayProps> = (props) => {
  if (!props.isOpen) return null;

  return <OpenIconPickerOverlay key={`${props.title}-${props.selectedIconId || 'default'}`} {...props} />;
};
