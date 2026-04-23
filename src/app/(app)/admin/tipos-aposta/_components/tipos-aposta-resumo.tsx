import { Layers, ListChecks, Shapes } from 'lucide-react';

import type { TipoApostaListItem } from '@/features/admin/tipos-aposta/queries';

type Props = {
  tipos: TipoApostaListItem[];
};

/**
 * Cabeçalho compacto do catálogo.
 *
 * Mesma família visual dos outros resumos admin: uma linha, sem dramatização,
 * respondendo o que o admin pergunta ao abrir a tela — "quantos mercados eu
 * ofereço? divididos em quantas categorias? quantos estão desativados?".
 *
 * Ativos só aparecem como contador secundário se houver inativos; senão
 * poluiria com informação redundante (20 / 20).
 */
export function TiposApostaResumo({ tipos }: Props) {
  const total = tipos.length;
  const ativos = tipos.filter((t) => t.ativo).length;
  const inativos = total - ativos;
  const categorias = new Set(tipos.map((t) => t.categoria)).size;
  const esportes = new Set(tipos.map((t) => t.esporte_id)).size;

  return (
    <div className="border-border/60 bg-card/50 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border px-4 py-3">
      <div className="bg-primary/10 text-primary ring-primary/20 flex size-9 items-center justify-center rounded-lg ring-1">
        <ListChecks className="size-4" aria-hidden="true" />
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-heading text-foreground text-2xl font-semibold tabular-nums">
          {total}
        </span>
        <span className="text-muted-foreground text-sm">
          {total === 1 ? 'tipo' : 'tipos'}
        </span>
      </div>

      <span className="bg-border/60 hidden h-4 w-px sm:block" aria-hidden="true" />
      <div className="flex items-center gap-2">
        <Layers className="text-muted-foreground size-4" aria-hidden="true" />
        <span className="text-foreground text-sm font-medium tabular-nums">
          {categorias}
        </span>
        <span className="text-muted-foreground text-sm">
          {categorias === 1 ? 'categoria' : 'categorias'}
        </span>
      </div>

      {esportes > 1 && (
        <>
          <span className="bg-border/60 hidden h-4 w-px sm:block" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <Shapes className="text-muted-foreground size-4" aria-hidden="true" />
            <span className="text-foreground text-sm font-medium tabular-nums">
              {esportes}
            </span>
            <span className="text-muted-foreground text-sm">esportes</span>
          </div>
        </>
      )}

      {inativos > 0 && (
        <div className="ml-auto flex items-center gap-2">
          <span className="bg-muted-foreground/50 size-1.5 rounded-full" aria-hidden="true" />
          <span className="text-foreground text-sm font-medium tabular-nums">
            {ativos}
          </span>
          <span className="text-muted-foreground text-sm">
            ativo{ativos === 1 ? '' : 's'}{' '}
            <span className="text-muted-foreground/70">
              ({inativos} inativo{inativos === 1 ? '' : 's'})
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
