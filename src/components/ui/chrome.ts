export const CHROME_HEADER_CLASS =
  'sticky top-0 z-30 h-20 border-b border-zinc-800 bg-black/95 backdrop-blur-md osint-header-shadow';

export const CHROME_HEADER_ROW_CLASS = 'flex h-full min-w-0 items-center justify-between gap-3';

export const CHROME_PANEL_CLASS = 'border-zinc-800 bg-black/95 backdrop-blur-md';

export const CHROME_PANEL_HEADER_CLASS =
  'border-b border-zinc-800 bg-zinc-900/30 px-4 py-3';

export const CHROME_HEADER_LEADING_GROUP_CLASS = 'flex min-w-0 flex-1 items-center gap-3';

export const CHROME_HEADER_ICON_BUTTON_SIZE_CLASS = 'shrink-0 p-1.5';

export const CHROME_HEADER_PRIMARY_ACTION_CLASS =
  'osint-button-primary osint-meta-label-strong inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-1.5';

export const CHROME_TOOLBAR_FIELD_CLASS =
  'osint-toolbar-field border text-zinc-300 outline-none';

export const CHROME_TOOLBAR_GROUP_CLASS = 'osint-toolbar-group overflow-hidden';

export const CHROME_HEADER_SELECT_WRAP_CLASS =
  'hidden min-w-[180px] max-w-[220px] shrink-0 md:block';

export const CHROME_HEADER_SELECT_TRIGGER_CLASS =
  `${CHROME_TOOLBAR_FIELD_CLASS} osint-meta-value rounded-none py-1.5 pl-3 pr-8 truncate`;

export const getChromeToggleButtonClass = (active: boolean) =>
  `osint-meta-label inline-flex items-center justify-center border p-2 transition outline-none ${
    active ? 'osint-button-chrome-active' : 'osint-button-chrome'
  }`;

export const getChromeMenuButtonClass = (active: boolean) =>
  `osint-meta-label-strong inline-flex items-center px-3 py-1.5 ${
    active ? 'osint-button-chrome-active' : 'osint-button-chrome'
  }`;

export const getChromeToolbarSegmentButtonClass = (active: boolean) =>
  `osint-meta-label inline-flex items-center justify-center px-3 py-1.5 transition ${
    active ? 'osint-button-chrome-active' : 'osint-button-chrome text-zinc-400 hover:text-white'
  }`;

export const getChromeSegmentButtonClass = (active: boolean) =>
  `osint-meta-label inline-flex items-center justify-center px-3 py-1.5 transition ${
    active
      ? 'bg-osint-primary/10 text-osint-primary'
      : 'text-zinc-500 hover:text-white'
  }`;
