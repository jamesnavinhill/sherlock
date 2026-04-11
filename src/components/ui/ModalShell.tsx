import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalShellProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClassName?: string;
  panelClassName?: string;
  contentClassName?: string;
  closeOnOverlayClick?: boolean;
  scrollContent?: boolean;
  allowOverflow?: boolean;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  title,
  description,
  onClose,
  children,
  footer,
  widthClassName = 'max-w-xl',
  panelClassName = '',
  contentClassName = '',
  closeOnOverlayClick = true,
  scrollContent = false,
  allowOverflow = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const modalContent = (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${widthClassName} ${allowOverflow ? 'overflow-visible' : 'overflow-hidden'} border border-zinc-700 bg-zinc-950 shadow-2xl ${
          scrollContent ? 'flex max-h-[calc(100vh-2rem)] flex-col' : ''
        } ${panelClassName}`.trim()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 bg-black px-6 py-4">
          <div className="min-w-0">
            <h3 className="osint-panel-title text-white">{title}</h3>
            {description ? <p className="mt-2 osint-body-muted">{description}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="border border-zinc-800 p-2 text-zinc-500 transition hover:border-zinc-600 hover:text-white"
            aria-label={`Close ${title}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className={`${
            scrollContent
              ? 'min-h-0 flex-1 overflow-y-auto p-6'
              : allowOverflow
                ? 'overflow-visible p-6'
                : 'p-6'
          } ${contentClassName}`.trim()}
        >
          {children}
        </div>

        {footer ? <div className="border-t border-zinc-800 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};
