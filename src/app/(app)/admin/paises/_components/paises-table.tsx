'use client';

import * as React from 'react';
import { Loader2, MoreHorizontal, Pencil, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { excluirPais } from '@/features/admin/paises/actions';
import type { PaisListItem } from '@/features/admin/paises/queries';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Bandeira } from './bandeira';
import { PaisDialog } from './pais-dialog';

type Props = {
  paises: PaisListItem[];
};

/**
 * Prioridade contextual: Brasil no topo. É uma sportsbook voltada ao
 * mercado brasileiro — o país mais relevante não pode aparecer no meio
 * de uma lista alfabética genérica. Depois dele, ordem alfabética normal
 * pra previsibilidade.
 */
function ordenarPaises(paises: PaisListItem[]): PaisListItem[] {
  return [...paises].sort((a, b) => {
    if (a.codigo_iso === 'BR') return -1;
    if (b.codigo_iso === 'BR') return 1;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
}

export function PaisesTable({ paises }: Props) {
  const [search, setSearch] = React.useState('');

  const ordenados = React.useMemo(() => ordenarPaises(paises), [paises]);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ordenados;
    return ordenados.filter(
      (p) =>
        p.nome.toLowerCase().includes(term) ||
        p.codigo_iso.toLowerCase().includes(term),
    );
  }, [ordenados, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full sm:max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou código ISO"
          className="pl-9"
        />
      </div>

      <div className="border-border/60 bg-card overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[52px]" aria-label="Bandeira" />
              <TableHead>País</TableHead>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead className="w-[100px] text-right">Ligas</TableHead>
              <TableHead className="w-[100px] text-right">Times</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground h-24 text-center text-sm"
                >
                  Nenhum país corresponde à busca.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((pais) => <PaisRow key={pais.id} pais={pais} />)
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-muted-foreground text-xs">
        Mostrando <span className="text-foreground font-medium">{filtered.length}</span> de{' '}
        <span className="text-foreground font-medium">{paises.length}</span>{' '}
        {paises.length === 1 ? 'país' : 'países'} cadastrados.
      </p>
    </div>
  );
}

function PaisRow({ pais }: { pais: PaisListItem }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletePending, startDeleteTransition] = React.useTransition();

  const hasVinculos = pais.ligas_total > 0 || pais.times_total > 0;

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await excluirPais(pais.id);
      if (result.ok) {
        toast.success('País excluído.');
        setDeleteOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <TableRow className="group">
      <TableCell className="py-3">
        <Bandeira codigoIso={pais.codigo_iso} size="md" />
      </TableCell>
      <TableCell>
        <span className="text-foreground font-medium">{pais.nome}</span>
      </TableCell>
      <TableCell>
        <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[11px] tracking-wider uppercase">
          {pais.codigo_iso}
        </code>
      </TableCell>
      <TableCell className="text-right">
        {pais.ligas_total > 0 ? (
          <Badge variant="outline" className="font-mono text-xs tabular-nums">
            {pais.ligas_total}
          </Badge>
        ) : (
          // Célula em branco em vez do travessão "—": menos ruído visual quando
          // a coluna inteira está zerada (fase MVP). O zero está implícito.
          <span className="sr-only">Sem ligas</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {pais.times_total > 0 ? (
          <Badge variant="outline" className="font-mono text-xs tabular-nums">
            {pais.times_total}
          </Badge>
        ) : (
          <span className="sr-only">Sem times</span>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Abrir ações">
                {deletePending ? (
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
              disabled={hasVinculos}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <PaisDialog
          mode="edit"
          open={editOpen}
          onOpenChange={setEditOpen}
          pais={pais}
        />

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir “{pais.nome}”?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é permanente. O país só pode ser excluído se não houver ligas
                ou times vinculados.
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
      </TableCell>
    </TableRow>
  );
}
