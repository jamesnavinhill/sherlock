import { cx } from '../utils/cx';

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
