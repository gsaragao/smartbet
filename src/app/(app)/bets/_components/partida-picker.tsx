'use client';

import * as React from 'react';
import { Check, ChevronDown, MapPin, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { buscarTimesAction } from '@/features/bets/actions';
import type { PartidaInput } from '@/features/bets/schema';
import { cn } from '@/lib/utils';

type LigaOption = { id: number; nome: string; esporte_id: number };

type Props = {
  value: PartidaInput;
  onChange: (value: PartidaInput) => void;
  esporte_id: number;
  ligas: LigaOption[];
  /** Exibe erros de validação por campo (mandante_nome, visitante_nome, inicio). */
  errors?: Partial<Record<'mandante_nome' | 'visitante_nome' | 'inicio', string>>;
};

type TimeResult = {
  id: number;
  nome: string;
  slug: string;
  esporte_id: number;
  pais_nome: string | null;
};

/**
 * PartidaPicker (modo híbrido).
 *
 * Em S1 todas as apostas nascem com `kind: 'new'` — criamos uma partida a
 * partir dos dados digitados. Isso simplifica o componente e cobre 90% do
 * uso real. Em S2 podemos estender para reusar `partida_id` quando o usuário
 * quiser vincular duas apostas ao mesmo jogo.
 */
export function PartidaPicker({ value, onChange, esporte_id, ligas, errors }: Props) {
  // Se por acaso vier um `existing` (edição), convertemos para 'new' editável.
  // Em S1 não expomos UI para vincular a uma partida existente.
  const partida =
    value.kind === 'new'
      ? value
      : {
          kind: 'new' as const,
          esporte_id,
          liga_id: null,
          time_mandante_id: null,
          time_visitante_id: null,
          mandante_nome: '',
          visitante_nome: '',
          inicio: '',
        };

  const setPartida = (patch: Partial<typeof partida>) => {
    onChange({ ...partida, ...patch, kind: 'new' });
  };

  const ligasDoEsporte = ligas.filter((l) => l.esporte_id === esporte_id);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TimeField
        label="Mandante"
        name="mandante"
        esporte_id={esporte_id}
        timeId={partida.time_mandante_id}
        nome={partida.mandante_nome}
        onSelectTime={(t) =>
          setPartida({ time_mandante_id: t.id, mandante_nome: t.nome })
        }
        onTypeFree={(nome) =>
          setPartida({ time_mandante_id: null, mandante_nome: nome })
        }
        onClear={() => setPartida({ time_mandante_id: null, mandante_nome: '' })}
        error={errors?.mandante_nome}
      />
      <TimeField
        label="Visitante"
        name="visitante"
        esporte_id={esporte_id}
        timeId={partida.time_visitante_id}
        nome={partida.visitante_nome}
        onSelectTime={(t) =>
          setPartida({ time_visitante_id: t.id, visitante_nome: t.nome })
        }
        onTypeFree={(nome) =>
          setPartida({ time_visitante_id: null, visitante_nome: nome })
        }
        onClear={() => setPartida({ time_visitante_id: null, visitante_nome: '' })}
        error={errors?.visitante_nome}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-foreground text-sm font-medium">Data e hora</label>
        <Input
          type="datetime-local"
          value={partida.inicio}
          onChange={(e) => setPartida({ inicio: e.target.value })}
          className="font-mono text-[13px] tabular-nums sm:text-sm"
          aria-invalid={Boolean(errors?.inicio)}
        />
        {errors?.inicio && (
          <p className="text-destructive text-xs">{errors.inicio}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-foreground text-sm font-medium">
          Liga <span className="text-muted-foreground">(opcional)</span>
        </label>
        <select
          value={partida.liga_id ?? ''}
          onChange={(e) =>
            setPartida({
              liga_id: e.target.value ? Number(e.target.value) : null,
            })
          }
          className={cn(
            'border-input bg-background text-foreground h-10 w-full rounded-md border px-3 text-sm',
            'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
          )}
        >
          <option value="">— sem liga —</option>
          {ligasDoEsporte.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimeField — autocomplete de time + fallback livre
// ---------------------------------------------------------------------------

function TimeField({
  label,
  name,
  esporte_id,
  timeId,
  nome,
  onSelectTime,
  onTypeFree,
  onClear,
  error,
}: {
  label: string;
  name: string;
  esporte_id: number;
  timeId: number | null;
  nome: string;
  onSelectTime: (t: TimeResult) => void;
  onTypeFree: (nome: string) => void;
  onClear: () => void;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [resultados, setResultados] = React.useState<TimeResult[]>([]);
  const [buscando, setBuscando] = React.useState(false);

  const debouncedSearch = React.useCallback(
    (q: string) => {
      if (q.trim().length < 2) {
        setResultados([]);
        return;
      }
      setBuscando(true);
      buscarTimesAction(q, esporte_id || undefined)
        .then((r) => setResultados(r))
        .catch(() => setResultados([]))
        .finally(() => setBuscando(false));
    },
    [esporte_id],
  );

  React.useEffect(() => {
    const handle = setTimeout(() => debouncedSearch(query), 220);
    return () => clearTimeout(handle);
  }, [query, debouncedSearch]);

  const temValor = nome.length > 0 || timeId != null;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-foreground text-sm font-medium" htmlFor={`tf-${name}`}>
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              id={`tf-${name}`}
              className={cn(
                'border-input bg-background text-foreground flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm shadow-xs transition-colors outline-none',
                'hover:border-input/80 focus-visible:ring-ring focus-visible:ring-2',
                error && 'border-destructive ring-2 ring-destructive/25',
              )}
              data-invalid={error ? 'true' : undefined}
            >
              <span className="flex flex-1 items-center gap-2 truncate text-left">
                {temValor ? (
                  <>
                    <span className="truncate">{nome}</span>
                    {timeId != null ? (
                      <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
                        catálogo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
                        texto livre
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">Buscar time ou digitar nome…</span>
                )}
              </span>
              {temValor ? (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                    setQuery('');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Limpar"
                >
                  <X className="size-4" />
                </span>
              ) : (
                <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
              )}
            </button>
          }
        />
        <PopoverContent className="w-[var(--radix-popover-trigger-width,320px)] min-w-[280px] p-0">
          <div className="border-b p-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite ao menos 2 letras…"
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim().length > 0 && resultados.length === 0) {
                  // Confirma texto livre
                  onTypeFree(query.trim());
                  setOpen(false);
                }
              }}
            />
          </div>
          <div className="max-h-64 overflow-auto p-1">
            {buscando && (
              <div className="text-muted-foreground px-3 py-4 text-center text-xs">
                Buscando…
              </div>
            )}
            {!buscando && query.trim().length < 2 && (
              <div className="text-muted-foreground px-3 py-4 text-center text-xs">
                Comece a digitar para buscar times do catálogo.
              </div>
            )}
            {!buscando &&
              query.trim().length >= 2 &&
              resultados.length === 0 && (
                <div className="space-y-2 px-3 py-3 text-center">
                  <p className="text-muted-foreground text-xs">
                    Nenhum time encontrado no catálogo.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onTypeFree(query.trim());
                      setOpen(false);
                    }}
                    className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium hover:opacity-90"
                  >
                    <MapPin className="size-3" />
                    Usar &ldquo;{query.trim()}&rdquo; como texto livre
                  </button>
                </div>
              )}
            {!buscando &&
              resultados.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelectTime(t);
                    setQuery('');
                    setOpen(false);
                  }}
                  className={cn(
                    'hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                    timeId === t.id && 'bg-accent/60',
                  )}
                >
                  <span className="flex size-4 items-center justify-center">
                    {timeId === t.id && <Check className="size-3" />}
                  </span>
                  <span className="flex-1 truncate">{t.nome}</span>
                  {t.pais_nome && (
                    <span className="text-muted-foreground text-xs">
                      {t.pais_nome}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
