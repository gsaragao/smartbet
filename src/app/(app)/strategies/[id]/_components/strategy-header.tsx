'use client';

import {
  Archive,
  ArrowLeft,
  Copy,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  arquivarEstrategia,
  ativarEstrategia,
  duplicarEstrategia,
  excluirEstrategia,
  pausarEstrategia,
} from '@/features/strategies/actions';
import type { StrategyDetail, WizardOptions } from '@/features/strategies/queries';
import { cn } from '@/lib/utils';

import { StrategyDialog } from '../../_components/strategy-dialog';

const STATUS_LABEL: Record<StrategyDetail['status'], string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  arquivada: 'Arquivada',
};

const STATUS_CLASS: Record<StrategyDetail['status'], string> = {
  ativa:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  pausada:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  arquivada: 'bg-muted text-muted-foreground border-border',
};

export function StrategyHeader({
  estrategia,
  options,
}: {
  estrategia: StrategyDetail;
  options: WizardOptions;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const cor = estrategia.cor ?? '#6366f1';

  function runAction(
    fn: () => Promise<{ ok: boolean; message?: string }>,
    successMsg: string,
    redirect?: string,
  ) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(successMsg);
        if (redirect) router.push(redirect);
      } else toast.error(result.message ?? 'Falha ao executar ação.');
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/strategies"
        className="text-muted-foreground hover:text-foreground -ml-2 inline-flex h-8 w-fit items-center gap-1.5 rounded-md px-2 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Voltar para estratégias
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-1 size-10 shrink-0 rounded-lg"
            style={{ backgroundColor: cor }}
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-foreground text-2xl font-semibold sm:text-3xl">
                {estrategia.nome}
              </h1>
              <Badge
                variant="outline"
                className={cn('border', STATUS_CLASS[estrategia.status])}
              >
                {STATUS_LABEL[estrategia.status]}
              </Badge>
            </div>
            {estrategia.descricao && (
              <p className="text-muted-foreground max-w-2xl text-sm">
                {estrategia.descricao}
              </p>
            )}
            {estrategia.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {estrategia.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="px-1.5 py-0 text-[11px] font-normal"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" />
            Editar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  aria-label="Mais ações"
                >
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={() =>
                  runAction(
                    () => duplicarEstrategia(estrategia.id, { comoAB: false }),
                    'Estratégia duplicada.',
                  )
                }
              >
                <Copy className="size-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  runAction(
                    () => duplicarEstrategia(estrategia.id, { comoAB: true }),
                    'Variante A/B criada.',
                  )
                }
              >
                <Copy className="size-4" />
                Duplicar como A/B
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {estrategia.status === 'ativa' && (
                <DropdownMenuItem
                  onClick={() =>
                    runAction(
                      () => pausarEstrategia(estrategia.id),
                      'Estratégia pausada.',
                    )
                  }
                >
                  <Pause className="size-4" />
                  Pausar
                </DropdownMenuItem>
              )}
              {estrategia.status === 'pausada' && (
                <DropdownMenuItem
                  onClick={() =>
                    runAction(
                      () => ativarEstrategia(estrategia.id),
                      'Estratégia reativada.',
                    )
                  }
                >
                  <Play className="size-4" />
                  Reativar
                </DropdownMenuItem>
              )}
              {estrategia.status !== 'arquivada' && (
                <DropdownMenuItem
                  onClick={() =>
                    runAction(
                      () => arquivarEstrategia(estrategia.id),
                      'Estratégia arquivada.',
                    )
                  }
                >
                  <Archive className="size-4" />
                  Arquivar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  if (!confirm(`Excluir "${estrategia.nome}"?`)) return;
                  runAction(
                    () => excluirEstrategia(estrategia.id),
                    'Estratégia excluída.',
                    '/strategies',
                  );
                }}
              >
                <Trash2 className="size-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <StrategyDialog
        mode="edit"
        options={options}
        estrategia={estrategia}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
