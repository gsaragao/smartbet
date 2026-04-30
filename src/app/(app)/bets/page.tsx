import Link from 'next/link';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { listarApostas, listarOpcoesRegistro, resumoApostas } from '@/features/bets/queries';

import { BetDialog } from './_components/bet-dialog';
import { BetsGrid } from './_components/bets-grid';
import { BetsResumo } from './_components/bets-resumo';
import { EmptyState } from './_components/empty-state';

export const metadata = {
  title: 'Apostas',
};

export default function BetsPage() {
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
  const options = await listarOpcoesRegistro();
  const semBanca = options.bancas.length === 0;

  return (
    <PageHeader
      eyebrow="Operação"
      title="Apostas"
      description="Registre suas entradas, valide contra a estratégia e acompanhe o desempenho em tempo real. Apostas pendentes ainda não afetam sua banca."
      actions={
        semBanca ? (
          <Button variant="outline" nativeButton={false} render={<Link href="/banca" />}>
            Cadastrar banca
          </Button>
        ) : (
          <BetDialog options={options} triggerClassName="h-10 w-full min-[480px]:w-auto sm:h-9" />
        )
      }
    />
  );
}

async function Conteudo() {
  const [apostas, options, resumo] = await Promise.all([
    listarApostas(),
    listarOpcoesRegistro(),
    resumoApostas(),
  ]);

  if (apostas.length === 0) {
    return <EmptyState options={options} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <BetsResumo resumo={resumo} />
      <BetsGrid apostas={apostas} options={options} />
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-40" />
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
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
