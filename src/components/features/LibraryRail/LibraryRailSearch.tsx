import React from 'react';
import { Search } from 'lucide-react';

interface LibraryRailSearchProps {
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

export const LibraryRailSearch: React.FC<LibraryRailSearchProps> = ({
  onChange,
  placeholder = 'Search library...',
  value,
}) => (
  <div className="relative">
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="osint-input-field w-full px-10 py-2 text-sm"
    />
  </div>
);
