import React from 'react';

import {
  CHROME_THIN_ACTION_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_BUTTON_CLASS,
  getChromeThinActionRowClassName,
} from '@/components/ui/chrome';
import type { LibraryRailEntry as LibraryRailEntryModel } from './libraryRailTypes';

interface LibraryRailEntryProps {
  entry: LibraryRailEntryModel;
}

const renderEntryAction = (action: NonNullable<LibraryRailEntryModel['actions']>[number]) => {
  const ActionIcon = action.icon;
  const sharedClassName =
    `${CHROME_THIN_ACTION_BUTTON_CLASS} w-full ${action.className || ''}`.trim();

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
};

export const LibraryRailEntry: React.FC<LibraryRailEntryProps> = ({ entry }) => {
  const headerContent = (
    <div className="flex min-w-0 items-start gap-2">
      {entry.icon ? <div className="shrink-0 text-current">{entry.icon}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="truncate osint-body-quiet leading-5" style={{ color: 'inherit' }}>
          {entry.title}
        </div>
        {entry.meta ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">{entry.meta}</div>
        ) : null}
        {entry.description ? (
          <div className="mt-1 osint-body-quiet text-zinc-500">{entry.description}</div>
        ) : null}
      </div>
    </div>
  );

  const interactiveClassName = [
    `${CHROME_THIN_NESTED_ITEM_BUTTON_CLASS} block w-full text-left`,
    entry.isActive ? '' : 'text-zinc-300',
  ]
    .filter(Boolean)
    .join(' ');

  const actionCount = Math.min(entry.actions?.length ?? 0, 2);

  const actions = entry.actions?.length ? (
    <div className={getChromeThinActionRowClassName(actionCount)}>
      {entry.actions.map(renderEntryAction)}
    </div>
  ) : null;

  const primaryContent = entry.href ? (
    <a
      href={entry.href}
      target={entry.target}
      rel={entry.rel}
      className={interactiveClassName}
      data-active={entry.isActive ? 'true' : undefined}
    >
      {headerContent}
    </a>
  ) : entry.onClick ? (
    <button
      type="button"
      onClick={entry.onClick}
      className={interactiveClassName}
      data-active={entry.isActive ? 'true' : undefined}
    >
      {headerContent}
    </button>
  ) : (
    <div className={`${CHROME_THIN_NESTED_ITEM_BUTTON_CLASS} block w-full text-left text-zinc-300`}>
      {headerContent}
    </div>
  );

  if (!actions) {
    return primaryContent;
  }

  return <div className="space-y-2">{primaryContent}{actions}</div>;
};
