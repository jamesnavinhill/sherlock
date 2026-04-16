import { Search, X } from 'lucide-react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { IconButton } from './IconButton';
import { useDismissableLayer } from '../utils/useDismissableLayer';
import { PopupSurface } from './PopupSurface';

export interface SearchFieldProps<T> {
  items: T[];
  itemLabel: (item: T) => string;
  itemKind?: (item: T) => string | undefined;
  placeholder?: string;
  onSelect?: (item: T) => void;
}

export function SearchField<T>({
  items,
  itemLabel,
  itemKind,
  placeholder = 'Global Search',
  onSelect,
}: SearchFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = useId();

  useDismissableLayer(open, rootRef, () => setOpen(false));

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items.slice(0, 7);
    }
    return items
      .filter((item) => {
        const label = itemLabel(item).toLowerCase();
        const kind = itemKind?.(item)?.toLowerCase() ?? '';
        return label.includes(normalized) || kind.includes(normalized);
      })
      .slice(0, 8);
  }, [itemKind, itemLabel, items, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      return;
    }
    resultRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (!results.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current - 1 + results.length) % results.length);
    }
  };

  return (
    <div className="ds-search-field" ref={rootRef}>
      <div className="ds-search-shell" data-state={open ? 'open' : 'closed'}>
        <Search size={15} />
        <input
          aria-controls={listId}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        {query ? (
          <IconButton
            appearance="ghost"
            label="Clear search"
            icon={<X size={14} />}
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
          />
        ) : (
          <span className="ds-search-shortcut" aria-hidden="true">
            Ctrl K
          </span>
        )}
      </div>
      {open ? (
        <PopupSurface id={listId} className="ds-search-results" align="start">
          {results.length === 0 ? (
            <div className="ds-empty-state">No matching components.</div>
          ) : (
            results.map((item, index) => (
              <button
                key={itemLabel(item)}
                ref={(node) => {
                  resultRefs.current[index] = node;
                }}
                type="button"
                className="ds-menu-item"
                tabIndex={index === activeIndex ? 0 : -1}
                data-active={index === activeIndex ? 'true' : undefined}
                onFocus={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setActiveIndex((current) => (current + 1) % results.length);
                    return;
                  }

                  if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setActiveIndex((current) => (current - 1 + results.length) % results.length);
                  }
                }}
                onClick={() => {
                  onSelect?.(item);
                  setOpen(false);
                }}
              >
                <span className="ds-menu-item-stack">
                  <span className="ds-menu-item-title">{itemLabel(item)}</span>
                  {itemKind ? (
                    <span className="ds-menu-item-description">{itemKind(item)}</span>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </PopupSurface>
      ) : null}
    </div>
  );
}
