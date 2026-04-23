import { Globe, ShieldAlert, Users } from 'lucide-react';

import type { TimeListItem } from '@/features/admin/times/queries';

type Props = {
  times: TimeListItem[];
};

/**
 * Cabeçalho compacto do catálogo de times. Total + países distintos +
 * contagem de times sem escudo (o admin tende a querer preencher).
 */
export function TimesResumo({ times }: Props) {
  const total = times.length;
  const paisesUnicos = new Set(
    times.map((t) => t.pais?.id).filter((id): id is number => id != null),
  ).size;
  const semEscudo = times.filter((t) => !t.escudo_url).length;

  return (
    <div className="border-border/60 bg-card/50 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border px-4 py-3">
      <div className="bg-primary/10 text-primary ring-primary/20 flex size-9 items-center justify-center rounded-lg ring-1">
        <Users className="size-4" aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-foreground text-2xl font-semibold tabular-nums">
          {total}
        </span>
        <span className="text-muted-foreground text-sm">
          {total === 1 ? 'time cadastrado' : 'times cadastrados'}
        </span>
      </div>

      {paisesUnicos > 0 && (
        <>
          <span className="bg-border/60 hidden h-4 w-px sm:block" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <Globe className="text-muted-foreground size-4" aria-hidden="true" />
            <span className="text-foreground text-sm font-medium tabular-nums">
              {paisesUnicos}
            </span>
            <span className="text-muted-foreground text-sm">
              {paisesUnicos === 1 ? 'país' : 'países'}
            </span>
          </div>
        </>
      )}

      {semEscudo > 0 && (
        <>
          <span className="bg-border/60 hidden h-4 w-px sm:block" aria-hidden="true" />
          <div className="ml-auto flex items-center gap-2">
            <ShieldAlert className="text-muted-foreground size-4" aria-hidden="true" />
            <span className="text-foreground text-sm font-medium tabular-nums">
              {semEscudo}
            </span>
            <span className="text-muted-foreground text-sm">sem escudo</span>
          </div>
        </>
      )}
    </div>
  );
}
