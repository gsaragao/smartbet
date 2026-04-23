'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  ListChecks,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  alternarAtivoEsporte,
  excluirEsporte,
} from '@/features/admin/esportes/actions';
import type { EsporteListItem } from '@/features/admin/esportes/queries';
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

import { EsporteDialog } from './esporte-dialog';
import { EsporteIcon } from './esporte-icon';

type Props = {
  esportes: EsporteListItem[];
};

type StatusFilter = 'all' | 'ativo' | 'inativo';

export function EsportesGrid({ esportes }: Props) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return esportes
      .filter((e) => {
        if (statusFilter === 'ativo' && !e.ativo) return false;
        if (statusFilter === 'inativo' && e.ativo) return false;
        if (!term) return true;
        return (
          e.nome.toLowerCase().includes(term) || e.slug.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        // Esportes com mercados cadastrados sobem — são os realmente úteis.
        // Entre iguais em mercados, ordem alfabética pra previsibilidade.
        if (a.tipos_total !== b.tipos_total) return b.tipos_total - a.tipos_total;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
  }, [esportes, search, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou slug"
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(((v ?? 'all') as StatusFilter))}
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

      {filtered.length === 0 ? (
        <div className="border-border/70 bg-muted/20 rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhum esporte corresponde aos filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((esporte) => (
            <EsporteCard key={esporte.id} esporte={esporte} />
          ))}
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        Mostrando <span className="text-foreground font-medium">{filtered.length}</span> de{' '}
        <span className="text-foreground font-medium">{esportes.length}</span> esportes
        cadastrados.
      </p>
    </div>
  );
}

function EsporteCard({ esporte }: { esporte: EsporteListItem }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [togglePending, startToggleTransition] = React.useTransition();
  const [deletePending, startDeleteTransition] = React.useTransition();

  const hasMercados = esporte.tipos_total > 0;

  const handleToggle = (checked: boolean) => {
    startToggleTransition(async () => {
      const result = await alternarAtivoEsporte(esporte.id, checked);
      if (result.ok) {
        toast.success(checked ? 'Esporte ativado.' : 'Esporte desativado.');
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await excluirEsporte(esporte.id);
      if (result.ok) {
        toast.success('Esporte excluído.');
        setDeleteOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  // Para manter o card todo clicável sem HTML inválido (um <a> não pode
  // conter <button>), usamos "overlay link pattern": um <Link> absoluto
  // cobrindo o card inteiro, com z-0, e os controles interativos em
  // z-10. Acessível e semântico.
  const href = hasMercados ? `/admin/tipos-aposta?esporte=${esporte.id}` : null;

  return (
    <>
      <Card
        className={cn(
          'group/card relative flex h-full flex-col gap-0 overflow-hidden transition-all duration-200',
          href && 'hover:shadow-brand-sm hover:border-primary/30 focus-within:border-primary/50',
          !esporte.ativo && 'opacity-70',
        )}
      >
        {esporte.ativo && hasMercados && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-primary/10 blur-3xl"
          />
        )}

        {href && (
          <Link
            href={href}
            className="absolute inset-0 z-0 rounded-[inherit] focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
            aria-label={`Ver tipos de aposta de ${esporte.nome}`}
          >
            <span className="sr-only">Ver mercados de {esporte.nome}</span>
          </Link>
        )}

        <div className="relative z-10 flex items-start justify-between gap-3 px-4 pt-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex size-11 items-center justify-center rounded-xl ring-1',
                esporte.ativo
                  ? 'bg-primary/10 text-primary ring-primary/20'
                  : 'bg-muted text-muted-foreground ring-border',
              )}
            >
              <EsporteIcon slug={esporte.slug} className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <h3 className="font-heading truncate text-base leading-tight font-medium">
                {esporte.nome}
              </h3>
              <code className="text-muted-foreground bg-muted/50 mt-1 w-fit rounded px-1.5 py-0.5 font-mono text-[11px]">
                {esporte.slug}
              </code>
            </div>
          </div>

          <div className="relative z-20 flex items-center gap-1">
            {/* Switch de ativo/inativo vive aqui no canto, sem a pill
                redundante embaixo. Um sinal é suficiente. */}
            <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <Switch
                checked={esporte.ativo}
                onCheckedChange={handleToggle}
                disabled={togglePending}
                aria-label={esporte.ativo ? 'Desativar esporte' : 'Ativar esporte'}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Abrir ações"
                    onClick={(e) => e.stopPropagation()}
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
          </div>
        </div>

        <div
          className={cn(
            'relative z-10 mt-auto flex items-center justify-between gap-3 border-t px-4 py-3',
            hasMercados ? 'bg-muted/30' : 'bg-muted/10',
          )}
        >
          <div className="flex items-center gap-2">
            <ListChecks
              className={cn(
                'size-4',
                hasMercados ? 'text-primary' : 'text-muted-foreground',
              )}
              aria-hidden="true"
            />
            {hasMercados ? (
              <div className="flex flex-col leading-tight">
                <span className="text-foreground text-sm font-medium">
                  <span className="tabular-nums">{esporte.tipos_total}</span>
                  <span className="text-muted-foreground font-normal">
                    {' '}
                    tipo{esporte.tipos_total === 1 ? '' : 's'} de aposta
                  </span>
                </span>
                <span className="text-muted-foreground text-[11px]">
                  <span className="tabular-nums">{esporte.tipos_ativos}</span> ativo
                  {esporte.tipos_ativos === 1 ? '' : 's'}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs italic">
                Sem tipos de aposta cadastrados
              </span>
            )}
          </div>

          {hasMercados && (
            <ArrowUpRight
              className="text-muted-foreground/60 group-hover/card:text-primary size-4 transition-colors"
              aria-hidden="true"
            />
          )}
        </div>
      </Card>

      <EsporteDialog
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        esporte={esporte}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{esporte.nome}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. Se o esporte possui tipos de aposta, ligas ou times
              vinculados, prefira apenas desativá-lo para preservar o histórico.
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
    </>
  );
}
