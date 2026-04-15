import { Check, ChevronDown, Copy, Search, X } from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'toolbar'
  | 'danger'
  | 'icon';

type ButtonSize = 'sm' | 'md';

const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'ds-primary-button',
  secondary: 'ds-secondary-button',
  ghost: 'ds-ghost-button',
  toolbar: 'ds-toolbar-button',
  danger: 'ds-danger-button',
  icon: 'ds-toolbar-icon-button',
};

const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'ds-button-sm',
  md: '',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        BUTTON_VARIANT_CLASS[variant],
        BUTTON_SIZE_CLASS[size],
        fullWidth && 'ds-button-block',
        className
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  active?: boolean;
}

export function IconButton({
  label,
  icon,
  active = false,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      data-active={active ? 'true' : undefined}
      className={cx('ds-toolbar-icon-button', className)}
      {...props}
    >
      {icon}
    </button>
  );
}

type BadgeVariant = 'neutral' | 'accent' | 'outline';

export function Badge({
  children,
  variant = 'neutral',
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return <span className={cx('ds-badge', `ds-badge-${variant}`, className)}>{children}</span>;
}

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

const useDismissableLayer = (
  open: boolean,
  rootRef: React.RefObject<HTMLElement | null>,
  onClose: () => void
) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

  const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open, rootRef]);
};

interface PopoverButtonProps {
  label: ReactNode;
  children: ReactNode;
  variant?: Exclude<ButtonVariant, 'icon'>;
  align?: 'start' | 'end';
  className?: string;
  panelClassName?: string;
  triggerClassName?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function PopoverButton({
  label,
  children,
  variant = 'toolbar',
  align = 'end',
  className,
  panelClassName,
  triggerClassName,
  leadingIcon,
  trailingIcon = <ChevronDown size={14} />,
}: PopoverButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useDismissableLayer(open, rootRef, () => setOpen(false));

  return (
    <div className={cx('ds-menu-wrap', className)} ref={rootRef}>
      <Button
        variant={variant}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        className={triggerClassName}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </Button>
      {open ? (
        <div
          className={cx(
            'ds-menu-panel',
            align === 'start' ? 'ds-menu-panel-start' : 'ds-menu-panel-end',
            panelClassName
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

interface SelectFieldProps {
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

interface MenuButtonProps {
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

interface SearchFieldProps<T> {
  items: T[];
  itemLabel: (item: T) => string;
  itemKind?: (item: T) => string | undefined;
  placeholder?: string;
  onSelect?: (item: T) => void;
}

export function SearchField<T>({
  items,
  itemLabel,
  itemKind,
  placeholder = 'Global Search',
  onSelect,
}: SearchFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  useDismissableLayer(open, rootRef, () => setOpen(false));

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items.slice(0, 7);
    }
    return items
      .filter((item) => {
        const label = itemLabel(item).toLowerCase();
        const kind = itemKind?.(item)?.toLowerCase() ?? '';
        return label.includes(normalized) || kind.includes(normalized);
      })
      .slice(0, 8);
  }, [itemKind, itemLabel, items, query]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
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
        {query ? (
          <button
            type="button"
            className="ds-search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
          >
            <X size={14} />
          </button>
        ) : (
          <span className="ds-keycap">Ctrl K</span>
        )}
      </div>
      {open ? (
        <div className="ds-menu-panel ds-search-results ds-menu-panel-start" id={listId}>
          {results.length === 0 ? (
            <div className="ds-empty-state">No matching components.</div>
          ) : (
            results.map((item) => (
              <button
                key={itemLabel(item)}
                type="button"
                className="ds-menu-item"
                onClick={() => {
                  onSelect?.(item);
                  setOpen(false);
                }}
              >
                <span className="ds-menu-item-stack">
                  <span className="ds-menu-item-title">{itemLabel(item)}</span>
                  {itemKind ? (
                    <span className="ds-menu-item-description">{itemKind(item)}</span>
                  ) : null}
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
    <Button
      variant="toolbar"
      leadingIcon={<Copy size={14} />}
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
      {copied ? 'Copied' : 'Copy'}
    </Button>
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
