import type { StrategyDetail } from '@/features/strategies/queries';

import { RulesReadOnly } from '../../_components/rules-builder';

export function TabRegras({ estrategia }: { estrategia: StrategyDetail }) {
  const ligasMap = new Map<number, string>(
    estrategia.ligas.map((l) => [l.id, l.nome]),
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-card rounded-xl border p-5">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              Condições da estratégia
            </h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Regras avaliadas ao verificar se uma aposta pertence a esta
              estratégia.
            </p>
          </div>
          <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 font-mono text-xs">
            v{estrategia.regras_versao}
          </span>
        </header>

        <RulesReadOnly value={estrategia.regras} ligasMap={ligasMap} />
      </section>
    </div>
  );
}
