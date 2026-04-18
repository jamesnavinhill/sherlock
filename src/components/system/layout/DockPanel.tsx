import React from 'react';

interface DockPanelProps {
  placement: 'left' | 'right';
  isOpen: boolean;
  children: React.ReactNode;
  widthClassName?: string;
  widthValue?: string;
  overlayOnDesktop?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const DockPanel: React.FC<DockPanelProps> = ({
  placement,
  isOpen,
  children,
  widthClassName = 'w-[var(--osint-dock-width)]',
  widthValue = 'min(20rem,calc(100vw - 1rem))',
  overlayOnDesktop = false,
  className = '',
  style,
}) => {
  const edgeClassName = placement === 'right' ? 'right-0 border-l' : 'left-0 border-r';
  const hiddenTransformClassName = placement === 'right' ? 'translate-x-full' : '-translate-x-full';
  const desktopBorderResetClassName =
    placement === 'right' ? 'lg:border-l-0' : 'lg:border-r-0';
  const resolvedWidth = isOpen ? widthValue : '0px';
  const panelStyle = {
    ...style,
    '--osint-dock-width': widthValue,
    width: resolvedWidth,
    minWidth: 0,
    maxWidth: resolvedWidth,
    flex: `0 0 ${resolvedWidth}`,
  } as React.CSSProperties;

  return (
    <aside
      aria-hidden={!isOpen}
      data-placement={placement}
      data-state={isOpen ? 'open' : 'closed'}
      style={panelStyle}
      className={`osint-dock-panel absolute top-0 z-30 flex h-full flex-col overflow-hidden ${edgeClassName} transition-all duration-200 ${
        overlayOnDesktop ? '' : 'lg:relative lg:translate-x-0'
      } ${
        isOpen
          ? `${widthClassName} translate-x-0 lg:translate-x-0`
          : `${widthClassName} pointer-events-none ${hiddenTransformClassName} ${
              overlayOnDesktop ? '' : `lg:w-0 ${desktopBorderResetClassName} lg:translate-x-0`
            }`
      } ${className}`}
    >
      {children}
    </aside>
  );
};
