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
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const baseActionClassName =
  'inline-flex h-9 w-full items-center justify-center border border-zinc-700 bg-transparent text-zinc-400 transition-colors hover:border-white hover:text-white';

export const InspectorActionRow: React.FC<InspectorActionRowProps> = ({
  actions,
  className,
}) => {
  if (actions.length === 0) return null;

  return (
    <div
      className={cx('grid gap-2', className)}
      style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        const sharedProps = {
          className: cx(baseActionClassName, action.className),
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
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            {...sharedProps}
          >
            <Icon className={cx('h-4 w-4', action.iconClassName)} />
          </button>
        );
      })}
    </div>
  );
};
