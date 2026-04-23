import { Users } from 'lucide-react';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  listarEsportesAtivos,
  listarPaisesOrdenados,
  listarTimesComEstatisticas,
} from '@/features/admin/times/queries';

import { TimeDialog } from './_components/time-dialog';
import { TimesCatalog } from './_components/times-catalog';
import { TimesResumo } from './_components/times-resumo';

export const metadata = {
  title: 'Times',
};

export default function TimesPage() {
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
 * Header com dialog de criação no mesmo boundary — esportes/países
 * cabem num único round-trip e não precisam de refetch quando o usuário
 * abrir o dialog.
 */
async function HeaderComDados() {
  const [esportes, paises] = await Promise.all([
    listarEsportesAtivos(),
    listarPaisesOrdenados(),
  ]);

  return (
    <PageHeader
      eyebrow="Administração"
      title="Times"
      description="Clubes e seleções disponíveis para vincular a partidas e apostas. Cadastre o escudo para melhorar a identificação visual."
      actions={<TimeDialog mode="create" esportes={esportes} paises={paises} />}
    />
  );
}

async function Conteudo() {
  const [times, esportes, paises] = await Promise.all([
    listarTimesComEstatisticas(),
    listarEsportesAtivos(),
    listarPaisesOrdenados(),
  ]);

  if (times.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum time cadastrado"
        description="Cadastre o primeiro time para começar a registrar partidas. Use o botão “Novo time” no topo."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <TimesResumo times={times} />
      <TimesCatalog times={times} esportes={esportes} paises={paises} />
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
    <div className="flex flex-col gap-6">
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 flex-1 min-w-[240px] rounded-md" />
        <Skeleton className="h-9 w-[180px] rounded-md" />
        <Skeleton className="h-9 w-[170px] rounded-md" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
