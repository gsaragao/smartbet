import { Globe, Trophy } from 'lucide-react';

import type { LigaListItem } from '@/features/admin/ligas/queries';

type Props = {
  ligas: LigaListItem[];
};

/**
 * Cabeçalho compacto do catálogo de ligas.
 *
 * Trocamos o array de 4 StatCards (Ligas / Ativas / Inativas / Internacionais)
 * por uma linha fina. A informação mais útil pro admin é o total e,
 * complementarmente, quantas competições são internacionais — esse é
 * o dado que costuma pegar o usuário de surpresa (Champions, Libertadores
 * etc. não têm país). "Ativas" só aparece se houver alguma inativa.
 */
export function LigasResumo({ ligas }: Props) {
  const total = ligas.length;
  const ativas = ligas.filter((l) => l.ativo).length;
  const inativas = total - ativas;
  const internacionais = ligas.filter((l) => l.pais == null).length;

  return (
    <div className="border-border/60 bg-card/50 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border px-4 py-3">
      <div className="bg-primary/10 text-primary ring-primary/20 flex size-9 items-center justify-center rounded-lg ring-1">
        <Trophy className="size-4" aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-foreground text-2xl font-semibold tabular-nums">
          {total}
        </span>
        <span className="text-muted-foreground text-sm">
          {total === 1 ? 'liga cadastrada' : 'ligas cadastradas'}
        </span>
      </div>

      {inativas > 0 && (
        <>
          <span className="bg-border/60 hidden h-4 w-px sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-sm font-medium tabular-nums">
              {ativas}
            </span>
            <span className="text-muted-foreground text-sm">ativas</span>
          </div>
        </>
      )}

      {internacionais > 0 && (
        <>
          <span className="bg-border/60 hidden h-4 w-px sm:block" aria-hidden="true" />
          <div className="ml-auto flex items-center gap-2">
            <Globe className="text-muted-foreground size-4" aria-hidden="true" />
            <span className="text-foreground text-sm font-medium tabular-nums">
              {internacionais}
            </span>
            <span className="text-muted-foreground text-sm">
              internaciona{internacionais === 1 ? 'l' : 'is'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
