export const CHROME_HEADER_CLASS =
  'sticky top-0 z-30 h-20 border-b border-zinc-800 bg-black/95 backdrop-blur-md osint-header-shadow';

export const CHROME_HEADER_ROW_CLASS = 'flex h-full min-w-0 items-center justify-between gap-3';

export const getChromeToggleButtonClass = (active: boolean) =>
  `inline-flex items-center justify-center border p-2 text-xs font-mono uppercase transition outline-none focus-visible:ring-2 focus-visible:ring-osint-primary ${
    active
      ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
      : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
  }`;

export const getChromeMenuButtonClass = (active: boolean) =>
  `inline-flex items-center px-3 py-1.5 font-mono text-xs font-bold uppercase ${
    active ? 'osint-button-chrome-active' : 'osint-button-chrome'
  }`;
