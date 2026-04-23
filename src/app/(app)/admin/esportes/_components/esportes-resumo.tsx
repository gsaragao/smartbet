import { ListChecks, Shapes } from 'lucide-react';

import type { EsporteListItem } from '@/features/admin/esportes/queries';

type Props = {
  esportes: EsporteListItem[];
};

/**
 * Cabeçalho compacto do catálogo de esportes.
 *
 * Trocamos 4 StatCards (Modalidades, Ativos, Inativos, Mercados cobertos)
 * por uma linha enxuta: total, quantos ativos (só quando há inativos) e
 * mercados cobertos. Métricas que costumam ficar em 0 ou iguais ao total
 * viram ruído — e "Inativos: 0" era literalmente um card inteiro mostrando
 * zero numa tela com apenas 4 esportes.
 */
export function EsportesResumo({ esportes }: Props) {
  const total = esportes.length;
  const ativos = esportes.filter((e) => e.ativo).length;
  const inativos = total - ativos;
  const mercados = esportes.reduce((acc, e) => acc + e.tipos_total, 0);

  return (
    <div className="border-border/60 bg-card/50 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border px-4 py-3">
      <div className="bg-primary/10 text-primary ring-primary/20 flex size-9 items-center justify-center rounded-lg ring-1">
        <Shapes className="size-4" aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-foreground text-2xl font-semibold tabular-nums">
          {total}
        </span>
        <span className="text-muted-foreground text-sm">
          {total === 1 ? 'modalidade' : 'modalidades'}
        </span>
      </div>

      {inativos > 0 && (
        <>
          <span className="bg-border/60 hidden h-4 w-px sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-sm font-medium tabular-nums">
              {ativos}
            </span>
            <span className="text-muted-foreground text-sm">ativas</span>
          </div>
        </>
      )}

      <span className="bg-border/60 hidden h-4 w-px sm:block" aria-hidden="true" />
      <div className="ml-auto flex items-center gap-2">
        <ListChecks className="text-muted-foreground size-4" aria-hidden="true" />
        <span className="text-foreground text-sm font-medium tabular-nums">{mercados}</span>
        <span className="text-muted-foreground text-sm">
          {mercados === 1 ? 'mercado' : 'mercados'}
        </span>
      </div>
    </div>
  );
}
