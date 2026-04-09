import React from 'react';

import {
  CHROME_NESTED_ITEM_BODY_CLASS,
  CHROME_NESTED_ITEM_META_ROW_CLASS,
  CHROME_THIN_ACTION_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_CLASS,
  getChromeThinActionRowClassName,
} from '@/components/ui/chrome';
import type { LibraryRailEntry as LibraryRailEntryModel } from './libraryRailTypes';

interface LibraryRailEntryProps {
  entry: LibraryRailEntryModel;
}

export const LibraryRailEntry: React.FC<LibraryRailEntryProps> = ({ entry }) => {
  const headerContent = (
    <>
      <div className="flex min-w-0 items-start gap-3">
        {entry.icon ? <div className="shrink-0">{entry.icon}</div> : null}
        <div className="min-w-0 flex-1">
          <div className="truncate osint-meta-value text-zinc-200">{entry.title}</div>
          {entry.meta ? <div className={CHROME_NESTED_ITEM_META_ROW_CLASS}>{entry.meta}</div> : null}
          {entry.description ? <div className={CHROME_NESTED_ITEM_BODY_CLASS}>{entry.description}</div> : null}
        </div>
      </div>
    </>
  );

  const wrapperClassName =
    entry.variant === 'card' ? 'osint-panel-item p-3' : CHROME_THIN_NESTED_ITEM_CLASS;

  const interactiveClassName =
    entry.variant === 'card' ? 'w-full text-left' : CHROME_THIN_NESTED_ITEM_BUTTON_CLASS;

  if (entry.href) {
    return (
      <a
        href={entry.href}
        target={entry.target}
        rel={entry.rel}
        className={`${wrapperClassName} block ${entry.isActive ? 'border-osint-primary/40' : ''}`.trim()}
      >
        {headerContent}
        {entry.actions?.length ? (
          <div className={getChromeThinActionRowClassName(Math.min(entry.actions.length, 2))}>
            {entry.actions.map((action) => {
              const ActionIcon = action.icon;

              return (
                <span
                  key={action.id}
                  className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full ${action.className || ''}`.trim()}
                >
                  {ActionIcon ? <ActionIcon className="h-3.5 w-3.5" /> : null}
                  {action.label}
                </span>
              );
            })}
          </div>
        ) : null}
      </a>
    );
  }

  if (entry.onClick) {
    return (
      <div className={wrapperClassName}>
        <button
          type="button"
          onClick={entry.onClick}
          className={`${interactiveClassName} ${entry.isActive ? 'border-osint-primary/40 text-osint-primary' : ''}`.trim()}
        >
          {headerContent}
        </button>
        {entry.actions?.length ? (
          <div className={getChromeThinActionRowClassName(Math.min(entry.actions.length, 2))}>
            {entry.actions.map((action) => {
              const ActionIcon = action.icon;
              const sharedClassName = `${CHROME_THIN_ACTION_BUTTON_CLASS} w-full ${action.className || ''}`.trim();

              if (action.href) {
                return (
                  <a
                    key={action.id}
                    href={action.href}
                    target={action.target}
                    rel={action.rel}
                    className={sharedClassName}
                  >
                    {ActionIcon ? <ActionIcon className="h-3.5 w-3.5" /> : null}
                    {action.label}
                  </a>
                );
              }

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  className={sharedClassName}
                >
                  {ActionIcon ? <ActionIcon className="h-3.5 w-3.5" /> : null}
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      {headerContent}
      {entry.actions?.length ? (
        <div className={getChromeThinActionRowClassName(Math.min(entry.actions.length, 2))}>
          {entry.actions.map((action) => {
            const ActionIcon = action.icon;
            const sharedClassName = `${CHROME_THIN_ACTION_BUTTON_CLASS} w-full ${action.className || ''}`.trim();

            if (action.href) {
              return (
                <a
                  key={action.id}
                  href={action.href}
                  target={action.target}
                  rel={action.rel}
                  className={sharedClassName}
                >
                  {ActionIcon ? <ActionIcon className="h-3.5 w-3.5" /> : null}
                  {action.label}
                </a>
              );
            }

            return (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className={sharedClassName}
              >
                {ActionIcon ? <ActionIcon className="h-3.5 w-3.5" /> : null}
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
