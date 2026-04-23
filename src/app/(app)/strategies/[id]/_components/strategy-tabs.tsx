'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';
import type { BetListItem } from '@/features/bets/queries';
import type { StrategyDetail } from '@/features/strategies/queries';

import { TabGestao } from './tab-gestao';
import { TabHistorico } from './tab-historico';
import { TabRegras } from './tab-regras';
import { TabVisao } from './tab-visao';

export function StrategyTabs({
  estrategia,
  apostas,
}: {
  estrategia: StrategyDetail;
  apostas: BetListItem[];
}) {
  return (
    <Tabs defaultValue="visao">
      <TabsList>
        <TabsTab value="visao">Visão geral</TabsTab>
        <TabsTab value="regras">Regras</TabsTab>
        <TabsTab value="gestao">Gestão</TabsTab>
        <TabsTab value="historico">
          Histórico
          {apostas.length > 0 ? (
            <span className="text-muted-foreground ml-1.5 text-[10px]">
              ({apostas.length})
            </span>
          ) : null}
        </TabsTab>
      </TabsList>
      <TabsPanel value="visao">
        <TabVisao estrategia={estrategia} />
      </TabsPanel>
      <TabsPanel value="regras">
        <TabRegras estrategia={estrategia} />
      </TabsPanel>
      <TabsPanel value="gestao">
        <TabGestao estrategia={estrategia} />
      </TabsPanel>
      <TabsPanel value="historico">
        <TabHistorico apostas={apostas} />
      </TabsPanel>
    </Tabs>
  );
}
