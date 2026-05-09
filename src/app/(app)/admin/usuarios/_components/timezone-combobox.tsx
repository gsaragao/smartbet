'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getTimeZoneOptionsWithValue } from '@/lib/timezones';

const MAX_VISIBLE = 120;

function shortOffsetLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

type Props = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  /** Reflect react-hook-form invalid state on trigger. */
  invalid?: boolean;
};

export function TimezoneCombobox({ id, value, onValueChange, disabled, invalid }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const sortedIds = React.useMemo(
    () => [...new Set(getTimeZoneOptionsWithValue(value))].sort((a, b) => a.localeCompare(b, 'en')),
    [value],
  );

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      queueMicrotask(() => setQuery(''));
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = React.useMemo(() => {
    if (!q) return sortedIds;
    return sortedIds.filter((tz) => tz.toLowerCase().includes(q));
  }, [sortedIds, q]);

  const truncated = filtered.length > MAX_VISIBLE ? filtered.slice(0, MAX_VISIBLE) : filtered;
  const hadTruncate = filtered.length > MAX_VISIBLE;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              'border-input bg-background text-foreground flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm shadow-xs transition-colors outline-none',
              'hover:border-input/80 focus-visible:ring-ring focus-visible:ring-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              invalid && 'border-destructive ring-destructive/25 ring-2',
            )}
            data-invalid={invalid ? 'true' : undefined}
            aria-expanded={open}
          >
            <span className="min-w-0 flex-1 truncate text-left font-mono text-xs">
              {value ? (
                <span className="text-foreground">{value}</span>
              ) : (
                <span className="text-muted-foreground">Selecione um fuso…</span>
              )}
            </span>
            <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
          </button>
        }
      />
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        container={typeof document !== 'undefined' ? document.body : undefined}
        className="w-[min(100vw-2rem,22rem)] max-w-[min(100vw-2rem,24rem)] min-w-[260px] p-0"
      >
        <div className="border-border border-b p-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cidade ou região…"
            className="h-8 text-sm"
          />
        </div>
        <div className="max-h-64 overflow-auto p-1">
          {truncated.length === 0 ? (
            <div className="text-muted-foreground px-3 py-6 text-center text-xs">
              Nenhum fuso corresponde à busca.
            </div>
          ) : (
            <>
              {hadTruncate ? (
                <p className="text-muted-foreground px-2 py-1.5 text-[11px] leading-snug">
                  Mostrando os primeiros {MAX_VISIBLE} resultados. Refine a pesquisa.
                </p>
              ) : null}
              {truncated.map((tz) => {
                const off = shortOffsetLabel(tz);
                const active = tz === value;
                return (
                  <button
                    key={tz}
                    type="button"
                    onClick={() => {
                      onValueChange(tz);
                      setOpen(false);
                    }}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground flex w-full flex-col items-start gap-0.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                      active && 'bg-accent/70',
                    )}
                  >
                    <span className="w-full truncate font-mono text-xs">{tz}</span>
                    {off ? (
                      <span className="text-muted-foreground text-[10px] leading-none">{off}</span>
                    ) : null}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
