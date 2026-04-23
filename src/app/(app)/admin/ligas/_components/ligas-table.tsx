'use client';

import * as React from 'react';
import { Loader2, MoreHorizontal, Pencil, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  alternarAtivoLiga,
  excluirLiga,
} from '@/features/admin/ligas/actions';
import type {
  EsporteOpcao,
  LigaListItem,
  PaisOpcao,
} from '@/features/admin/ligas/queries';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Bandeira } from '../../paises/_components/bandeira';
import { LigaDialog } from './liga-dialog';

const TODOS = '__todos__';
const INTERNACIONAL = '__internacional__';

type Props = {
  ligas: LigaListItem[];
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
};

export function LigasTable({ ligas, esportes, paises }: Props) {
  const [search, setSearch] = React.useState('');
  const [esporteFilter, setEsporteFilter] = React.useState(TODOS);
  const [paisFilter, setPaisFilter] = React.useState(TODOS);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return ligas.filter((l) => {
      if (esporteFilter !== TODOS && String(l.esporte.id) !== esporteFilter) return false;
      if (paisFilter === INTERNACIONAL && l.pais != null) return false;
      if (paisFilter !== TODOS && paisFilter !== INTERNACIONAL) {
        if (!l.pais || String(l.pais.id) !== paisFilter) return false;
      }
      if (term) {
        const haystack = `${l.nome} ${l.slug} ${l.pais?.nome ?? ''} ${
          l.temporada ?? ''
        }`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [ligas, search, esporteFilter, paisFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px_200px]">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, slug ou temporada"
            className="pl-9"
          />
        </div>

        <Select
          value={esporteFilter}
          onValueChange={(v) => setEsporteFilter(v ?? TODOS)}
          items={[
            { value: TODOS, label: 'Todos os esportes' },
            ...esportes.map((e) => ({ value: String(e.id), label: e.nome })),
          ]}
        >
          <SelectTrigger>
            <SelectValue>
              {(value: string) => {
                if (value === TODOS) return 'Todos os esportes';
                return (
                  esportes.find((e) => String(e.id) === value)?.nome ?? 'Esporte'
                );
              }}
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

        <Select
          value={paisFilter}
          onValueChange={(v) => setPaisFilter(v ?? TODOS)}
          items={[
            { value: TODOS, label: 'Todos os países' },
            { value: INTERNACIONAL, label: 'Internacional' },
            ...paises.map((p) => ({ value: String(p.id), label: p.nome })),
          ]}
        >
          <SelectTrigger>
            <SelectValue>
              {(value: string) => {
                if (value === TODOS) return 'Todos os países';
                if (value === INTERNACIONAL) return 'Internacional';
                return paises.find((p) => String(p.id) === value)?.nome ?? 'País';
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os países</SelectItem>
            <SelectItem value={INTERNACIONAL}>Internacional</SelectItem>
            {paises.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-border/60 bg-card overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[60px]">País</TableHead>
              <TableHead>Liga</TableHead>
              <TableHead className="w-[140px]">Esporte</TableHead>
              <TableHead className="w-[110px]">Temporada</TableHead>
              <TableHead className="w-[100px] text-center">Partidas</TableHead>
              <TableHead className="w-[80px] text-center">Ativa</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground h-24 text-center text-sm"
                >
                  Nenhuma liga corresponde aos filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((liga) => (
                <LigaRow
                  key={liga.id}
                  liga={liga}
                  esportes={esportes}
                  paises={paises}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-muted-foreground text-xs">
        Mostrando <span className="text-foreground font-medium">{filtered.length}</span> de{' '}
        <span className="text-foreground font-medium">{ligas.length}</span> ligas cadastradas.
      </p>
    </div>
  );
}

function LigaRow({
  liga,
  esportes,
  paises,
}: {
  liga: LigaListItem;
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const handleToggleAtivo = (checked: boolean) => {
    startTransition(async () => {
      const result = await alternarAtivoLiga(liga.id, checked);
      if (result.ok) {
        toast.success(checked ? 'Liga ativada.' : 'Liga desativada.');
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await excluirLiga(liga.id);
      if (result.ok) {
        toast.success('Liga excluída.');
        setDeleteOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <TableRow className={liga.ativo ? undefined : 'opacity-60'}>
      <TableCell className="py-3">
        {liga.pais ? (
          <Bandeira codigoIso={liga.pais.codigo_iso} size="md" />
        ) : (
          <Badge
            variant="outline"
            className="h-[18px] w-6 justify-center px-0 text-[9px] font-semibold tracking-wider uppercase"
            aria-label="Competição internacional"
          >
            Int
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{liga.nome}</span>
          <code className="text-muted-foreground font-mono text-[11px]">
            {liga.slug}
          </code>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="font-normal capitalize">
          {liga.esporte.nome}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs tabular-nums">
        {liga.temporada ?? (
          <span className="text-muted-foreground/50">Sem temporada</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {liga.partidas_total > 0 ? (
          <Badge variant="outline" className="font-mono text-xs tabular-nums">
            {liga.partidas_total}
          </Badge>
        ) : (
          <span className="sr-only">Sem partidas registradas</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={liga.ativo}
          onCheckedChange={handleToggleAtivo}
          disabled={pending}
          aria-label={liga.ativo ? 'Desativar liga' : 'Ativar liga'}
        />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Abrir ações">
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
              disabled={liga.partidas_total > 0}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <LigaDialog
          mode="edit"
          liga={liga}
          esportes={esportes}
          paises={paises}
          open={editOpen}
          onOpenChange={setEditOpen}
        />

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir “{liga.nome}”?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é permanente. A liga só pode ser excluída se não houver
                partidas vinculadas.
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
      </TableCell>
    </TableRow>
  );
}
