import { ChevronDown } from 'lucide-react';
import type { AriaRole, ReactNode } from 'react';
import { useId, useRef, useState } from 'react';

import { useDismissableLayer } from '../utils/useDismissableLayer';
import { Button, type ButtonVariant } from './Button';
import { cx } from '../utils/cx';
import { PopupSurface } from './PopupSurface';

export interface PopoverButtonProps {
  label: ReactNode;
  children:
    | ReactNode
    | ((controls: { close: () => void; open: boolean; panelId: string }) => ReactNode);
  variant?: Exclude<ButtonVariant, 'icon'>;
  align?: 'start' | 'end';
  className?: string;
  panelClassName?: string;
  triggerClassName?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  panelRole?: AriaRole;
  panelLabel?: string;
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
  panelRole = 'dialog',
  panelLabel,
}: PopoverButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
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
        aria-controls={open ? panelId : undefined}
        aria-haspopup={panelRole === 'menu' ? 'menu' : 'dialog'}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </Button>
      {open ? (
        <PopupSurface
          id={panelId}
          role={panelRole}
          aria-label={panelLabel}
          className={cx(panelClassName)}
          align={align}
        >
          {typeof children === 'function' ? children({ close, open, panelId }) : children}
        </PopupSurface>
      ) : null}
    </div>
  );
}
