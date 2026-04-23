import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { StatCard } from '@/components/dashboard/stat-card';
import type { BancaListItem } from '@/features/banca/queries';
import { formatMoney, formatPercent } from '@/lib/format';

type Props = {
  bancas: BancaListItem[];
};

/**
 * Cards de resumo agregando TODAS as bancas do usuário.
 *
 * Decisões UX importantes:
 *   1. O SALDO CONSOLIDADO é o número mãe — único KPI com accent brand e
 *      valor em destaque maior (span-2 em xl). Peak-End rule: é o número
 *      que o usuário quer ver primeiro e lembrar quando fechar o app.
 *   2. SALDO INICIAL e VARIAÇÃO ficam em rodízio lateral, subordinados.
 *   3. REMOVEMOS "Banca Principal" como KPI — é dado textual, não métrica,
 *      polui a grade e quebra hierarquia. Ele vive no card da banca abaixo.
 *   4. Moedas diferentes: mostramos lado a lado ("R$ X · US$ Y") em vez de
 *      mentir com uma soma aritmeticamente errada.
 */
export function BancasResumo({ bancas }: Props) {
  const ativas = bancas.filter((b) => b.ativa);

  const agregados = ativas.reduce<
    Record<string, { inicial: number; atual: number }>
  >((acc, b) => {
    const bucket = (acc[b.moeda] ??= { inicial: 0, atual: 0 });
    bucket.inicial += Number(b.saldo_inicial);
    bucket.atual += Number(b.saldo_atual);
    return acc;
  }, {});

  const moedas = Object.keys(agregados);

  const saldoAtualFormatted =
    moedas.length === 0
      ? formatMoney(0, 'BRL')
      : moedas.map((m) => formatMoney(agregados[m].atual, m)).join(' · ');

  const saldoInicialFormatted =
    moedas.length === 0
      ? formatMoney(0, 'BRL')
      : moedas.map((m) => formatMoney(agregados[m].inicial, m)).join(' · ');

  const variacaoSingleCurrency =
    moedas.length === 1 && agregados[moedas[0]].inicial > 0
      ? ((agregados[moedas[0]].atual - agregados[moedas[0]].inicial) /
          agregados[moedas[0]].inicial) *
        100
      : null;

  const variacaoTrend: 'up' | 'down' | 'neutral' =
    variacaoSingleCurrency === null
      ? 'neutral'
      : variacaoSingleCurrency > 0
        ? 'up'
        : variacaoSingleCurrency < 0
          ? 'down'
          : 'neutral';

  const variacaoAccent: 'win' | 'warn' | 'neutral' =
    variacaoTrend === 'up' ? 'win' : variacaoTrend === 'down' ? 'warn' : 'neutral';

  const bancasLabel = `${ativas.length} banca${ativas.length === 1 ? '' : 's'} ativa${ativas.length === 1 ? '' : 's'}`;
  const heroHint = `${bancasLabel} · Inicial ${saldoInicialFormatted}`;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Hero: saldo consolidado. Ocupa 2/3 em telas grandes para criar
          hierarquia inequívoca. O "saldo inicial" vira um traço de contexto
          no hint em vez de competir como KPI — ele é referência histórica,
          não métrica viva; não merece um card inteiro. */}
      <StatCard
        className="md:col-span-2"
        label="Saldo consolidado"
        value={saldoAtualFormatted}
        hint={heroHint}
        icon={Wallet}
        emphasis="brand"
        accent="brand"
        trend={variacaoTrend}
      />
      <StatCard
        label="Variação"
        value={
          variacaoSingleCurrency === null
            ? '—'
            : formatPercent(variacaoSingleCurrency)
        }
        hint={
          moedas.length > 1
            ? 'Múltiplas moedas — abra cada banca'
            : 'Relativa ao saldo inicial'
        }
        trend={variacaoTrend}
        accent={variacaoAccent}
        icon={variacaoTrend === 'down' ? TrendingDown : TrendingUp}
      />
    </div>
  );
}
