import { Trophy } from 'lucide-react';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  listarEsportesAtivos,
  listarLigasComEstatisticas,
  listarPaisesOrdenados,
} from '@/features/admin/ligas/queries';

import { LigaDialog } from './_components/liga-dialog';
import { LigasResumo } from './_components/ligas-resumo';
import { LigasTable } from './_components/ligas-table';

export const metadata = {
  title: 'Ligas',
};

export default function LigasPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderComDados />
      </Suspense>

      <Suspense fallback={<ConteudoSkeleton />}>
        <Conteudo />
      </Suspense>
    </div>
  );
}

/**
 * O header depende de esportes/países para conseguir injetar o dialog de
 * criação. Como esses requests são pequenos, ficam no mesmo Suspense boundary
 * e poupam a necessidade de um segundo refetch quando o dialog é aberto.
 */
async function HeaderComDados() {
  const [esportes, paises] = await Promise.all([
    listarEsportesAtivos(),
    listarPaisesOrdenados(),
  ]);

  return (
    <PageHeader
      eyebrow="Administração"
      title="Ligas"
      description="Competições disponíveis para classificar partidas e apostas. Use ligas internacionais quando não houver país de sede."
      actions={
        <LigaDialog mode="create" esportes={esportes} paises={paises} />
      }
    />
  );
}

async function Conteudo() {
  const [ligas, esportes, paises] = await Promise.all([
    listarLigasComEstatisticas(),
    listarEsportesAtivos(),
    listarPaisesOrdenados(),
  ]);

  if (ligas.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Nenhuma liga cadastrada"
        description="Cadastre a primeira liga para começar a registrar partidas e apostas. Use o botão “Nova liga” no topo."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <LigasResumo ligas={ligas} />
      <LigasTable ligas={ligas} esportes={esportes} paises={paises} />
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  );
}

function ConteudoSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="border-border/60 bg-card overflow-hidden rounded-xl border">
        <div className="grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-[1fr_200px_200px]">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="ml-auto h-6 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
