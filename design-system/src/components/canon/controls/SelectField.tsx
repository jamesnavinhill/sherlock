import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

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
      return;
    }
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  return (
    <div className={cx('ds-select-wrap', className)} ref={rootRef}>
      {label ? <span className="ds-meta-label">{label}</span> : null}
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
        <PopupSurface id={listboxId} role="listbox" className="ds-select-menu" align="start">
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
                <span className="ds-menu-item-title">{option.label}</span>
                {option.description ? (
                  <span className="ds-menu-item-description">{option.description}</span>
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
