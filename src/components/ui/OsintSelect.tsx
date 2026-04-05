import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
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
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  containerClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
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
  triggerClassName,
  menuClassName,
  optionClassName,
  containerClassName,
  disabled = false,
  placeholder,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value]
  );

  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const displayLabel = selectedOption?.label ?? placeholder ?? '';

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
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
      setIsOpen(true);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
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
        className={cx(
          'w-full border border-zinc-700 bg-black text-left text-zinc-300 outline-none transition hover:border-osint-primary focus-visible:border-osint-primary disabled:cursor-not-allowed disabled:opacity-40',
          triggerClassName
        )}
      >
        <span className="block truncate">{displayLabel}</span>
        <ChevronDown
          className={cx(
            'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          className={cx(
            'absolute left-0 top-full z-50 mt-1 min-w-full overflow-hidden border border-zinc-700 bg-black/95 backdrop-blur-md shadow-lg',
            menuClassName
          )}
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
                disabled={option.disabled}
                onClick={() => !option.disabled && commitSelection(option.value)}
                onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                onKeyDown={handleOptionKeyDown}
                className={cx(
                  'flex w-full items-center justify-between gap-3 border-b border-zinc-800 px-3 py-2 text-left font-mono text-xs text-zinc-300 outline-none transition last:border-b-0',
                  !option.disabled &&
                    'hover:bg-[var(--osint-primary-soft-bg)] hover:text-[var(--osint-ink)] focus-visible:bg-[var(--osint-primary-soft-bg)] focus-visible:text-[var(--osint-ink)]',
                  isSelected &&
                    'bg-[var(--osint-primary-soft-bg-strong)] text-[var(--osint-primary)]',
                  isActive &&
                    !option.disabled &&
                    'bg-[var(--osint-primary-soft-bg)] text-[var(--osint-ink)]',
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
      ) : null}
    </div>
  );
};
