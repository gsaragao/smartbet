import type { StrategyDetail } from '@/features/strategies/queries';

const METODO_LABEL: Record<StrategyDetail['metodo_stake'], string> = {
  livre: 'Livre',
  fixo: 'Fixo',
  percentual: 'Percentual',
  kelly: 'Kelly',
  progressao: 'Progressão',
};

const CONTEXTO_LABEL: Record<string, string> = {
  pre_live: 'Pré-jogo',
  ao_vivo: 'Ao vivo',
};

export function TabVisao({ estrategia }: { estrategia: StrategyDetail }) {
  const p = estrategia.progresso;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Total de apostas"
          value={p?.total_apostas ?? 0}
        />
        <Kpi
          label="Greens"
          value={p?.total_greens ?? 0}
          tone="green"
        />
        <Kpi
          label="Reds"
          value={p?.total_reds ?? 0}
          tone="red"
        />
        <Kpi
          label="Lucro acumulado"
          value={
            p
              ? p.lucro_acumulado.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : 'R$ 0,00'
          }
          tone={p && p.lucro_acumulado < 0 ? 'red' : 'green'}
          isCurrency
        />
      </div>

      <section className="bg-card rounded-xl border p-5">
        <h3 className="text-foreground mb-4 text-sm font-semibold">
          Informações da estratégia
        </h3>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Info
            label="Esporte"
            value={estrategia.esporte.nome}
          />
          <Info
            label="Contextos"
            value={
              estrategia.contextos
                .map((c) => CONTEXTO_LABEL[c] ?? c)
                .join(', ') || '—'
            }
          />
          <Info
            label="Método de stake"
            value={METODO_LABEL[estrategia.metodo_stake]}
          />
          <Info
            label="Banca de referência"
            value={
              estrategia.gestao.banca_referencia === 'saldo_atual'
                ? 'Saldo atual'
                : estrategia.gestao.banca_referencia === 'saldo_inicial'
                  ? 'Saldo inicial'
                  : 'Média dos últimos 7 dias'
            }
          />
          <Info
            label="Faixa de odd"
            value={
              estrategia.odd_minima == null && estrategia.odd_maxima == null
                ? 'Sem limite'
                : `${estrategia.odd_minima?.toFixed(2) ?? '—'} a ${estrategia.odd_maxima?.toFixed(2) ?? '—'}`
            }
          />
          <Info
            label="Tipos de aposta"
            value={
              estrategia.tipos_aposta.length === 0
                ? '—'
                : estrategia.tipos_aposta.map((t) => t.nome).join(', ')
            }
          />
          <Info
            label="Ligas"
            value={
              estrategia.ligas.length === 0
                ? 'Todas do esporte'
                : estrategia.ligas.map((l) => l.nome).join(', ')
            }
          />
          <Info
            label="Versão das regras"
            value={`v${estrategia.regras_versao}`}
          />
        </dl>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
  isCurrency,
}: {
  label: string;
  value: number | string;
  tone?: 'green' | 'red';
  isCurrency?: boolean;
}) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'red'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-foreground';

  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`${toneClass} mt-1 font-heading tabular-nums ${isCurrency ? 'text-xl' : 'text-2xl'} font-semibold`}
      >
        {value}
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-foreground text-sm">{value}</dd>
    </div>
  );
}
