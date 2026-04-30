'use client';

import {
  Archive,
  Copy,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Tag as TagIcon,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
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
  ativarEstrategia,
  arquivarEstrategia,
  duplicarEstrategia,
  excluirEstrategia,
  pausarEstrategia,
} from '@/features/strategies/actions';
import type { StrategyListItem } from '@/features/strategies/queries';
import { useUser } from '@/components/providers/user-context';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<StrategyListItem['status'], string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  arquivada: 'Arquivada',
};

const STATUS_CLASS: Record<StrategyListItem['status'], string> = {
  ativa:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  pausada:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  arquivada:
    'bg-muted text-muted-foreground border-border',
};

const METODO_LABEL: Record<StrategyListItem['metodo_stake'], string> = {
  livre: 'Livre',
  fixo: 'Fixo',
  percentual: 'Percentual',
  kelly: 'Kelly',
  progressao: 'Progressão',
};

export function StrategyCard({
  estrategia,
  onEdit,
}: {
  estrategia: StrategyListItem;
  onEdit?: (id: string) => void;
}) {
  const { canWrite } = useUser();
  const [isPending, startTransition] = React.useTransition();

  const cor = estrategia.cor ?? '#6366f1';

  function runAction(
    fn: () => Promise<{ ok: boolean; message?: string }>,
    successMsg: string,
  ) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) toast.success(successMsg);
      else toast.error(result.message ?? 'Falha ao executar ação.');
    });
  }

  return (
    <div className="bg-card group hover:border-border relative flex flex-col overflow-hidden rounded-xl border transition-all hover:shadow-md">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: cor }}
      />

      <div className="flex flex-col gap-3 p-4 pl-5">
        <div className="flex items-start gap-2">
          <Link
            href={`/strategies/${estrategia.id}`}
            className="group/link flex-1"
          >
            <h3 className="text-foreground group-hover/link:text-primary line-clamp-1 text-sm font-semibold transition-colors">
              {estrategia.nome}
            </h3>
            {estrategia.descricao && (
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                {estrategia.descricao}
              </p>
            )}
          </Link>

          <Badge
            variant="outline"
            className={cn('shrink-0 border', STATUS_CLASS[estrategia.status])}
          >
            {STATUS_LABEL[estrategia.status]}
          </Badge>

          {canWrite && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  disabled={isPending}
                  aria-label="Ações"
                >
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(estrategia.id)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
              )}
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
              {estrategia.status === 'ativa' ? (
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
              ) : (
                estrategia.status === 'pausada' && (
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
                )
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
                  if (!confirm(`Excluir a estratégia "${estrategia.nome}"?`))
                    return;
                  runAction(
                    () => excluirEstrategia(estrategia.id),
                    'Estratégia excluída.',
                  );
                }}
              >
                <Trash2 className="size-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>

        {estrategia.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <TagIcon className="text-muted-foreground size-3" />
            {estrategia.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-1.5 py-0 text-[10px] font-normal"
              >
                {tag}
              </Badge>
            ))}
            {estrategia.tags.length > 4 && (
              <span className="text-muted-foreground text-[10px]">
                +{estrategia.tags.length - 4}
              </span>
            )}
          </div>
        )}

        <dl className="text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1.5 border-t pt-3 text-xs">
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10px] uppercase tracking-wider">Esporte</dt>
            <dd className="text-foreground truncate font-medium">
              {estrategia.esporte.nome}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10px] uppercase tracking-wider">Stake</dt>
            <dd className="text-foreground font-medium">
              {METODO_LABEL[estrategia.metodo_stake]}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10px] uppercase tracking-wider">Tipos</dt>
            <dd className="text-foreground font-medium tabular-nums">
              {estrategia.tipos_aposta_count}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10px] uppercase tracking-wider">Ligas</dt>
            <dd className="text-foreground font-medium tabular-nums">
              {estrategia.ligas_count === 0 ? 'Todas' : estrategia.ligas_count}
            </dd>
          </div>
          {(estrategia.odd_minima != null || estrategia.odd_maxima != null) && (
            <div className="col-span-2 flex flex-col gap-0.5">
              <dt className="text-[10px] uppercase tracking-wider">
                Faixa de odd
              </dt>
              <dd className="text-foreground font-mono tabular-nums">
                {estrategia.odd_minima?.toFixed(2) ?? '—'} –{' '}
                {estrategia.odd_maxima?.toFixed(2) ?? '—'}
              </dd>
            </div>
          )}
        </dl>

        {estrategia.progresso && estrategia.progresso.total_apostas > 0 && (
          <div className="border-t pt-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {estrategia.progresso.total_apostas}{' '}
                {estrategia.progresso.total_apostas === 1
                  ? 'aposta'
                  : 'apostas'}
              </span>
              <span
                className={cn(
                  'font-mono font-medium tabular-nums',
                  estrategia.progresso.lucro_acumulado > 0 &&
                    'text-emerald-600 dark:text-emerald-400',
                  estrategia.progresso.lucro_acumulado < 0 &&
                    'text-rose-600 dark:text-rose-400',
                )}
              >
                {estrategia.progresso.lucro_acumulado > 0 ? '+' : ''}
                {estrategia.progresso.lucro_acumulado.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
