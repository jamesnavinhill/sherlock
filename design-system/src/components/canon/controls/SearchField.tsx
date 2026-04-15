import { Search, X } from 'lucide-react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useId, useMemo, useRef, useState } from 'react';

import { useDismissableLayer } from '../utils/useDismissableLayer';

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
  const rootRef = useRef<HTMLDivElement | null>(null);
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

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
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
          <button
            type="button"
            className="ds-search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
          >
            <X size={14} />
          </button>
        ) : (
          <span className="ds-keycap">Ctrl K</span>
        )}
      </div>
      {open ? (
        <div className="ds-menu-panel ds-search-results ds-menu-panel-start" id={listId}>
          {results.length === 0 ? (
            <div className="ds-empty-state">No matching components.</div>
          ) : (
            results.map((item) => (
              <button
                key={itemLabel(item)}
                type="button"
                className="ds-menu-item"
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
        </div>
      ) : null}
    </div>
  );
}
