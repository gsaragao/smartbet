import {
  CircleDollarSign,
  Clock,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import type { BetsResumoData } from '@/features/bets/queries';
import { cn } from '@/lib/utils';

type Props = {
  resumo: BetsResumoData;
};

/**
 * KPI bar for the bets listing.
 *
 * Linha fina, compacta, com os 5 números que o usuário quer saber assim que
 * abre a página: total, pendentes, ganhas/perdidas (resolvidas), lucro, ROI e
 * hit rate. Replica o "tom" dos painéis da banca.
 */
export function BetsResumo({ resumo }: Props) {
  const tomLucro = resumo.lucro_total > 0 ? 'pos' : resumo.lucro_total < 0 ? 'neg' : 'neutral';
  const tomRoi = resumo.roi > 0 ? 'pos' : resumo.roi < 0 ? 'neg' : 'neutral';

  return (
    <div className="border-border/60 bg-card/50 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border px-4 py-3">
      <div className="bg-primary/10 text-primary ring-primary/20 flex size-9 items-center justify-center rounded-lg ring-1">
        <Target className="size-4" aria-hidden />
      </div>

      <Stat
        label={resumo.total === 1 ? 'aposta' : 'apostas'}
        value={String(resumo.total)}
      />

      {resumo.pendentes > 0 && (
        <>
          <Divider />
          <StatInline
            icon={Clock}
            toneClass="text-amber-600 dark:text-amber-400"
            value={resumo.pendentes}
            label={`pendente${resumo.pendentes === 1 ? '' : 's'}`}
          />
        </>
      )}

      {(resumo.ganhas > 0 || resumo.perdidas > 0) && (
        <>
          <Divider />
          <StatInline
            icon={TrendingUp}
            toneClass="text-emerald-600 dark:text-emerald-400"
            value={resumo.ganhas}
            label={`green${resumo.ganhas === 1 ? '' : 's'}`}
          />
          <span className="text-muted-foreground text-xs">/</span>
          <StatInline
            icon={TrendingDown}
            toneClass="text-rose-600 dark:text-rose-400"
            value={resumo.perdidas}
            label={`red${resumo.perdidas === 1 ? '' : 's'}`}
          />
        </>
      )}

      <Divider className="ml-auto" />
      <StatCurrency
        icon={CircleDollarSign}
        tone={tomLucro}
        value={resumo.lucro_total}
        label="lucro"
      />
      <Divider />
      <StatPct icon={Percent} tone={tomRoi} value={resumo.roi} label="ROI" />
      <StatPct
        icon={Target}
        tone="neutral"
        value={resumo.hit_rate}
        label="hit rate"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Divider({ className }: { className?: string }) {
  return (
    <span
      className={cn('bg-border/60 hidden h-4 w-px sm:block', className)}
      aria-hidden
    />
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-heading text-foreground text-2xl font-semibold tabular-nums">
        {value}
      </span>
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}

function StatInline({
  icon: Icon,
  toneClass,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  toneClass: string;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn('size-4', toneClass)} aria-hidden />
      <span className="text-foreground text-sm font-medium tabular-nums">{value}</span>
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}

function StatCurrency({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: 'pos' | 'neg' | 'neutral';
  value: number;
  label: string;
}) {
  const toneClass =
    tone === 'pos'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'neg'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-foreground';
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="text-muted-foreground size-4" aria-hidden />
      <span className={cn('font-mono text-sm font-semibold tabular-nums', toneClass)}>
        {value.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 2,
        })}
      </span>
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}

function StatPct({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: 'pos' | 'neg' | 'neutral';
  value: number;
  label: string;
}) {
  const toneClass =
    tone === 'pos'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'neg'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-foreground';
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="text-muted-foreground size-4" aria-hidden />
      <span className={cn('font-mono text-sm font-semibold tabular-nums', toneClass)}>
        {value.toFixed(2)}%
      </span>
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}
