'use client';

import * as React from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { RelationOption } from '@/src/types/coupon';

interface RelationPickerProps {
  label: string;
  placeholder?: string;
  value: string[];
  onChange: (ids: string[]) => void;
  fetchOptions: () => Promise<RelationOption[]>;
}

export function RelationPicker({
  label,
  placeholder = 'Search…',
  value,
  onChange,
  fetchOptions,
}: RelationPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [options, setOptions] = React.useState<RelationOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function ensureLoaded() {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const opts = await fetchOptions();
      setOptions(opts);
      setLoaded(true);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }

  const selectedOptions = options.filter((o) => value.includes(o.id));
  const filtered = options.filter(
    (o) =>
      !value.includes(o.id) &&
      o.label.toLowerCase().includes(query.toLowerCase())
  );

  function toggle(id: string) {
    onChange([...value, id]);
    setQuery('');
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-bold text-zinc-600 mb-1.5">
        {label}
      </label>

      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 min-h-[46px] px-3 py-2 rounded-xl border border-zinc-200 bg-white cursor-text focus-within:ring-2 focus-within:ring-[#966FD6]/30 focus-within:border-[#966FD6]'
        )}
        onClick={() => {
          setOpen(true);
          ensureLoaded();
        }}
      >
        {selectedOptions.map((o) => (
          <span
            key={o.id}
            className="flex items-center gap-1 bg-[#966FD6]/10 text-[#6b4fa0] text-xs font-bold px-2 py-1 rounded-lg"
          >
            {o.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(o.id);
              }}
              className="hover:text-red-500"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setOpen(true);
            ensureLoaded();
          }}
          placeholder={selectedOptions.length ? '' : placeholder}
          className="flex-1 min-w-[80px] text-sm outline-none bg-transparent"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-zinc-100 bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-zinc-400">
              <Loader2 className="size-4 animate-spin" />
              Loading options…
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-zinc-400">
              {query ? 'No matches' : 'No options available'}
            </div>
          ) : (
            filtered.slice(0, 50).map((o) => (
              <button
                type="button"
                key={o.id}
                onClick={() => toggle(o.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 flex items-center gap-2"
              >
                <Search className="size-3.5 text-zinc-300" />
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}