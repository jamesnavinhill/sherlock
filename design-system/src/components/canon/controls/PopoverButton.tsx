import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import { useDismissableLayer } from '../utils/useDismissableLayer';
import { Button, type ButtonVariant } from './Button';
import { cx } from '../utils/cx';

export interface PopoverButtonProps {
  label: ReactNode;
  children: ReactNode | ((controls: { close: () => void }) => ReactNode);
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
  const close = () => setOpen(false);

  useDismissableLayer(open, rootRef, close);

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
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      ) : null}
    </div>
  );
}
