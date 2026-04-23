import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { obterDetalheEstrategia } from '@/features/strategies/actions';
import {
  listarEstrategiasDoUsuario,
  listarOpcoesWizard,
} from '@/features/strategies/queries';

import { EmptyState } from './_components/empty-state';
import { StrategiesGrid } from './_components/strategies-grid';
import { StrategiesResumo } from './_components/strategies-resumo';
import { StrategyDialog } from './_components/strategy-dialog';

export const metadata = {
  title: 'Estratégias',
};

export default function StrategiesPage() {
  return (
    <div className="container-wide flex flex-col gap-8 py-8 pb-12">
      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderComDados />
      </Suspense>

      <Suspense fallback={<ConteudoSkeleton />}>
        <Conteudo />
      </Suspense>
    </div>
  );
}

async function HeaderComDados() {
  const options = await listarOpcoesWizard();

  return (
    <PageHeader
      eyebrow="Controle"
      title="Estratégias"
      description="Organize suas apostas em torno de regras claras, gestão de stake e guardrails. Cada estratégia é um experimento que você acompanha no tempo."
      actions={
        <StrategyDialog
          mode="create"
          options={options}
          triggerClassName="h-10 w-full min-[480px]:w-auto sm:h-9"
        />
      }
    />
  );
}

async function Conteudo() {
  const [estrategias, options] = await Promise.all([
    listarEstrategiasDoUsuario(),
    listarOpcoesWizard(),
  ]);

  if (estrategias.length === 0) {
    return <EmptyState options={options} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <StrategiesResumo estrategias={estrategias} />
      <StrategiesGrid
        estrategias={estrategias}
        options={options}
        carregarDetalhe={obterDetalheEstrategia}
      />
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-9 w-36" />
    </div>
  );
}

function ConteudoSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
