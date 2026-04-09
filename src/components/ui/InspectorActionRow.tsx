import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface InspectorActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
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
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const baseActionClassName =
  'osint-surface-button inline-flex h-9 items-center justify-center text-zinc-400';

export const InspectorActionRow: React.FC<InspectorActionRowProps> = ({
  actions,
  className,
  layout = 'grid',
}) => {
  if (actions.length === 0) return null;

  return (
    <div
      className={cx(layout === 'wrap' ? 'flex flex-wrap justify-start gap-2' : 'grid gap-2', className)}
      style={
        layout === 'grid'
          ? { gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {actions.map((action) => {
        const Icon = action.icon;
        const sharedProps = {
          className: cx(
            baseActionClassName,
            layout === 'wrap' ? 'w-9 shrink-0' : 'w-full',
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
              <Icon className={cx('h-4 w-4', action.iconClassName)} />
            </a>
          );
        }

        return (
          <button key={action.id} type="button" onClick={action.onClick} {...sharedProps}>
            <Icon className={cx('h-4 w-4', action.iconClassName)} />
          </button>
        );
      })}
    </div>
  );
};
