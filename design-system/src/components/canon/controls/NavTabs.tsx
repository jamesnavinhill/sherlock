import { cx } from '../utils/cx';

export interface NavTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: ReadonlyArray<{ id: T; label: string }>;
  stretch?: boolean;
}

export function NavTabs<T extends string>({
  value,
  onChange,
  items,
  stretch = false,
}: NavTabsProps<T>) {
  return (
    <div className={cx('ds-nav-tabs', stretch && 'ds-nav-tabs-stretch')}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ds-nav-tab"
          data-active={value === item.id ? 'true' : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
