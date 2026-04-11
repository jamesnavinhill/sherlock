export const CHROME_HEADER_CLASS =
  'osint-app-header sticky top-0 z-30 h-20 border-b border-zinc-800 bg-black/95 backdrop-blur-md osint-header-shadow transition-[transform,margin-bottom,opacity] duration-200 ease-out will-change-transform';

export const CHROME_HEADER_ROW_CLASS = 'flex h-full min-w-0 items-center justify-between gap-3';

export const CHROME_PANEL_CLASS = 'osint-panel-shell border-zinc-800 bg-black/95 backdrop-blur-md';

export const CHROME_PANEL_HEADER_CLASS =
  'border-b border-zinc-800 bg-zinc-900/30 px-4 py-3';

export const CHROME_TOP_PANEL_HEADER_MIN_HEIGHT_CLASS = 'min-h-16';

export const CHROME_PANEL_ACTION_ROW_CLASS =
  'border-b border-zinc-800 bg-zinc-900/10 px-4 py-3';

export const CHROME_RAIL_BODY_CLASS =
  'flex flex-1 min-h-0 flex-col gap-2 overflow-hidden p-3';

export const CHROME_RAIL_SECTION_SCROLL_CLASS =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 custom-scrollbar';

export const CHROME_ACTION_BUTTON_CLASS =
  'osint-surface-button inline-flex h-9 items-center justify-center gap-2 px-3 osint-meta-label-strong text-zinc-300';

export const CHROME_COMPACT_ACTION_BUTTON_CLASS = `${CHROME_ACTION_BUTTON_CLASS} h-6 px-2`;

export const CHROME_THIN_ACTION_BUTTON_CLASS =
  'osint-rail-button inline-flex h-6 items-center justify-center gap-1.5 px-2 osint-meta-label-strong text-[11px] text-zinc-300';

export const CHROME_PANEL_TAB_ROW_CLASS = 'flex w-full justify-start gap-2';

export const CHROME_NESTED_ITEM_CLASS = 'osint-panel-item p-3';
export const CHROME_NESTED_ACTION_ITEM_CLASS = 'osint-panel-action-item p-3';

export const CHROME_RAISED_SURFACE_CLASS = 'osint-raised-surface';
export const CHROME_CARD_SURFACE_CLASS =
  'osint-raised-surface bg-[var(--osint-interaction-bg)] backdrop-blur-sm';

export const CHROME_RAISED_SURFACE_SUBTLE_CLASS = 'osint-raised-surface-subtle';

export const CHROME_NESTED_ITEM_BUTTON_CLASS = `${CHROME_NESTED_ACTION_ITEM_CLASS} w-full text-left`;

export const CHROME_COMPACT_NESTED_ITEM_CLASS = 'osint-panel-item px-3 py-2';
export const CHROME_COMPACT_NESTED_ACTION_ITEM_CLASS = 'osint-panel-action-item px-3 py-2';

export const CHROME_COMPACT_NESTED_ITEM_BUTTON_CLASS =
  `${CHROME_COMPACT_NESTED_ACTION_ITEM_CLASS} w-full text-left`;

export const CHROME_THIN_NESTED_ITEM_CLASS = 'osint-panel-item px-2.5 py-1.5';
export const CHROME_THIN_NESTED_ACTION_ITEM_CLASS = 'osint-rail-button px-2.5 py-1.5';

export const CHROME_THIN_NESTED_ITEM_BUTTON_CLASS =
  `${CHROME_THIN_NESTED_ACTION_ITEM_CLASS} w-full text-left text-[11px]`;

export const CHROME_THIN_NESTED_SECTION_CLASS = 'osint-raised-surface-section';

export const CHROME_THIN_ACCORDION_TRIGGER_CLASS = 'px-2.5 py-1.5 text-[11px]';

export const CHROME_NESTED_ITEM_HEADER_CLASS = 'flex items-start justify-between gap-3';

export const CHROME_NESTED_ITEM_META_ROW_CLASS = 'mt-2 flex flex-wrap items-center gap-2';

export const CHROME_NESTED_ITEM_BODY_CLASS = 'mt-2 osint-body-muted';

export const CHROME_NESTED_ITEM_SUPPORTING_BODY_CLASS = 'mt-2 osint-body-quiet';

export const CHROME_NESTED_ITEM_ACTION_ROW_CLASS = 'mt-3 flex flex-wrap items-center gap-2';

export const CHROME_THIN_ACTION_STACK_CLASS = 'flex flex-col gap-2';

export const CHROME_NESTED_ITEM_BADGE_CLASS =
  'rounded-none border border-zinc-800 bg-black/40 px-2 py-1 osint-meta-label text-zinc-500';

export const CHROME_NESTED_ITEM_DOT_CLASS = 'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600';

export const CHROME_HEADER_LEADING_GROUP_CLASS = 'flex min-w-0 flex-1 items-center gap-3';

export const CHROME_HEADER_CONTROL_HEIGHT_CLASS = 'h-[30px]';

export const CHROME_HEADER_ICON_BUTTON_SIZE_CLASS =
  `${CHROME_HEADER_CONTROL_HEIGHT_CLASS} w-[30px] shrink-0 p-0`;

export const CHROME_GHOST_ICON_BUTTON_CLASS =
  'osint-ghost-button inline-flex h-9 w-9 items-center justify-center';

export const CHROME_HEADER_PRIMARY_ACTION_CLASS =
  `osint-button-primary osint-meta-label-strong inline-flex ${CHROME_HEADER_CONTROL_HEIGHT_CLASS} shrink-0 items-center gap-2 whitespace-nowrap px-3`;

export const CHROME_TOOLBAR_FIELD_CLASS =
  `osint-toolbar-field border text-zinc-300 outline-none ${CHROME_HEADER_CONTROL_HEIGHT_CLASS}`;

export const CHROME_TOOLBAR_GROUP_CLASS = 'osint-toolbar-group overflow-hidden';

export const CHROME_HEADER_SELECT_WRAP_CLASS =
  'hidden min-w-[180px] max-w-[220px] shrink-0 md:block';

export const CHROME_HEADER_SELECT_TRIGGER_CLASS =
  `${CHROME_TOOLBAR_FIELD_CLASS} osint-meta-value flex items-center rounded-none pl-3 pr-8 truncate`;

export const getChromeToggleButtonClass = (active: boolean) =>
  `osint-meta-label inline-flex items-center justify-center border transition outline-none ${
    active ? 'osint-button-chrome-active' : 'osint-button-chrome'
  }`;

export const getChromeMenuButtonClass = (active: boolean) =>
  `osint-meta-label-strong inline-flex ${CHROME_HEADER_CONTROL_HEIGHT_CLASS} items-center px-3 ${
    active ? 'osint-button-chrome-active' : 'osint-button-chrome'
  }`;

export const getChromeToolbarSegmentButtonClass = (active: boolean) =>
  `osint-meta-label inline-flex items-center justify-center px-3 py-1.5 transition ${
    active ? 'osint-button-chrome-active' : 'osint-button-chrome text-zinc-400 hover:text-white'
  }`;

export const getChromeSegmentButtonClass = (active: boolean) =>
  `osint-ghost-button osint-meta-label inline-flex items-center justify-center px-3 py-1.5 transition ${
    active
      ? 'bg-osint-primary/10 text-osint-primary'
      : 'text-zinc-500'
  }`;

export const getRailAccordionClassName = (isOpen: boolean) =>
  isOpen ? 'mb-0 flex min-h-0 flex-1 flex-col' : 'mb-0 shrink-0';

export const getChromeThinActionRowClassName = (count: number) =>
  count > 1 ? 'mt-3 grid grid-cols-2 gap-2' : 'mt-3 flex';

export const getChromePanelTabButtonClass = (
  active: boolean,
  density: 'default' | 'thin' = 'thin'
) =>
  `inline-flex flex-1 items-center justify-center border font-mono uppercase transition ${
    density === 'thin' ? 'h-6 px-2.5 text-[11px]' : 'h-9 px-4 text-xs'
  } ${
    active
      ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
      : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
  }`;
