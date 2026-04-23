import { Globe2 } from 'lucide-react';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { listarPaisesComEstatisticas } from '@/features/admin/paises/queries';

import { PaisDialog } from './_components/pais-dialog';
import { PaisesResumo } from './_components/paises-resumo';
import { PaisesTable } from './_components/paises-table';

export const metadata = {
  title: 'Países',
};

export default function PaisesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Administração"
        title="Países"
        description="Catálogo global de países, usado para agrupar ligas e times por federação."
        actions={<PaisDialog mode="create" />}
      />

      <Suspense fallback={<PaginaSkeleton />}>
        <ListaContainer />
      </Suspense>
    </div>
  );
}

async function ListaContainer() {
  const paises = await listarPaisesComEstatisticas();

  if (paises.length === 0) {
    return (
      <EmptyState
        icon={Globe2}
        title="Nenhum país cadastrado"
        description="Cadastre o primeiro país para começar a registrar ligas e times. Use o botão “Novo país” no topo."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PaisesResumo paises={paises} />
      <PaisesTable paises={paises} />
    </div>
  );
}

function PaginaSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-10 w-full max-w-sm rounded-md" />
      <div className="border-border/60 bg-card overflow-hidden rounded-xl border">
        <div className="divide-border/60 divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-[18px] w-6 rounded-[2px]" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-6 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
