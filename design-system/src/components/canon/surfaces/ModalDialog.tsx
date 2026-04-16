import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';

import { IconButton } from '../controls/IconButton';
import { Eyebrow, Heading, Text } from '../typography';
import { cx } from '../utils/cx';
import {
  DialogSurface,
  type DialogSurfacePresentation,
  type DialogSurfaceSize,
} from './DialogSurface';

export type ModalDialogSize = Extract<DialogSurfaceSize, 'sm' | 'md'>;

export interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  presentation?: DialogSurfacePresentation;
  size?: ModalDialogSize;
}

export function ModalDialog({
  open,
  onClose,
  eyebrow,
  title,
  description,
  children,
  actions,
  presentation = 'modal',
  size = 'sm',
}: ModalDialogProps) {
  const titleId = useId();
  const descriptionId = description ? `${titleId}-description` : undefined;

  return (
    <DialogSurface
      open={open}
      onClose={onClose}
      title={title}
      presentation={presentation}
      size={size}
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
      surfaceClassName={cx('ds-modal', `ds-modal-${size}`)}
    >
      <>
        <div className="ds-modal-header">
          <div className="ds-modal-copy">
            {eyebrow ? <Eyebrow as="div">{eyebrow}</Eyebrow> : null}
            <Heading id={titleId} level="panel">
              {title}
            </Heading>
            {description ? (
              <Text id={descriptionId} variant="quiet">
                {description}
              </Text>
            ) : null}
          </div>
          <IconButton
            appearance="ghost"
            label={`Close ${title}`}
            icon={<X size={16} />}
            onClick={onClose}
          />
        </div>
        {children ? <div className="ds-modal-body">{children}</div> : null}
        {actions ? <div className="ds-modal-footer">{actions}</div> : null}
      </>
    </DialogSurface>
  );
}
