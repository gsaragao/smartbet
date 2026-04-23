'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  FolderOpen,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  alternarAtivoTipoAposta,
  excluirTipoAposta,
} from '@/features/admin/tipos-aposta/actions';
import type {
  EsporteOption,
  TipoApostaListItem,
} from '@/features/admin/tipos-aposta/queries';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { TipoApostaDialog } from './tipo-aposta-dialog';

type Props = {
  tipos: TipoApostaListItem[];
  esportes: EsporteOption[];
};

type StatusFilter = 'all' | 'ativo' | 'inativo';

type Grupo = {
  categoria: string;
  tipos: TipoApostaListItem[];
  ativos: number;
  total: number;
};

/**
 * Agrupa por categoria e ordena por volume (categorias com mais tipos no topo —
 * são as mais "relevantes"). Dentro do grupo, ordem alfabética pra
 * previsibilidade ao buscar um tipo específico.
 */
function agruparPorCategoria(tipos: TipoApostaListItem[]): Grupo[] {
  const mapa = new Map<string, TipoApostaListItem[]>();
  for (const t of tipos) {
    const existentes = mapa.get(t.categoria);
    if (existentes) existentes.push(t);
    else mapa.set(t.categoria, [t]);
  }
  return Array.from(mapa.entries())
    .map(([categoria, lista]) => ({
      categoria,
      tipos: lista.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
      ativos: lista.filter((t) => t.ativo).length,
      total: lista.length,
    }))
    .sort((a, b) => {
      if (a.total !== b.total) return b.total - a.total;
      return a.categoria.localeCompare(b.categoria, 'pt-BR');
    });
}

export function TiposApostaCatalog({ tipos, esportes }: Props) {
  const searchParams = useSearchParams();
  const initialEsporte = searchParams.get('esporte') ?? 'all';

  const [search, setSearch] = React.useState('');
  const [esporteFilter, setEsporteFilter] = React.useState<string>(initialEsporte);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return tipos.filter((t) => {
      if (esporteFilter !== 'all' && String(t.esporte_id) !== esporteFilter) return false;
      if (statusFilter === 'ativo' && !t.ativo) return false;
      if (statusFilter === 'inativo' && t.ativo) return false;
      if (!term) return true;
      return (
        t.nome.toLowerCase().includes(term) ||
        t.categoria.toLowerCase().includes(term) ||
        t.slug.toLowerCase().includes(term) ||
        (t.descricao ?? '').toLowerCase().includes(term)
      );
    });
  }, [tipos, search, esporteFilter, statusFilter]);

  const grupos = React.useMemo(() => agruparPorCategoria(filtered), [filtered]);

  // Durante busca ativa, expandir tudo automaticamente — o usuário quer ver
  // o que matched, não caçar atrás de setinhas. Esse é um detalhe UX que
  // faz a busca "sentir" ao vivo.
  const forceOpenAll = search.trim().length > 0;

  const hasActiveFilters =
    search.trim().length > 0 || esporteFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setEsporteFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="flex flex-col gap-4">
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        esporteFilter={esporteFilter}
        onEsporteChange={setEsporteFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        esportes={esportes}
      />

      {grupos.length === 0 ? (
        <EmptyResults hasFilters={hasActiveFilters} onClear={clearFilters} />
      ) : (
        <div className="flex flex-col gap-3">
          {grupos.map((grupo) => (
            <CategoriaGroup
              key={grupo.categoria}
              grupo={grupo}
              esportes={esportes}
              forceOpen={forceOpenAll}
            />
          ))}
        </div>
      )}

      <Footer total={tipos.length} filtered={filtered.length} />
    </div>
  );
}

function Toolbar({
  search,
  onSearchChange,
  esporteFilter,
  onEsporteChange,
  statusFilter,
  onStatusChange,
  esportes,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  esporteFilter: string;
  onEsporteChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  esportes: EsporteOption[];
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome, categoria ou descrição"
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

      <div className="flex items-center gap-2">
        <Select value={esporteFilter} onValueChange={(v) => onEsporteChange(v ?? 'all')}>
          <SelectTrigger className="w-[200px]">
            <span className="text-muted-foreground mr-1 text-xs">Esporte:</span>
            <SelectValue>
              {(value: string) =>
                value === 'all'
                  ? 'Todos'
                  : (esportes.find((e) => String(e.id) === value)?.nome ?? 'Todos')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os esportes</SelectItem>
            {esportes.map((e) => (
              <SelectItem key={e.id} value={String(e.id)}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusChange((v ?? 'all') as StatusFilter)}
        >
          <SelectTrigger className="w-[170px]">
            <span className="text-muted-foreground mr-1 text-xs">Status:</span>
            <SelectValue>
              {(value: string) =>
                value === 'ativo' ? 'Ativos' : value === 'inativo' ? 'Inativos' : 'Todos'
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CategoriaGroup({
  grupo,
  esportes,
  forceOpen,
}: {
  grupo: Grupo;
  esportes: EsporteOption[];
  forceOpen: boolean;
}) {
  // <details> gerencia o estado ABERTO/FECHADO nativamente (teclado, ARIA),
  // mas quando o usuário começa uma busca queremos abrir todos à força. Para
  // isso usamos uma ref e sincronizamos `open` — é o jeito idiomático sem
  // controlar totalmente o elemento.
  const detailsRef = React.useRef<HTMLDetailsElement | null>(null);
  React.useEffect(() => {
    if (forceOpen && detailsRef.current && !detailsRef.current.open) {
      detailsRef.current.open = true;
    }
  }, [forceOpen]);

  const temInativos = grupo.ativos < grupo.total;

  return (
    <details
      ref={detailsRef}
      open
      className={cn(
        'group/cat border-border/60 bg-card overflow-hidden rounded-xl border',
        'transition-colors',
      )}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-3 px-4 py-3',
          'hover:bg-muted/40 transition-colors',
          // Remove o disclosure triangle padrão em Webkit/Firefox; desenhamos
          // a seta com Lucide pra ficar consistente com o design system.
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <ChevronDown
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform duration-200',
            'group-open/cat:rotate-0 -rotate-90',
          )}
          aria-hidden="true"
        />
        <FolderOpen className="text-primary/80 size-4 shrink-0" aria-hidden="true" />
        <h3 className="text-foreground font-heading text-sm font-semibold tracking-tight">
          {grupo.categoria}
        </h3>
        <Badge variant="outline" className="h-5 px-1.5 font-mono text-[10px] tabular-nums">
          {grupo.total}
        </Badge>
        {temInativos && (
          <span className="text-muted-foreground text-xs">
            <span className="text-foreground font-medium tabular-nums">{grupo.ativos}</span>
            <span className="text-muted-foreground/70"> / {grupo.total} ativos</span>
          </span>
        )}
      </summary>

      <ul className="divide-border/40 border-border/40 divide-y border-t">
        {grupo.tipos.map((tipo) => (
          <TipoRow key={tipo.id} tipo={tipo} esportes={esportes} />
        ))}
      </ul>
    </details>
  );
}

function TipoRow({
  tipo,
  esportes,
}: {
  tipo: TipoApostaListItem;
  esportes: EsporteOption[];
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [togglePending, startToggleTransition] = React.useTransition();
  const [deletePending, startDeleteTransition] = React.useTransition();

  const handleToggle = (checked: boolean) => {
    startToggleTransition(async () => {
      const result = await alternarAtivoTipoAposta(tipo.id, checked);
      if (result.ok) {
        toast.success(checked ? 'Tipo ativado.' : 'Tipo desativado.');
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await excluirTipoAposta(tipo.id);
      if (result.ok) {
        toast.success('Tipo excluído.');
        setDeleteOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <li
      className={cn(
        'group/row flex items-center gap-3 px-4 py-2.5 transition-colors',
        'hover:bg-muted/30',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-foreground truncate text-sm font-medium',
              !tipo.ativo && 'text-muted-foreground line-through decoration-from-font',
            )}
            // slug aparece como tooltip nativo no hover — zero JS, acessível,
            // e não polui a UI com informação técnica que 95% do tempo ninguém lê.
            title={`Slug: ${tipo.slug}`}
          >
            {tipo.nome}
          </span>
          {!tipo.ativo && (
            <Badge
              variant="outline"
              className="text-muted-foreground h-4 px-1 text-[9px] font-medium tracking-wide uppercase"
            >
              Inativo
            </Badge>
          )}
        </div>
        {tipo.descricao && (
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
            {tipo.descricao}
          </p>
        )}
      </div>

      <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline">
        {tipo.esporte_nome}
      </span>

      <Switch
        checked={tipo.ativo}
        onCheckedChange={handleToggle}
        disabled={togglePending}
        aria-label={tipo.ativo ? `Desativar ${tipo.nome}` : `Ativar ${tipo.nome}`}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Ações de ${tipo.nome}`}
              className="opacity-60 transition-opacity group-hover/row:opacity-100"
            >
              <MoreHorizontal className="size-4" />
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

      <TipoApostaDialog
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        tipo={tipo}
        esportes={esportes}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{tipo.nome}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Se este tipo já está em uso por estratégias
              ou apostas, prefira apenas desativá-lo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePending}
            >
              {deletePending && <Loader2 className="size-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

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
      <p className="text-foreground text-sm font-medium">Nenhum tipo encontrado</p>
      <p className="text-muted-foreground -mt-2 text-xs">
        {hasFilters
          ? 'Tente ajustar os filtros ou termos de busca.'
          : 'Cadastre o primeiro mercado com o botão “Novo tipo”.'}
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
        <span className="text-foreground font-medium">{total}</span> tipos no catálogo.
      </p>
    );
  }
  return (
    <p className="text-muted-foreground text-xs">
      Exibindo <span className="text-foreground font-medium">{filtered}</span> de{' '}
      <span className="text-foreground font-medium">{total}</span> tipos após os filtros.
    </p>
  );
}
