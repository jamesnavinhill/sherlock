import { cx } from '../utils/cx';

export interface SegmentedTabItem<T extends string> {
  id: T;
  label: string;
}

export interface SegmentedTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: ReadonlyArray<SegmentedTabItem<T>>;
  stretch?: boolean;
  size?: 'default' | 'compact';
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  items,
  stretch = false,
  size = 'default',
}: SegmentedTabsProps<T>) {
  return (
    <div
      className={cx(
        'ds-segmented-tabs',
        stretch && 'ds-segmented-tabs-stretch',
        size === 'compact' && 'ds-segmented-tabs-compact'
      )}
    >
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
