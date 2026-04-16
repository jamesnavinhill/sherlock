import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PopoverButton } from './PopoverButton';
import { cx } from '../utils/cx';

export interface MenuButtonItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  closeOnSelect?: boolean;
  onSelect?: () => void;
}

export interface MenuButtonProps {
  label: ReactNode;
  items: ReadonlyArray<MenuButtonItem>;
  leadingIcon?: ReactNode;
  className?: string;
  panelClassName?: string;
  triggerClassName?: string;
}

interface MenuButtonPanelProps {
  items: ReadonlyArray<MenuButtonItem>;
  close: () => void;
}

function MenuButtonPanel({ items, close }: MenuButtonPanelProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabledIndexes = useMemo(
    () => items.map((item, index) => (item.disabled ? -1 : index)).filter((index) => index >= 0),
    [items]
  );
  const defaultIndex = useMemo(() => {
    const checkedIndex = items.findIndex((item) => item.checked && !item.disabled);
    if (checkedIndex >= 0) {
      return checkedIndex;
    }
    return enabledIndexes[0] ?? -1;
  }, [enabledIndexes, items]);
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  useEffect(() => {
    setActiveIndex(defaultIndex);
  }, [defaultIndex]);

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }
    buttonRefs.current[activeIndex]?.focus();
  }, [activeIndex]);

  const moveActiveIndex = (direction: 1 | -1) => {
    if (enabledIndexes.length === 0) {
      return;
    }

    const currentPosition = enabledIndexes.indexOf(activeIndex);
    const nextPosition =
      currentPosition === -1
        ? 0
        : (currentPosition + direction + enabledIndexes.length) % enabledIndexes.length;

    setActiveIndex(enabledIndexes[nextPosition] ?? enabledIndexes[0]);
  };

  const handleSelect = (item: MenuButtonItem) => {
    if (item.disabled) {
      return;
    }
    item.onSelect?.();
    if (item.closeOnSelect !== false) {
      close();
    }
  };

  return (
    <div className="ds-menu-list" onKeyDown={(event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveActiveIndex(1);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveActiveIndex(-1);
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        setActiveIndex(enabledIndexes[0] ?? -1);
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        setActiveIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    }}>
      {items.map((item, index) => {
        const role = item.checked === undefined ? 'menuitem' : 'menuitemcheckbox';
        const isActive = index === activeIndex;

        return (
          <button
            key={item.id}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role={role}
            aria-checked={item.checked === undefined ? undefined : item.checked}
            disabled={item.disabled}
            tabIndex={isActive ? 0 : -1}
            className={cx('ds-menu-item', item.disabled && 'ds-menu-item-disabled')}
            data-active={isActive ? 'true' : undefined}
            onFocus={() => {
              if (!item.disabled) {
                setActiveIndex(index);
              }
            }}
            onMouseEnter={() => {
              if (!item.disabled) {
                setActiveIndex(index);
              }
            }}
            onClick={() => handleSelect(item)}
          >
            <span className="ds-menu-item-leading">{item.icon}</span>
            <span className="ds-menu-item-stack">
              <span className="ds-menu-item-title">{item.label}</span>
              {item.description ? (
                <span className="ds-menu-item-description">{item.description}</span>
              ) : null}
            </span>
            {item.shortcut ? <span className="ds-menu-item-shortcut">{item.shortcut}</span> : null}
          </button>
        );
      })}
    </div>
  );
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
      panelRole="menu"
    >
      {({ close }) => <MenuButtonPanel items={items} close={close} />}
    </PopoverButton>
  );
}
