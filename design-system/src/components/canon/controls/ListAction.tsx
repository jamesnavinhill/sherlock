import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Heading, Text } from '../typography';
import { cx } from '../utils/cx';

export interface ListActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  compact?: boolean;
}

export interface ListActionItem {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export interface ListActionGroupProps {
  items: ReadonlyArray<ListActionItem>;
  compact?: boolean;
  className?: string;
}

export function ListAction({
  label,
  description,
  icon,
  meta,
  compact = false,
  className,
  type = 'button',
  ...props
}: ListActionProps) {
  return (
    <button
      type={type}
      className={cx('ds-list-item', compact && 'ds-list-item-sm', className)}
      {...props}
    >
      {icon ? <span className="ds-list-action-icon">{icon}</span> : null}
      <span className="ds-list-action-copy">
        <Heading level="inline" as="span">
          {label}
        </Heading>
        {description ? (
          <Text as="span" variant="quiet">
            {description}
          </Text>
        ) : null}
      </span>
      {meta ? <span className="ds-list-action-meta">{meta}</span> : null}
    </button>
  );
}

export function ListActionGroup({ items, compact = false, className }: ListActionGroupProps) {
  return (
    <div className={cx('ds-list-item-stack', className)}>
      {items.map((item) => (
        <ListAction
          key={item.id}
          label={item.label}
          description={item.description}
          icon={item.icon}
          meta={item.meta}
          compact={compact}
          disabled={item.disabled}
          data-active={item.active ? 'true' : undefined}
          onClick={item.onPress}
        />
      ))}
    </div>
  );
}
