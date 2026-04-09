import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { CHROME_ACTION_BUTTON_CLASS, CHROME_THIN_ACTION_BUTTON_CLASS } from './chrome';

export interface InspectorActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  iconOnly?: boolean;
  iconClassName?: string;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  className?: string;
}

interface InspectorActionRowProps {
  actions: InspectorActionItem[];
  className?: string;
  layout?: 'grid' | 'wrap';
  showLabels?: boolean;
  density?: 'default' | 'thin';
  gridColumns?: number;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const InspectorActionRow: React.FC<InspectorActionRowProps> = ({
  actions,
  className,
  layout = 'wrap',
  showLabels = true,
  density = 'default',
  gridColumns,
}) => {
  if (actions.length === 0) return null;
  const buttonClassName =
    density === 'thin' ? CHROME_THIN_ACTION_BUTTON_CLASS : CHROME_ACTION_BUTTON_CLASS;
  const resolvedGridColumns =
    typeof gridColumns === 'number' && gridColumns > 0 ? gridColumns : actions.length;

  return (
    <div
      className={cx(layout === 'wrap' ? 'flex flex-wrap justify-start gap-2' : 'grid gap-2', className)}
      style={
        layout === 'grid'
          ? { gridTemplateColumns: `repeat(${resolvedGridColumns}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {actions.map((action) => {
        const Icon = action.icon;
        const showActionLabel = showLabels && !action.iconOnly;
        const sharedProps = {
          className: cx(
            buttonClassName,
            layout === 'wrap'
              ? action.iconOnly
                ? density === 'thin'
                  ? 'min-w-8 shrink-0 px-0'
                  : 'w-9 shrink-0 px-0'
                : 'shrink-0'
              : 'w-full',
            action.className
          ),
          title: action.label,
          'aria-label': action.label,
        };

        if (action.href) {
          return (
            <a
              key={action.id}
              href={action.href}
              target={action.target}
              rel={action.rel}
              {...sharedProps}
            >
              <Icon className={cx('h-4 w-4 shrink-0', action.iconClassName)} />
              {showActionLabel ? <span>{action.label}</span> : null}
            </a>
          );
        }

        return (
          <button key={action.id} type="button" onClick={action.onClick} {...sharedProps}>
            <Icon className={cx('h-4 w-4 shrink-0', action.iconClassName)} />
            {showActionLabel ? <span>{action.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
};
