import React from 'react';

interface PopupSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const PopupSurface: React.FC<PopupSurfaceProps> = ({
  children,
  className,
  ...rest
}) => (
  <div className={cx('osint-popup-surface', className)} {...rest}>
    {children}
  </div>
);
