import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface OsintSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface OsintSelectProps {
  value: string;
  options: OsintSelectOption[];
  onChange: (value: string) => void;
  chrome?: 'default' | 'toolbar';
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  containerClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  menuPlacement?: 'top' | 'bottom';
  portalledMenu?: boolean;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const getNextEnabledIndex = (
  options: OsintSelectOption[],
  startIndex: number,
  direction: 1 | -1
) => {
  if (options.length === 0) return -1;

  let index = startIndex;

  for (let step = 0; step < options.length; step += 1) {
    index = (index + direction + options.length) % options.length;
    if (!options[index]?.disabled) {
      return index;
    }
  }

  return -1;
};

const getFirstEnabledIndex = (options: OsintSelectOption[]) =>
  options.findIndex((option) => !option.disabled);

export const OsintSelect: React.FC<OsintSelectProps> = ({
  value,
  options,
  onChange,
  chrome = 'default',
  triggerClassName,
  menuClassName,
  optionClassName,
  containerClassName,
  disabled = false,
  placeholder,
  ariaLabel,
  menuPlacement = 'bottom',
  portalledMenu = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value]
  );

  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const displayLabel = selectedOption?.label ?? placeholder ?? '';
  const [portalMenuStyle, setPortalMenuStyle] = useState<React.CSSProperties | undefined>();
  const triggerBaseClass =
    chrome === 'toolbar'
      ? 'osint-toolbar-field osint-meta-value w-full border text-left outline-none transition disabled:cursor-not-allowed disabled:opacity-40'
      : 'osint-input-field osint-meta-value w-full text-left outline-none disabled:cursor-not-allowed disabled:opacity-40';

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleWindowBlur = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;

    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || !portalledMenu || !rootRef.current) return undefined;

    const updateMenuPosition = () => {
      if (!rootRef.current) return;

      const rect = rootRef.current.getBoundingClientRect();
      const viewportPadding = 16;
      const availableHeight =
        menuPlacement === 'top'
          ? Math.max(120, rect.top - viewportPadding - 4)
          : Math.max(120, window.innerHeight - rect.bottom - viewportPadding - 4);

      setPortalMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(availableHeight, 320),
        zIndex: 1400,
        ...(menuPlacement === 'top'
          ? {
              top: rect.top - 4,
              transform: 'translateY(-100%)',
            }
          : {
              top: rect.bottom + 4,
            }),
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, menuPlacement, portalledMenu]);

  const openMenu = () => {
    if (disabled || options.length === 0) return;
    const nextIndex =
      selectedIndex >= 0 && !options[selectedIndex]?.disabled
        ? selectedIndex
        : getFirstEnabledIndex(options);

    setActiveIndex(nextIndex);
    setIsOpen(true);
  };

  const closeMenu = () => {
    setActiveIndex(-1);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const commitSelection = (nextValue: string) => {
    onChange(nextValue);
    setActiveIndex(-1);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || options.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;

      if (!isOpen) {
        setIsOpen(true);
        const initialIndex =
          selectedIndex >= 0 && !options[selectedIndex]?.disabled
            ? selectedIndex
            : direction === 1
              ? getFirstEnabledIndex(options)
              : getNextEnabledIndex(options, 0, -1);
        setActiveIndex(initialIndex);
        return;
      }

      const seedIndex = selectedIndex >= 0 ? selectedIndex : direction === 1 ? -1 : 0;
      setActiveIndex(getNextEnabledIndex(options, seedIndex, direction));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === 'Tab') {
      setActiveIndex(-1);
      setIsOpen(false);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(getFirstEnabledIndex(options));
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(getNextEnabledIndex(options, 0, -1));
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        getNextEnabledIndex(
          options,
          current < 0 ? selectedIndex : current,
          event.key === 'ArrowDown' ? 1 : -1
        )
      );
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (activeIndex >= 0 && !options[activeIndex]?.disabled) {
        commitSelection(options[activeIndex].value);
      }
    }
  };

  const menuContent = isOpen ? (
    <div
      id={listboxId}
      ref={menuRef}
      role="listbox"
      aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
      className={cx(
        portalledMenu
          ? 'osint-menu-panel overflow-hidden'
          : 'osint-menu-panel absolute left-0 top-full z-[60] mt-1 min-w-full overflow-hidden',
        menuClassName
      )}
      style={portalledMenu ? portalMenuStyle : undefined}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isActive = index === activeIndex;

        return (
          <button
            key={`${option.value}-${index}`}
            id={`${listboxId}-option-${index}`}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            type="button"
            role="option"
            aria-selected={isSelected}
            data-active={isActive ? 'true' : 'false'}
            disabled={option.disabled}
            onClick={() => !option.disabled && commitSelection(option.value)}
            onMouseEnter={() => !option.disabled && setActiveIndex(index)}
            onKeyDown={handleOptionKeyDown}
            className={cx(
              'osint-menu-item osint-meta-value flex w-full items-center justify-between gap-3 border-b border-zinc-800 px-3 py-2 text-left outline-none last:border-b-0',
              option.disabled && 'cursor-not-allowed opacity-40',
              optionClassName
            )}
          >
            <span className="block min-w-0 flex-1 break-words">{option.label}</span>
            {isSelected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={cx('relative', containerClassName)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled || options.length === 0}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        data-state={isOpen ? 'open' : 'closed'}
        className={cx(triggerBaseClass, triggerClassName)}
      >
        <span className="block truncate">{displayLabel}</span>
        <ChevronDown
          className={cx(
            'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {portalledMenu && typeof document !== 'undefined'
        ? createPortal(menuContent, document.body)
        : menuContent}
    </div>
  );
};
