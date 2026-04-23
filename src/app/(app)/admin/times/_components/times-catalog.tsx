'use client';

import * as React from 'react';
import {
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { excluirTime } from '@/features/admin/times/actions';
import type {
  EsporteOpcao,
  PaisOpcao,
  TimeListItem,
} from '@/features/admin/times/queries';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { Bandeira } from '../../paises/_components/bandeira';
import { Escudo } from './escudo';
import { TimeDialog } from './time-dialog';

const TODOS = '__todos__';
const SEM_PAIS = '__sem_pais__';

type ViewMode = 'grouped' | 'flat';

type Props = {
  times: TimeListItem[];
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
};

/**
 * Grupo por país para o modo agrupado. Brasil vai sempre primeiro
 * (alinha com a ordenação de /admin/paises), depois ordem decrescente
 * de volume, depois alfabético.
 */
type Grupo = {
  chave: string;
  paisNome: string;
  codigoIso: string | null;
  times: TimeListItem[];
  semEscudo: number;
};

function agruparPorPais(times: TimeListItem[]): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const t of times) {
    const chave = t.pais?.codigo_iso ?? SEM_PAIS;
    const existente = mapa.get(chave);
    if (existente) {
      existente.times.push(t);
      if (!t.escudo_url) existente.semEscudo += 1;
    } else {
      mapa.set(chave, {
        chave,
        paisNome: t.pais?.nome ?? 'Sem país',
        codigoIso: t.pais?.codigo_iso ?? null,
        times: [t],
        semEscudo: t.escudo_url ? 0 : 1,
      });
    }
  }
  return Array.from(mapa.values()).sort((a, b) => {
    // Brasil sempre primeiro — coerente com /admin/paises.
    if (a.codigoIso === 'BR') return -1;
    if (b.codigoIso === 'BR') return 1;
    // Sem país vai pro fim — são exceções.
    if (a.chave === SEM_PAIS) return 1;
    if (b.chave === SEM_PAIS) return -1;
    // Depois: mais populados primeiro, empate por nome.
    if (a.times.length !== b.times.length) {
      return b.times.length - a.times.length;
    }
    return a.paisNome.localeCompare(b.paisNome, 'pt-BR');
  });
}

export function TimesCatalog({ times, esportes, paises }: Props) {
  const [search, setSearch] = React.useState('');
  const [esporteFilter, setEsporteFilter] = React.useState(TODOS);
  const [paisFilter, setPaisFilter] = React.useState(TODOS);
  const [view, setView] = React.useState<ViewMode>('grouped');

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return times.filter((t) => {
      if (esporteFilter !== TODOS && String(t.esporte.id) !== esporteFilter) {
        return false;
      }
      if (paisFilter === SEM_PAIS && t.pais != null) return false;
      if (paisFilter !== TODOS && paisFilter !== SEM_PAIS) {
        if (!t.pais || String(t.pais.id) !== paisFilter) return false;
      }
      if (!term) return true;
      const haystack = `${t.nome} ${t.slug} ${t.pais?.nome ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [times, search, esporteFilter, paisFilter]);

  // Na busca, queremos todos os grupos expandidos — o usuário quer VER
  // o que matched, não caçar atrás de setinhas. Mesmo padrão de tipos-aposta.
  const forceOpenAll = search.trim().length > 0;

  const hasActiveFilters =
    search.trim().length > 0 || esporteFilter !== TODOS || paisFilter !== TODOS;

  const clearFilters = () => {
    setSearch('');
    setEsporteFilter(TODOS);
    setPaisFilter(TODOS);
  };

  // Se só existe 1 esporte distinto no catálogo, esconder o filtro e a
  // coluna correspondente — é redundância pura. Voltará a aparecer quando
  // o admin cadastrar outro esporte.
  const esportesUnicos = React.useMemo(
    () => new Set(times.map((t) => t.esporte.id)).size,
    [times],
  );
  const showEsporteFilter = esportesUnicos > 1;

  return (
    <div className="flex flex-col gap-4">
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        esporteFilter={esporteFilter}
        onEsporteChange={setEsporteFilter}
        paisFilter={paisFilter}
        onPaisChange={setPaisFilter}
        esportes={esportes}
        paises={paises}
        view={view}
        onViewChange={setView}
        showEsporteFilter={showEsporteFilter}
      />

      {filtered.length === 0 ? (
        <EmptyResults hasFilters={hasActiveFilters} onClear={clearFilters} />
      ) : view === 'grouped' ? (
        <GroupedView
          times={filtered}
          esportes={esportes}
          paises={paises}
          forceOpenAll={forceOpenAll}
          showEsporte={esportesUnicos > 1}
        />
      ) : (
        <FlatView
          times={filtered}
          esportes={esportes}
          paises={paises}
          showEsporte={esportesUnicos > 1}
        />
      )}

      <Footer total={times.length} filtered={filtered.length} />
    </div>
  );
}

// ─── Toolbar ────────────────────────────────────────────────────────────────

function Toolbar({
  search,
  onSearchChange,
  esporteFilter,
  onEsporteChange,
  paisFilter,
  onPaisChange,
  esportes,
  paises,
  view,
  onViewChange,
  showEsporteFilter,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  esporteFilter: string;
  onEsporteChange: (v: string) => void;
  paisFilter: string;
  onPaisChange: (v: string) => void;
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  showEsporteFilter: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:max-w-sm sm:flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome, slug ou país"
          className="pl-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Limpar busca"
            className="hover:bg-muted text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showEsporteFilter && (
          <Select
            value={esporteFilter}
            onValueChange={(v) => onEsporteChange(v ?? TODOS)}
          >
            <SelectTrigger className="w-[180px]">
              <span className="text-muted-foreground mr-1 text-xs">Esporte:</span>
              <SelectValue>
                {(value: string) =>
                  value === TODOS
                    ? 'Todos'
                    : (esportes.find((e) => String(e.id) === value)?.nome ?? 'Todos')
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os esportes</SelectItem>
              {esportes.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={paisFilter} onValueChange={(v) => onPaisChange(v ?? TODOS)}>
          <SelectTrigger className="w-[180px]">
            <span className="text-muted-foreground mr-1 text-xs">País:</span>
            <SelectValue>
              {(value: string) => {
                if (value === TODOS) return 'Todos';
                if (value === SEM_PAIS) return 'Sem país';
                return paises.find((p) => String(p.id) === value)?.nome ?? 'País';
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os países</SelectItem>
            <SelectItem value={SEM_PAIS}>Sem país</SelectItem>
            {paises.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Segmented control pro modo de visualização. Compact, claro, padrão
            de iOS/macOS/GitHub — zero cognição necessária. */}
        <div
          role="group"
          aria-label="Modo de visualização"
          className="border-border bg-muted/40 inline-flex h-9 items-center rounded-lg border p-0.5"
        >
          <ViewModeButton
            active={view === 'grouped'}
            onClick={() => onViewChange('grouped')}
            label="Por país"
          />
          <ViewModeButton
            active={view === 'flat'}
            onClick={() => onViewChange('flat')}
            label="Lista"
          />
        </div>
      </div>
    </div>
  );
}

function ViewModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-7 rounded-md px-3 text-xs font-medium transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

// ─── Grouped view ───────────────────────────────────────────────────────────

function GroupedView({
  times,
  esportes,
  paises,
  forceOpenAll,
  showEsporte,
}: {
  times: TimeListItem[];
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
  forceOpenAll: boolean;
  showEsporte: boolean;
}) {
  const grupos = React.useMemo(() => agruparPorPais(times), [times]);

  return (
    <div className="flex flex-col gap-3">
      {grupos.map((grupo) => (
        <PaisGroup
          key={grupo.chave}
          grupo={grupo}
          esportes={esportes}
          paises={paises}
          forceOpen={forceOpenAll}
          showEsporte={showEsporte}
        />
      ))}
    </div>
  );
}

function PaisGroup({
  grupo,
  esportes,
  paises,
  forceOpen,
  showEsporte,
}: {
  grupo: Grupo;
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
  forceOpen: boolean;
  showEsporte: boolean;
}) {
  // <details> controla nativamente abertura/teclado/ARIA. Quando o usuário
  // começa a buscar queremos TODOS abertos — sincronizamos via ref.
  const detailsRef = React.useRef<HTMLDetailsElement | null>(null);
  React.useEffect(() => {
    if (forceOpen && detailsRef.current && !detailsRef.current.open) {
      detailsRef.current.open = true;
    }
  }, [forceOpen]);

  return (
    <details
      ref={detailsRef}
      open
      className="group/pais border-border/60 bg-card overflow-hidden rounded-xl border"
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-3 px-4 py-3',
          'hover:bg-muted/40 transition-colors',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <ChevronDown
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform duration-200',
            'group-open/pais:rotate-0 -rotate-90',
          )}
          aria-hidden="true"
        />
        {grupo.codigoIso ? (
          <Bandeira codigoIso={grupo.codigoIso} size="md" />
        ) : (
          <span className="bg-muted/60 text-muted-foreground/70 inline-flex h-[18px] w-6 items-center justify-center rounded-[2px] text-[9px] font-semibold uppercase">
            ?
          </span>
        )}
        <h3 className="text-foreground font-heading text-sm font-semibold tracking-tight">
          {grupo.paisNome}
        </h3>
        <Badge variant="outline" className="h-5 px-1.5 font-mono text-[10px] tabular-nums">
          {grupo.times.length}
        </Badge>
        {grupo.semEscudo > 0 && (
          <span className="text-muted-foreground text-xs">
            <span className="text-foreground/80 tabular-nums">{grupo.semEscudo}</span>{' '}
            sem escudo
          </span>
        )}
      </summary>

      <ul className="divide-border/40 border-border/40 divide-y border-t">
        {grupo.times.map((time) => (
          <TimeRow
            key={time.id}
            time={time}
            esportes={esportes}
            paises={paises}
            showEsporte={showEsporte}
            showBandeira={false}
          />
        ))}
      </ul>
    </details>
  );
}

// ─── Flat view ──────────────────────────────────────────────────────────────

function FlatView({
  times,
  esportes,
  paises,
  showEsporte,
}: {
  times: TimeListItem[];
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
  showEsporte: boolean;
}) {
  return (
    <div className="border-border/60 bg-card overflow-hidden rounded-xl border">
      <ul className="divide-border/40 divide-y">
        {times.map((time) => (
          <TimeRow
            key={time.id}
            time={time}
            esportes={esportes}
            paises={paises}
            showEsporte={showEsporte}
            showBandeira
          />
        ))}
      </ul>
    </div>
  );
}

// ─── Linha ──────────────────────────────────────────────────────────────────

function TimeRow({
  time,
  esportes,
  paises,
  showEsporte,
  showBandeira,
}: {
  time: TimeListItem;
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
  showEsporte: boolean;
  showBandeira: boolean;
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await excluirTime(time.id);
      if (result.ok) {
        toast.success('Time excluído.');
        setDeleteOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <li className="group/row flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30">
      <Escudo url={time.escudo_url} alt={time.nome} size={32} />

      <div className="min-w-0 flex-1">
        <span
          className="text-foreground truncate text-sm font-medium"
          title={`Slug: ${time.slug}`}
        >
          {time.nome}
        </span>
      </div>

      {showBandeira && time.pais && (
        <Bandeira codigoIso={time.pais.codigo_iso} size="md" />
      )}
      {showBandeira && !time.pais && (
        <span className="text-muted-foreground/60 text-[10px] font-semibold tracking-wider uppercase">
          —
        </span>
      )}

      {showEsporte && (
        <Badge variant="secondary" className="font-normal capitalize">
          {time.esporte.nome}
        </Badge>
      )}

      {time.partidas_total > 0 && (
        <Badge variant="outline" className="font-mono text-xs tabular-nums">
          {time.partidas_total}{' '}
          <span className="text-muted-foreground ml-0.5 font-sans font-normal">
            {time.partidas_total === 1 ? 'partida' : 'partidas'}
          </span>
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Ações de ${time.nome}`}
              className="opacity-60 transition-opacity group-hover/row:opacity-100"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MoreHorizontal className="size-4" />
              )}
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TimeDialog
        mode="edit"
        time={time}
        esportes={esportes}
        paises={paises}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{time.nome}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente.{' '}
              {time.partidas_total > 0
                ? `O time aparece em ${time.partidas_total} partida(s); os registros permanecerão, mas sem vínculo com este time.`
                : 'O time não aparece em nenhuma partida registrada.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

// ─── Empty & Footer ─────────────────────────────────────────────────────────

function EmptyResults({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="border-border/70 bg-muted/20 flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
        <Search className="size-4" aria-hidden="true" />
      </div>
      <p className="text-foreground text-sm font-medium">Nenhum time encontrado</p>
      <p className="text-muted-foreground -mt-2 text-xs">
        {hasFilters
          ? 'Tente ajustar os filtros ou o termo de busca.'
          : 'Cadastre o primeiro time com o botão “Novo time”.'}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

function Footer({ total, filtered }: { total: number; filtered: number }) {
  if (filtered === total) {
    return (
      <p className="text-muted-foreground text-xs">
        <span className="text-foreground font-medium">{total}</span> times no catálogo.
      </p>
    );
  }
  return (
    <p className="text-muted-foreground text-xs">
      Exibindo <span className="text-foreground font-medium">{filtered}</span> de{' '}
      <span className="text-foreground font-medium">{total}</span> times após os filtros.
    </p>
  );
}
