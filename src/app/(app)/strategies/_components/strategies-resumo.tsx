import { Archive, PauseCircle, PlayCircle, Target } from 'lucide-react';

import type { StrategyListItem } from '@/features/strategies/queries';

type Props = {
  estrategias: StrategyListItem[];
};

/**
 * Cabeçalho compacto da listagem de estratégias. Segue o padrão das
 * páginas de admin (linha fina com totalizadores + destaques por status).
 */
export function StrategiesResumo({ estrategias }: Props) {
  const total = estrategias.length;
  const ativas = estrategias.filter((e) => e.status === 'ativa').length;
  const pausadas = estrategias.filter((e) => e.status === 'pausada').length;
  const arquivadas = estrategias.filter((e) => e.status === 'arquivada').length;

  return (
    <div className="border-border/60 bg-card/50 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border px-4 py-3">
      <div className="bg-primary/10 text-primary ring-primary/20 flex size-9 items-center justify-center rounded-lg ring-1">
        <Target className="size-4" aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-foreground text-2xl font-semibold tabular-nums">
          {total}
        </span>
        <span className="text-muted-foreground text-sm">
          {total === 1 ? 'estratégia' : 'estratégias'}
        </span>
      </div>

      {ativas > 0 && (
        <>
          <span
            className="bg-border/60 hidden h-4 w-px sm:block"
            aria-hidden="true"
          />
          <div className="flex items-center gap-2">
            <PlayCircle
              className="size-4 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span className="text-foreground text-sm font-medium tabular-nums">
              {ativas}
            </span>
            <span className="text-muted-foreground text-sm">
              ativ{ativas === 1 ? 'a' : 'as'}
            </span>
          </div>
        </>
      )}

      {pausadas > 0 && (
        <>
          <span
            className="bg-border/60 hidden h-4 w-px sm:block"
            aria-hidden="true"
          />
          <div className="flex items-center gap-2">
            <PauseCircle
              className="size-4 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <span className="text-foreground text-sm font-medium tabular-nums">
              {pausadas}
            </span>
            <span className="text-muted-foreground text-sm">
              pausada{pausadas === 1 ? '' : 's'}
            </span>
          </div>
        </>
      )}

      {arquivadas > 0 && (
        <>
          <span
            className="bg-border/60 hidden h-4 w-px sm:block"
            aria-hidden="true"
          />
          <div className="ml-auto flex items-center gap-2">
            <Archive className="text-muted-foreground size-4" aria-hidden="true" />
            <span className="text-foreground text-sm font-medium tabular-nums">
              {arquivadas}
            </span>
            <span className="text-muted-foreground text-sm">
              arquivada{arquivadas === 1 ? '' : 's'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
