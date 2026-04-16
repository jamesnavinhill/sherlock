import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Eyebrow, Heading, Text } from '../typography';
import { cx } from '../utils/cx';
import { useDismissableLayer } from '../utils/useDismissableLayer';
import { PopupSurface } from './PopupSurface';

export interface SelectFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
  className?: string;
}

export function SelectField({ label, value, onChange, options, className }: SelectFieldProps) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;
  const [open, setOpen] = useState(false);
  const [menuMaxHeight, setMenuMaxHeight] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((option) => option.value === value)
    )
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();

  useDismissableLayer(open, rootRef, () => setOpen(false));

  useEffect(() => {
    const selectedIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [options, value]);

  useEffect(() => {
    if (!open) {
      setMenuMaxHeight(null);
      return;
    }
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updateMenuMaxHeight = () => {
      const root = rootRef.current;
      if (!root) {
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const sectionBottom =
        root.closest('.ds-accordion')?.getBoundingClientRect().bottom ?? Number.POSITIVE_INFINITY;
      const viewportBottom = window.innerHeight - 16;
      const maxBottom = Math.min(sectionBottom - 8, viewportBottom);
      const availableHeight = Math.max(0, Math.floor(maxBottom - rootRect.bottom - 8));

      setMenuMaxHeight(availableHeight);
    };

    const scrollParents = new Set<EventTarget>();
    let current = rootRef.current?.parentElement ?? null;
    while (current) {
      const { overflowY } = window.getComputedStyle(current);
      if (/(auto|scroll|overlay)/.test(overflowY)) {
        scrollParents.add(current);
      }
      current = current.parentElement;
    }

    updateMenuMaxHeight();

    scrollParents.forEach((target) =>
      target.addEventListener('scroll', updateMenuMaxHeight, { passive: true })
    );
    window.addEventListener('resize', updateMenuMaxHeight);

    return () => {
      scrollParents.forEach((target) =>
        target.removeEventListener('scroll', updateMenuMaxHeight)
      );
      window.removeEventListener('resize', updateMenuMaxHeight);
    };
  }, [open]);

  return (
    <div className={cx('ds-select-wrap', className)} ref={rootRef}>
      {label ? <Eyebrow>{label}</Eyebrow> : null}
      <button
        type="button"
        className="ds-select-trigger"
        data-state={open ? 'open' : 'closed'}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={15} />
      </button>
      {open ? (
        <PopupSurface
          id={listboxId}
          role="listbox"
          className="ds-select-menu"
          align="start"
          style={menuMaxHeight !== null ? { maxHeight: `${menuMaxHeight}px` } : undefined}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              className="ds-menu-item"
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              data-active={option.value === value ? 'true' : undefined}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActiveIndex((current) => (current + 1) % options.length);
                  return;
                }

                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveIndex((current) => (current - 1 + options.length) % options.length);
                  return;
                }

                if (event.key === 'Home') {
                  event.preventDefault();
                  setActiveIndex(0);
                  return;
                }

                if (event.key === 'End') {
                  event.preventDefault();
                  setActiveIndex(options.length - 1);
                }
              }}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span className="ds-menu-item-stack">
                <Heading level="inline" as="span" className="ds-menu-item-title">
                  {option.label}
                </Heading>
                {option.description ? (
                  <Text as="span" className="ds-menu-item-description" variant="quiet">
                    {option.description}
                  </Text>
                ) : null}
              </span>
              {option.value === value ? <Check size={14} /> : null}
            </button>
          ))}
        </PopupSurface>
      ) : null}
    </div>
  );
}
