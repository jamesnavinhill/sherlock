import { Check, ChevronDown, ChevronRight, Copy, Search } from 'lucide-react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: Array<{ id: T; label: string }>;
  stretch?: boolean;
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  items,
  stretch = false,
}: TabsProps<T>) {
  return (
    <div className={cx('ds-segmented-tabs', stretch && 'ds-segmented-tabs-stretch')}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ds-segmented-tab"
          data-active={value === item.id ? 'true' : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

interface AccordionProps {
  title: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  meta?: ReactNode;
  className?: string;
}

export function AccordionSection({
  title,
  isOpen,
  onToggle,
  children,
  meta,
  className,
}: AccordionProps) {
  return (
    <section className={cx('ds-accordion', className)}>
      <button type="button" className="ds-accordion-trigger" onClick={onToggle}>
        <span className="ds-accordion-leading">
          {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          <span>{title}</span>
        </span>
        {meta ? <span className="ds-meta-label">{meta}</span> : null}
      </button>
      {isOpen ? <div className="ds-accordion-body">{children}</div> : null}
    </section>
  );
}

interface FieldRowProps {
  label: string;
  value?: string;
  description?: string;
  children: ReactNode;
}

export function FieldRow({ label, value, description, children }: FieldRowProps) {
  return (
    <label className="ds-field-row">
      <div className="ds-field-row-header">
        <span className="ds-meta-label">{label}</span>
        {value ? <span className="ds-meta-value">{value}</span> : null}
      </div>
      {description ? <p className="ds-body-quiet">{description}</p> : null}
      {children}
    </label>
  );
}

interface RangeFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  description?: string;
}

export function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format = (nextValue) => nextValue.toString(),
  description,
}: RangeFieldProps) {
  return (
    <FieldRow label={label} value={format(value)} description={description}>
      <input
        className="ds-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </FieldRow>
  );
}

interface SelectFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

export function SelectField({ label, value, onChange, options, className }: SelectFieldProps) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

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
        <div className="ds-menu-panel ds-select-menu">
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
              <span>{option.label}</span>
              {option.value === value ? <Check size={14} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface MenuButtonProps {
  label: string;
  items: Array<{ id: string; label: string; description?: string }>;
}

export function MenuButton({ label, items }: MenuButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div className="ds-menu-wrap" ref={rootRef}>
      <button
        type="button"
        className="ds-toolbar-button"
        data-active={open ? 'true' : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="ds-menu-panel">
          {items.map((item) => (
            <button key={item.id} type="button" className="ds-menu-item">
              <span className="ds-menu-item-stack">
                <span className="ds-menu-item-title">{item.label}</span>
                {item.description ? (
                  <span className="ds-menu-item-description">{item.description}</span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface SearchFieldProps<T> {
  items: T[];
  itemLabel: (item: T) => string;
  itemKind: (item: T) => string;
  placeholder?: string;
}

export function SearchField<T>({
  items,
  itemLabel,
  itemKind,
  placeholder = 'Global Search',
}: SearchFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items.slice(0, 7);
    }
    return items
      .filter((item) => itemLabel(item).toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [itemLabel, items, query]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="ds-search-field" ref={rootRef}>
      <div className="ds-search-shell" data-state={open ? 'open' : 'closed'}>
        <Search size={15} />
        <input
          aria-controls={listId}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <span className="ds-keycap">Ctrl K</span>
      </div>
      {open ? (
        <div className="ds-menu-panel ds-search-results" id={listId}>
          {results.length === 0 ? (
            <div className="ds-empty-state">No matching components.</div>
          ) : (
            results.map((item) => (
              <button key={itemLabel(item)} type="button" className="ds-menu-item">
                <span className="ds-menu-item-stack">
                  <span className="ds-menu-item-title">{itemLabel(item)}</span>
                  <span className="ds-menu-item-description">{itemKind(item)}</span>
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="ds-toolbar-button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
    >
      <Copy size={14} />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function SurfaceCard({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('ds-card', className)}>
      <header className="ds-card-header">
        {eyebrow ? <span className="ds-meta-label">{eyebrow}</span> : null}
        <h3 className="ds-title-card">{title}</h3>
      </header>
      {children}
    </section>
  );
}

export function TokenSwatch({
  label,
  style,
  meta,
}: {
  label: string;
  style: CSSProperties;
  meta: string;
}) {
  return (
    <div className="ds-token-swatch">
      <div className="ds-token-swatch-box" style={style} />
      <div className="ds-token-swatch-copy">
        <span className="ds-title-inline">{label}</span>
        <span className="ds-body-quiet">{meta}</span>
      </div>
    </div>
  );
}
