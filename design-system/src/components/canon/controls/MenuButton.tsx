import type { ReactNode } from 'react';

import { PopoverButton } from './PopoverButton';

export interface MenuButtonProps {
  label: string;
  items: Array<{ id: string; label: string; description?: string; icon?: ReactNode }>;
}

export function MenuButton({ label, items }: MenuButtonProps) {
  return (
    <PopoverButton label={label}>
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
