import { Shapes } from 'lucide-react';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { listarEsportesComEstatisticas } from '@/features/admin/esportes/queries';

import { EsporteDialog } from './_components/esporte-dialog';
import { EsportesGrid } from './_components/esportes-grid';
import { EsportesResumo } from './_components/esportes-resumo';

export const metadata = {
  title: 'Esportes',
};

export default function EsportesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Administração"
        title="Esportes"
        description="Catálogo global de modalidades suportadas. Cada esporte agrupa ligas, times e tipos de aposta."
        actions={<EsporteDialog mode="create" />}
      />

      <Suspense fallback={<PaginaSkeleton />}>
        <ListaContainer />
      </Suspense>
    </div>
  );
}

async function ListaContainer() {
  const esportes = await listarEsportesComEstatisticas();

  if (esportes.length === 0) {
    return (
      <EmptyState
        icon={Shapes}
        title="Nenhum esporte cadastrado"
        description="Cadastre a primeira modalidade para liberar tipos de aposta, ligas e times. Use o botão “Novo esporte” no topo."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <EsportesResumo esportes={esportes} />
      <EsportesGrid esportes={esportes} />
    </div>
  );
}

function PaginaSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
