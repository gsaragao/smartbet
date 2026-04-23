'use client';

import * as React from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  MoreHorizontal,
  Scale,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { excluirEventoBanca } from '@/features/banca/actions';
import type { EventoBancaListItem } from '@/features/banca/queries';
import { formatDateTime, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

type Props = {
  bancaId: string;
  eventos: EventoBancaListItem[];
  moeda: string;
};

const TIPO_LABEL: Record<EventoBancaListItem['tipo'], string> = {
  deposito: 'Depósito',
  saque: 'Saque',
  ajuste: 'Ajuste',
  saldo_inicial: 'Saldo inicial',
  aposta: 'Aposta',
};

export function EventosTable({ bancaId, eventos, moeda }: Props) {
  const [layout, setLayout] = React.useState<'mobile' | 'desktop' | null>(null);

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setLayout(mq.matches ? 'desktop' : 'mobile');
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  if (layout === null) {
    return (
      <Skeleton
        className="h-48 w-full rounded-xl"
        aria-busy="true"
        aria-label="Carregando extrato"
      />
    );
  }

  if (layout === 'mobile') {
    return (
      <ul className="flex flex-col gap-3" aria-label="Lista de eventos">
        {eventos.map((e) => (
          <li key={e.id}>
            <EventoCard bancaId={bancaId} evento={e} moeda={moeda} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-sm">
      <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="text-muted-foreground w-[min(40%,11rem)] pl-5 text-xs font-semibold tracking-wide uppercase">
                Data
              </TableHead>
              <TableHead className="text-muted-foreground w-[140px] text-xs font-semibold tracking-wide uppercase">
                Tipo
              </TableHead>
              <TableHead className="text-muted-foreground text-right text-xs font-semibold tracking-wide uppercase">
                Valor
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Observação
              </TableHead>
              <TableHead className="text-muted-foreground w-12 pr-5 text-xs font-semibold tracking-wide uppercase">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventos.map((e) => (
              <EventoTableRow key={e.id} bancaId={bancaId} evento={e} moeda={moeda} />
            ))}
          </TableBody>
        </Table>
    </div>
  );
}

function useExcluirEvento(bancaId: string, eventoId: string) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await excluirEventoBanca(eventoId, bancaId);
      if (res.ok) {
        toast.success('Evento excluído.');
        setDeleteOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  return { deleteOpen, setDeleteOpen, isPending, handleDelete };
}

function EventoActionsMenu({
  bancaId,
  eventoId,
  align = 'end',
}: {
  bancaId: string;
  eventoId: string;
  align?: 'start' | 'end';
}) {
  const { deleteOpen, setDeleteOpen, isPending, handleDelete } = useExcluirEvento(
    bancaId,
    eventoId,
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Abrir ações">
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MoreHorizontal className="size-4" />
              )}
            </Button>
          }
        />
        <DropdownMenuContent align={align} className="w-40">
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              O saldo da banca será recalculado automaticamente sem este evento.
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
    </>
  );
}

function ValorCelula({ valorNum, moeda }: { valorNum: number; moeda: string }) {
  const isPositivo = valorNum > 0;
  return (
    <span
      className={cn(
        'font-mono text-base font-semibold tabular-nums sm:text-sm',
        isPositivo ? 'text-win' : 'text-loss',
      )}
    >
      {isPositivo ? '+' : ''}
      {formatMoney(valorNum, moeda)}
    </span>
  );
}

function EventoCard({
  bancaId,
  evento,
  moeda,
}: {
  bancaId: string;
  evento: EventoBancaListItem;
  moeda: string;
}) {
  const valorNum = Number(evento.valor);

  return (
    <Card className="border-border/70 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-muted-foreground font-mono text-xs tabular-nums">
              {formatDateTime(evento.ocorrido_em)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <TipoBadge tipo={evento.tipo} />
              <ValorCelula valorNum={valorNum} moeda={moeda} />
            </div>
            <p
              className={cn(
                'text-sm leading-snug',
                evento.observacao ? 'text-foreground' : 'text-muted-foreground italic',
              )}
            >
              {evento.observacao ?? 'Sem observação'}
            </p>
          </div>
          <EventoActionsMenu bancaId={bancaId} eventoId={evento.id} />
        </div>
      </CardContent>
    </Card>
  );
}

function EventoTableRow({
  bancaId,
  evento,
  moeda,
}: {
  bancaId: string;
  evento: EventoBancaListItem;
  moeda: string;
}) {
  const valorNum = Number(evento.valor);
  const isPositivo = valorNum > 0;

  return (
    <TableRow className="border-border/50 hover:bg-muted/40 transition-colors">
      <TableCell className="text-muted-foreground pl-5 font-mono text-xs tabular-nums">
        {formatDateTime(evento.ocorrido_em)}
      </TableCell>
      <TableCell>
        <TipoBadge tipo={evento.tipo} />
      </TableCell>
      <TableCell
        className={cn(
          'text-right font-mono text-sm font-semibold tabular-nums',
          isPositivo ? 'text-win' : 'text-loss',
        )}
      >
        {isPositivo ? '+' : ''}
        {formatMoney(valorNum, moeda)}
      </TableCell>
      <TableCell className="text-muted-foreground max-w-[min(28vw,14rem)] truncate text-sm sm:max-w-xs">
        {evento.observacao ?? '—'}
      </TableCell>
      <TableCell className="pr-5 text-right">
        <EventoActionsMenu bancaId={bancaId} eventoId={evento.id} />
      </TableCell>
    </TableRow>
  );
}

function TipoBadge({ tipo }: { tipo: EventoBancaListItem['tipo'] }) {
  if (tipo === 'deposito') {
    return (
      <Badge
        variant="secondary"
        className="bg-win-muted text-win gap-1 border-transparent font-medium"
      >
        <ArrowDownCircle className="size-3 shrink-0" />
        {TIPO_LABEL[tipo]}
      </Badge>
    );
  }
  if (tipo === 'saque') {
    return (
      <Badge
        variant="secondary"
        className="bg-loss-muted text-loss gap-1 border-transparent font-medium"
      >
        <ArrowUpCircle className="size-3 shrink-0" />
        {TIPO_LABEL[tipo]}
      </Badge>
    );
  }
  if (tipo === 'ajuste') {
    return (
      <Badge variant="secondary" className="gap-1 font-medium">
        <Scale className="size-3 shrink-0" />
        {TIPO_LABEL[tipo]}
      </Badge>
    );
  }
  return <Badge variant="outline">{TIPO_LABEL[tipo]}</Badge>;
}
