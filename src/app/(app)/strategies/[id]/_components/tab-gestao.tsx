import { AlertTriangle, Shield, ShieldAlert } from 'lucide-react';

import type { StrategyDetail } from '@/features/strategies/queries';

const METODO_LABEL: Record<StrategyDetail['metodo_stake'], string> = {
  livre: 'Livre',
  fixo: 'Fixo',
  percentual: 'Percentual',
  kelly: 'Kelly',
  progressao: 'Progressão',
};

export function TabGestao({ estrategia }: { estrategia: StrategyDetail }) {
  const g = estrategia.gestao;
  const stakeConfig = g.stake_config;

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-card rounded-xl border p-5">
        <header className="mb-4">
          <h3 className="text-foreground text-sm font-semibold">
            Gestão de stake
          </h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Como o valor de cada aposta é calculado.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Método" value={METODO_LABEL[g.metodo_stake]} />
          <InfoRow
            label="Banca de referência"
            value={
              g.banca_referencia === 'saldo_atual'
                ? 'Saldo atual'
                : g.banca_referencia === 'saldo_inicial'
                  ? 'Saldo inicial'
                  : 'Média dos últimos 7 dias'
            }
          />
          {stakeConfig.metodo === 'fixo' && (
            <InfoRow
              label="Valor fixo"
              value={stakeConfig.valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            />
          )}
          {stakeConfig.metodo === 'percentual' && (
            <InfoRow
              label="Percentual"
              value={`${stakeConfig.percentual}%`}
            />
          )}
          {stakeConfig.metodo === 'kelly' && (
            <InfoRow
              label="Fração de Kelly"
              value={stakeConfig.fracao.toFixed(2)}
            />
          )}
          {stakeConfig.metodo === 'progressao' && (
            <>
              <InfoRow label="Progressão" value={stakeConfig.tipo} />
              <InfoRow
                label="Valor inicial"
                value={stakeConfig.valor_inicial.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              />
              {stakeConfig.multiplicador != null && (
                <InfoRow
                  label="Multiplicador"
                  value={stakeConfig.multiplicador.toString()}
                />
              )}
            </>
          )}
          <InfoRow
            label="Edge mínimo"
            value={g.edge_minimo != null ? `${g.edge_minimo}%` : '—'}
          />
        </div>
      </section>

      <section className="bg-card rounded-xl border p-5">
        <header className="mb-4 flex items-center gap-2">
          <Shield className="text-muted-foreground size-4" />
          <div>
            <h3 className="text-foreground text-sm font-semibold">Stop-loss</h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Interrompe a estratégia em cenários limites.
            </p>
          </div>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow
            label="Reds consecutivos"
            value={
              g.stop_loss_reds != null
                ? `${g.stop_loss_reds} reds`
                : 'Desabilitado'
            }
          />
          <InfoRow
            label="Perda máxima (%)"
            value={
              g.stop_loss_banca_pct != null
                ? `${g.stop_loss_banca_pct}%`
                : 'Desabilitado'
            }
          />
        </div>
      </section>

      <section className="bg-card rounded-xl border p-5">
        <header className="mb-4 flex items-center gap-2">
          <ShieldAlert className="text-muted-foreground size-4" />
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              Guardrails e revisão
            </h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Alertas e lembretes configurados para esta estratégia.
            </p>
          </div>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow
            label="Drawdown alerta"
            value={
              estrategia.guardrails.drawdown_alerta_pct != null
                ? `${estrategia.guardrails.drawdown_alerta_pct}%`
                : '—'
            }
          />
          <InfoRow
            label="Reds em sequência"
            value={
              estrategia.guardrails.reds_consec_alerta != null
                ? `${estrategia.guardrails.reds_consec_alerta}`
                : '—'
            }
          />
          <InfoRow
            label="Yield mínimo"
            value={
              estrategia.guardrails.yield_minimo_alerta != null
                ? `${estrategia.guardrails.yield_minimo_alerta}%`
                : '—'
            }
          />
          <InfoRow
            label="Revisão em apostas"
            value={
              estrategia.guardrails.revisao_apos_apostas != null
                ? `a cada ${estrategia.guardrails.revisao_apos_apostas}`
                : '—'
            }
          />
          <InfoRow
            label="Revisão em dias"
            value={
              estrategia.guardrails.revisao_apos_dias != null
                ? `a cada ${estrategia.guardrails.revisao_apos_dias} dias`
                : '—'
            }
          />
        </div>

        {!hasAnyGuardrail(estrategia) && (
          <div className="text-muted-foreground mt-4 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
            <AlertTriangle className="size-4 shrink-0 text-amber-500" />
            <span>
              Nenhum guardrail configurado. Considere adicionar pelo menos um
              alerta para acompanhar o comportamento da estratégia ao longo do
              tempo.
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

function hasAnyGuardrail(e: StrategyDetail) {
  const g = e.guardrails;
  return (
    g.drawdown_alerta_pct != null ||
    g.reds_consec_alerta != null ||
    g.yield_minimo_alerta != null ||
    g.revisao_apos_apostas != null ||
    g.revisao_apos_dias != null
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className="text-foreground text-sm">{value}</span>
    </div>
  );
}
