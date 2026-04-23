import { Globe2 } from 'lucide-react';

import type { PaisListItem } from '@/features/admin/paises/queries';

type Props = {
  paises: PaisListItem[];
};

/**
 * Sumário compacto do catálogo de países.
 *
 * Antes tinham 4 StatCards (Países, Em uso, Ligas, Times) — 3 deles ficam
 * em zero durante toda a fase MVP (ligas e times ainda nem existem como
 * telas). KPI vazio não é dado, é ruído: o usuário abre a tela e vê
 * quatro cards gritando "0" em cima da cabeça dele.
 *
 * Trocamos por um header contextual em uma linha, com leitura instantânea:
 * total de países e quantos já estão sendo usados. Quando o MVP crescer e
 * ligas/times tiverem telas próprias, cada um ganha seus KPIs lá — não
 * empilhado aqui.
 */
export function PaisesResumo({ paises }: Props) {
  const total = paises.length;
  const comVinculo = paises.filter(
    (p) => p.ligas_total > 0 || p.times_total > 0,
  ).length;

  return (
    <div className="border-border/60 bg-card/50 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border px-4 py-3">
      <div className="bg-primary/10 text-primary ring-primary/20 flex size-9 items-center justify-center rounded-lg ring-1">
        <Globe2 className="size-4" aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-foreground text-2xl font-semibold tabular-nums">
          {total}
        </span>
        <span className="text-muted-foreground text-sm">
          {total === 1 ? 'país cadastrado' : 'países cadastrados'}
        </span>
      </div>
      {comVinculo > 0 && (
        <>
          <span className="bg-border/60 hidden h-4 w-px sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-sm font-medium tabular-nums">
              {comVinculo}
            </span>
            <span className="text-muted-foreground text-sm">
              {comVinculo === 1 ? 'em uso' : 'em uso'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
