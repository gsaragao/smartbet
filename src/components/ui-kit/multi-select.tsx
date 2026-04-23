'use client';

import { Check, ChevronDown, X } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type MultiSelectOption = {
  value: string;
  label: string;
  hint?: string;
  group?: string;
};

type Props = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
  /**
   * Se informado, filtra opções exibíveis dinamicamente (ex.: por esporte).
   */
  filter?: (opt: MultiSelectOption) => boolean;
  maxVisibleChips?: number;
  disabled?: boolean;
  className?: string;
};

/**
 * Multi-select minimalista construído sobre o Popover do Base UI.
 *
 * Não usamos `Command`/`cmdk` porque não está no stack. A busca é feita
 * client-side com um substring case-insensitive simples, que é suficiente
 * para as listas atuais (≤ 200 ligas, ≤ 30 tipos de aposta).
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione',
  emptyLabel = 'Nenhum resultado.',
  filter,
  maxVisibleChips = 3,
  disabled,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return options
      .filter((o) => (filter ? filter(o) : true))
      .filter((o) =>
        q === '' ? true : o.label.toLowerCase().includes(q),
      );
  }, [options, filter, query]);

  const selected = React.useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value],
  );

  function toggle(optValue: string) {
    const set = new Set(value);
    if (set.has(optValue)) set.delete(optValue);
    else set.add(optValue);
    onChange(Array.from(set));
  }

  function clear() {
    onChange([]);
  }

  const chips = selected.slice(0, maxVisibleChips);
  const extraCount = selected.length - chips.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'border-input bg-background text-foreground flex min-h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm shadow-xs transition-colors outline-none',
              'hover:border-input/80 focus-visible:ring-ring focus-visible:ring-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
          >
            <span className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <>
                  {chips.map((c) => (
                    <Badge
                      key={c.value}
                      variant="secondary"
                      className="gap-1 px-1.5 py-0 text-xs font-normal"
                    >
                      {c.label}
                      <span
                        role="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(c.value);
                        }}
                        className="hover:text-foreground text-muted-foreground -mr-0.5"
                        aria-label={`Remover ${c.label}`}
                      >
                        <X className="size-3" />
                      </span>
                    </Badge>
                  ))}
                  {extraCount > 0 && (
                    <Badge variant="outline" className="px-1.5 py-0 text-xs">
                      +{extraCount}
                    </Badge>
                  )}
                </>
              )}
            </span>
            <ChevronDown
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden
            />
          </button>
        }
      />

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        /* Portal no body: evita clipping do overflow do Dialog. */
        container={typeof document !== 'undefined' ? document.body : undefined}
        className="w-[min(100vw-2rem,22rem)] min-w-[260px] max-w-[min(100vw-2rem,24rem)] p-0"
      >
        <div className="border-b p-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="h-8 text-sm"
          />
        </div>
        <div className="max-h-64 overflow-auto p-1">
          {visible.length === 0 ? (
            <div className="text-muted-foreground px-3 py-6 text-center text-xs">
              {emptyLabel}
            </div>
          ) : (
            visible.map((o) => {
              const checked = value.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className={cn(
                    'hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                    checked && 'bg-accent/60',
                  )}
                >
                  <span
                    className={cn(
                      'border-input flex size-4 items-center justify-center rounded-sm border',
                      checked && 'bg-primary border-primary text-primary-foreground',
                    )}
                  >
                    {checked && <Check className="size-3" />}
                  </span>
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.hint && (
                    <span className="text-muted-foreground text-xs">{o.hint}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t p-2">
            <button
              type="button"
              onClick={clear}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Limpar seleção
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
