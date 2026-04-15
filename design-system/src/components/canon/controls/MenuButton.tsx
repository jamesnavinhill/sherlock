import type { ReactNode } from 'react';

import { PopoverButton } from './PopoverButton';

export interface MenuButtonProps {
  label: ReactNode;
  items: Array<{ id: string; label: string; description?: string; icon?: ReactNode }>;
  leadingIcon?: ReactNode;
  className?: string;
  panelClassName?: string;
  triggerClassName?: string;
}

export function MenuButton({
  label,
  items,
  leadingIcon,
  className,
  panelClassName,
  triggerClassName,
}: MenuButtonProps) {
  return (
    <PopoverButton
      label={label}
      leadingIcon={leadingIcon}
      className={className}
      panelClassName={panelClassName}
      triggerClassName={triggerClassName}
    >
      {items.map((item) => (
        <button key={item.id} type="button" className="ds-menu-item">
          <span className="ds-menu-item-leading">{item.icon}</span>
          <span className="ds-menu-item-stack">
            <span className="ds-menu-item-title">{item.label}</span>
            {item.description ? (
              <span className="ds-menu-item-description">{item.description}</span>
            ) : null}
          </span>
        </button>
      ))}
    </PopoverButton>
  );
}
