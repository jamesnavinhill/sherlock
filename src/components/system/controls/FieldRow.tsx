import React from 'react';

interface FieldRowProps {
  label: React.ReactNode;
  value?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const FieldRow: React.FC<FieldRowProps> = ({
  label,
  value,
  description,
  children,
  className,
  headerClassName,
  labelClassName,
  valueClassName,
  descriptionClassName,
  contentClassName,
}) => (
  <div className={cx('grid gap-3', className)}>
    <div className={cx('flex items-start justify-between gap-3', headerClassName)}>
      <div className={cx('osint-meta-label', labelClassName)}>{label}</div>
      {value ? <div className={cx('osint-meta-label text-right', valueClassName)}>{value}</div> : null}
    </div>
    {description ? <p className={cx('osint-body-quiet', descriptionClassName)}>{description}</p> : null}
    {children ? <div className={contentClassName}>{children}</div> : null}
  </div>
);
