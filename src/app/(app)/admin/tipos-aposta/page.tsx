import { ListChecks } from 'lucide-react';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import {
  listarEsportesAtivos,
  listarTiposAposta,
} from '@/features/admin/tipos-aposta/queries';

import { TipoApostaDialog } from './_components/tipo-aposta-dialog';
import { TiposApostaCatalog } from './_components/tipos-aposta-catalog';
import { TiposApostaResumo } from './_components/tipos-aposta-resumo';

export const metadata = {
  title: 'Tipos de aposta',
};

export default async function TiposApostaPage() {
  // Kick both queries in parallel — Promise.all lets the RSC payload stream
  // the full page in a single round trip.
  const esportesPromise = listarEsportesAtivos();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Administração"
        title="Tipos de aposta"
        description="Catálogo global de mercados disponíveis para apostas e estratégias."
        actions={
          <Suspense fallback={<Skeleton className="h-9 w-32" />}>
            <NovoTipoButton />
          </Suspense>
        }
      />

      <Suspense fallback={<ConteudoSkeleton />}>
        <ListaContainer esportesPromise={esportesPromise} />
      </Suspense>
    </div>
  );
}

async function NovoTipoButton() {
  const esportes = await listarEsportesAtivos();
  return <TipoApostaDialog mode="create" esportes={esportes} />;
}

async function ListaContainer({
  esportesPromise,
}: {
  esportesPromise: Promise<Awaited<ReturnType<typeof listarEsportesAtivos>>>;
}) {
  const [tipos, esportes] = await Promise.all([listarTiposAposta(), esportesPromise]);

  if (tipos.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Nenhum tipo cadastrado"
        description="Cadastre o primeiro mercado para começar. Os tipos de aposta alimentam todas as estratégias e seleções criadas pelos usuários."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <TiposApostaResumo tipos={tipos} />
      <TiposApostaCatalog tipos={tipos} esportes={esportes} />
    </div>
  );
}

function ConteudoSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-[200px] rounded-md" />
        <Skeleton className="h-10 w-[170px] rounded-md" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
