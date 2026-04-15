import { Check, ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';

import { cx } from '../utils/cx';
import { useDismissableLayer } from '../utils/useDismissableLayer';

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
  const rootRef = useRef<HTMLDivElement | null>(null);

  useDismissableLayer(open, rootRef, () => setOpen(false));

  return (
    <div className={cx('ds-select-wrap', className)} ref={rootRef}>
      {label ? <span className="ds-meta-label">{label}</span> : null}
      <button
        type="button"
        className="ds-select-trigger"
        data-state={open ? 'open' : 'closed'}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={15} />
      </button>
      {open ? (
        <div className="ds-menu-panel ds-select-menu ds-menu-panel-start">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="ds-menu-item"
              data-active={option.value === value ? 'true' : undefined}
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
        </div>
      ) : null}
    </div>
  );
}
