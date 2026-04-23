import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { listarApostas } from '@/features/bets/queries';
import {
  listarOpcoesWizard,
  obterEstrategia,
} from '@/features/strategies/queries';

import { StrategyHeader } from './_components/strategy-header';
import { StrategyTabs } from './_components/strategy-tabs';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const estrategia = await obterEstrategia(id);
  return {
    title: estrategia ? estrategia.nome : 'Estratégia',
  };
}

export default async function StrategyDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<DetailSkeleton />}>
        <Detail id={id} />
      </Suspense>
    </div>
  );
}

async function Detail({ id }: { id: string }) {
  const [estrategia, options, apostas] = await Promise.all([
    obterEstrategia(id),
    listarOpcoesWizard(),
    listarApostas({ estrategia_id: id }),
  ]);

  if (!estrategia) notFound();

  return (
    <>
      <StrategyHeader estrategia={estrategia} options={options} />
      <StrategyTabs estrategia={estrategia} apostas={apostas} />
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-40" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-12 w-80" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
