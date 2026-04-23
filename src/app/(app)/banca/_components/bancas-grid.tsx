'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Archive,
  ArchiveRestore,
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  alternarAtivaBanca,
  definirBancaPrincipal,
  excluirBanca,
} from '@/features/banca/actions';
import type { BancaListItem } from '@/features/banca/queries';
import { formatMoney, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

import { BancaDialog } from './banca-dialog';

type Props = {
  bancas: BancaListItem[];
};

export function BancasGrid({ bancas }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {bancas.map((banca) => (
        <BancaCard key={banca.id} banca={banca} />
      ))}
    </div>
  );
}

function BancaCard({ banca }: { banca: BancaListItem }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const variacao = banca.variacao_pct;
  const trendClass =
    variacao === null
      ? 'text-muted-foreground'
      : variacao > 0
        ? 'text-win'
        : variacao < 0
          ? 'text-loss'
          : 'text-muted-foreground';

  const handleTogglePrincipal = () => {
    if (banca.e_principal) return;
    startTransition(async () => {
      const res = await definirBancaPrincipal(banca.id);
      if (res.ok) toast.success(`"${banca.nome}" agora é a banca principal.`);
      else toast.error(res.message);
    });
  };

  const handleToggleAtiva = () => {
    startTransition(async () => {
      const res = await alternarAtivaBanca(banca.id, !banca.ativa);
      if (res.ok) {
        toast.success(banca.ativa ? 'Banca arquivada.' : 'Banca reativada.');
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await excluirBanca(banca.id);
      if (res.ok) {
        toast.success('Banca excluída.');
        setDeleteOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Visual brand for the account: deterministic initial from "nome" —
  // same banca always gets the same circle. Recognition > recall. In the
  // future this avatar will also appear in bet lists, so the user learns
  // the mapping across the whole app.
  const initial = banca.nome?.[0]?.toUpperCase() ?? '?';

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden transition-all duration-200',
        'hover:border-primary/30 hover:shadow-brand-sm hover:-translate-y-0.5',
        !banca.ativa && 'opacity-70',
      )}
    >
      {/* Entire card is a link to the detail page. The kebab menu stops
          propagation so it doesn't trigger navigation. Big-click-target
          wins: no more "Ver detalhes" full-width CTA competing for attention. */}
      <Link
        href={`/banca/${banca.id}`}
        className="focus-visible:ring-ring absolute inset-0 z-10 rounded-[inherit] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={`Ver detalhes de ${banca.nome}`}
      />

      <CardHeader className="relative flex flex-row items-start justify-between gap-2 pb-0">
        <div className="flex min-w-0 items-start gap-3">
          {/* Circle avatar with initial — signature visual for the account. */}
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              banca.e_principal
                ? 'bg-primary/15 text-primary ring-primary/25 ring-1'
                : 'bg-muted text-muted-foreground',
            )}
            aria-hidden="true"
          >
            {initial}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-heading text-foreground truncate text-base font-semibold">
                {banca.nome}
              </h3>
              {banca.e_principal && (
                <Star
                  className="text-primary size-3.5 shrink-0"
                  aria-label="Banca principal"
                />
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span className="font-mono font-medium">{banca.moeda}</span>
              {banca.casa_de_aposta && (
                <>
                  <span aria-hidden className="text-muted-foreground/60">
                    ·
                  </span>
                  <span className="truncate">{banca.casa_de_aposta}</span>
                </>
              )}
              {!banca.ativa && (
                <>
                  <span aria-hidden className="text-muted-foreground/60">
                    ·
                  </span>
                  <span className="text-void">Arquivada</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Kebab menu sits above the invisible link so it stays interactive. */}
        <div className="relative z-20 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Ações da banca"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleTogglePrincipal}
                disabled={banca.e_principal || isPending}
              >
                <Star className="size-4" /> Definir como principal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleAtiva} disabled={isPending}>
                {banca.ativa ? (
                  <>
                    <Archive className="size-4" /> Arquivar
                  </>
                ) : (
                  <>
                    <ArchiveRestore className="size-4" /> Reativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="relative flex flex-col gap-2">
        {/* Current balance — hero number of the card. */}
        <div className="flex items-baseline gap-2">
          <span className="text-foreground font-mono text-3xl leading-none font-semibold tracking-tight tabular-nums">
            {formatMoney(Number(banca.saldo_atual), banca.moeda)}
          </span>
        </div>

        {/* Context row: initial balance + variation. Intentionally understated
            so the hero number wins the eye. Variation is semantically colored
            (win/loss) for instant recognition. */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Inicial {formatMoney(Number(banca.saldo_inicial), banca.moeda)}
          </span>
          <span
            className={cn('font-mono font-semibold tabular-nums', trendClass)}
          >
            {formatPercent(variacao)}
          </span>
        </div>

        {/* Hover affordance — tiny arrow in the corner that slides on hover.
            Communicates "this card is clickable" without wasting a full row. */}
        <div
          aria-hidden="true"
          className="text-muted-foreground group-hover:text-primary pointer-events-none absolute right-4 bottom-4 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
        >
          <ArrowUpRight className="size-4" />
        </div>
      </CardContent>

      <BancaDialog
        mode="edit"
        banca={banca}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir &ldquo;{banca.nome}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e remove todos os eventos dessa banca.
              Se houver apostas vinculadas, prefira <strong>arquivar</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
