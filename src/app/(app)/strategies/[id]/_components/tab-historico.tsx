'use client';

import Link from 'next/link';
import { ArrowUpRight, Clock, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge, type Status } from '@/components/ui-kit/status-badge';
import type { BetListItem } from '@/features/bets/queries';
import { formatDateTime, formatMoney } from '@/lib/format';

type Props = {
  apostas: BetListItem[];
};

function mapStatus(s: BetListItem['status']): Status {
  switch (s) {
    case 'ganha':
    case 'meio_green':
      return 'win';
    case 'perdida':
    case 'meio_red':
      return 'loss';
    case 'anulada':
      return 'void';
    case 'cashout':
      return 'cashout';
    case 'pendente':
    default:
      return 'pending';
  }
}

const STATUS_LABELS: Record<BetListItem['status'], string> = {
  pendente: 'Pendente',
  ganha: 'Green',
  perdida: 'Red',
  anulada: 'Anulada',
  cashout: 'Cashout',
  meio_green: 'Meio green',
  meio_red: 'Meio red',
};

export function TabHistorico({ apostas }: Props) {
  if (apostas.length === 0) {
    return (
      <div className="bg-card flex flex-col items-center gap-3 rounded-xl border px-6 py-12 text-center">
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <Clock className="size-5" />
        </div>
        <h3 className="text-foreground text-sm font-medium">Nenhuma aposta registrada ainda</h3>
        <p className="text-muted-foreground max-w-sm text-xs">
          Assim que você registrar uma aposta vinculada a esta estratégia, ela aparece aqui.
        </p>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/bets" />}>
          Ir para apostas
        </Button>
      </div>
    );
  }

  // KPIs locais do histórico
  const resolvidas = apostas.filter((a) => a.status !== 'pendente');
  const greens = resolvidas.filter((a) => a.status === 'ganha' || a.status === 'meio_green').length;
  const reds = resolvidas.filter((a) => a.status === 'perdida' || a.status === 'meio_red').length;
  const lucro = resolvidas.reduce((acc, a) => acc + (a.lucro != null ? a.lucro : 0), 0);
  const stakePago = resolvidas.reduce(
    (acc, a) => (a.eh_freebet || a.status === 'anulada' ? acc : acc + a.stake),
    0,
  );
  const roi = stakePago > 0 ? (lucro / stakePago) * 100 : 0;
  const hitRate = greens + reds > 0 ? (greens / (greens + reds)) * 100 : 0;
  const moeda = apostas[0]?.banca?.moeda ?? 'BRL';

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs compactos */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Total" value={String(apostas.length)} />
        <Kpi
          label="Lucro"
          value={formatMoney(lucro, moeda)}
          tone={lucro > 0 ? 'pos' : lucro < 0 ? 'neg' : 'neutral'}
        />
        <Kpi
          label="ROI"
          value={`${roi.toFixed(1)}%`}
          tone={roi > 0 ? 'pos' : roi < 0 ? 'neg' : 'neutral'}
        />
        <Kpi label="Hit rate" value={`${hitRate.toFixed(0)}%`} tone="neutral" />
      </div>

      {/* Tabela/listagem */}
      <div className="border-border/70 bg-card hidden overflow-hidden rounded-xl border md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs tracking-wider uppercase">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Jogo</th>
              <th className="px-3 py-2 text-left font-medium">Seleção</th>
              <th className="px-3 py-2 text-right font-medium">Odd</th>
              <th className="px-3 py-2 text-right font-medium">Stake</th>
              <th className="px-3 py-2 text-right font-medium">Lucro</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Data</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {apostas.map((a) => {
              const partida = a.selecao_resumo?.partida;
              const moedaLinha = a.banca?.moeda ?? moeda;
              return (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-foreground truncate text-sm font-medium">
                      {partida ? `${partida.mandante ?? '—'} × ${partida.visitante ?? '—'}` : '—'}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {partida?.liga_nome ?? '—'}
                      {partida?.inicio ? ` · ${formatDateTime(partida.inicio)}` : ''}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-foreground text-sm">
                      {a.selecao_resumo?.descricao ?? '—'}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {a.selecao_resumo?.tipo_aposta_nome ?? ''}
                      {a.selecao_resumo?.linha ? ` · ${a.selecao_resumo.linha}` : ''}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">
                    {a.odd_total.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">
                    {formatMoney(a.stake, moedaLinha)}
                    {a.eh_freebet && (
                      <Badge variant="outline" className="ml-1.5 px-1 py-0 text-[10px]">
                        freebet
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">
                    {a.lucro != null ? (
                      <span
                        className={
                          a.lucro > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : a.lucro < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-muted-foreground'
                        }
                      >
                        {formatMoney(a.lucro, moedaLinha)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={mapStatus(a.status)} label={STATUS_LABELS[a.status]} />
                      {a.estrategia_override && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/10 px-1 py-0 text-[10px] text-amber-700 dark:text-amber-300"
                          title="Override"
                        >
                          <Sparkles className="size-3" />
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="text-muted-foreground px-3 py-3 text-right text-xs whitespace-nowrap">
                    {formatDateTime(a.colocada_em)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      nativeButton={false}
                      render={<Link href={`/bets/${a.id}`} />}
                    >
                      <ArrowUpRight className="size-4" />
                      <span className="sr-only">Abrir</span>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards em mobile */}
      <div className="grid gap-2 md:hidden">
        {apostas.map((a) => {
          const partida = a.selecao_resumo?.partida;
          const moedaLinha = a.banca?.moeda ?? moeda;
          return (
            <Link
              key={a.id}
              href={`/bets/${a.id}`}
              className="border-border/70 bg-card hover:border-border space-y-2 rounded-xl border p-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-foreground truncate text-sm font-medium">
                    {partida ? `${partida.mandante ?? '—'} × ${partida.visitante ?? '—'}` : '—'}
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {a.selecao_resumo?.descricao ?? '—'}
                  </div>
                </div>
                <StatusBadge status={mapStatus(a.status)} label={STATUS_LABELS[a.status]} />
              </div>
              <div className="text-muted-foreground flex items-center gap-3 text-xs">
                <span className="font-mono tabular-nums">Odd {a.odd_total.toFixed(2)}</span>
                <span>•</span>
                <span className="font-mono tabular-nums">{formatMoney(a.stake, moedaLinha)}</span>
                {a.lucro != null && (
                  <>
                    <span>•</span>
                    <span
                      className={
                        a.lucro > 0
                          ? 'font-mono text-emerald-600 tabular-nums dark:text-emerald-400'
                          : a.lucro < 0
                            ? 'font-mono text-rose-600 tabular-nums dark:text-rose-400'
                            : 'font-mono tabular-nums'
                      }
                    >
                      {formatMoney(a.lucro, moedaLinha)}
                    </span>
                  </>
                )}
              </div>
              <div className="text-muted-foreground text-[11px]">
                {formatDateTime(a.colocada_em)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'pos' | 'neg' | 'neutral';
}) {
  const toneClass =
    tone === 'pos'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'neg'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-foreground';
  return (
    <div className="border-border/70 bg-card rounded-xl border px-3 py-2.5">
      <div className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
        {label}
      </div>
      <div className={`text-base font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
