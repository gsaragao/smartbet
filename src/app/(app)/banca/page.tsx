import { Wallet } from 'lucide-react';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { listarBancas } from '@/features/banca/queries';

import { BancaDialog } from './_components/banca-dialog';
import { BancasGrid } from './_components/bancas-grid';
import { BancasResumo } from './_components/bancas-resumo';

export const metadata = {
  title: 'Banca',
};

export default async function BancaPage() {
  return (
    <div className="container-wide flex flex-col gap-10 py-8">
      <PageHeader
        eyebrow="Operação"
        title="Suas bancas"
        description="Controle o saldo de cada conta ou casa de aposta. Registre depósitos, saques e ajustes em um só lugar."
        actions={
          <Suspense fallback={<Skeleton className="h-9 w-32" />}>
            <BancaDialog mode="create" />
          </Suspense>
        }
      />

      <Suspense fallback={<CardsSkeleton />}>
        <BancasSection />
      </Suspense>
    </div>
  );
}

async function BancasSection() {
  const bancas = await listarBancas();

  if (bancas.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Você ainda não tem bancas"
        description="Crie sua primeira banca para começar a registrar operações. Você pode ter múltiplas bancas (ex.: por casa de aposta) e definir uma como principal."
        example={{
          label: 'exemplo',
          preview: (
            <div className="flex items-center gap-3">
              <span className="bg-primary/15 text-primary flex size-7 items-center justify-center rounded-md text-[11px] font-semibold">
                CP
              </span>
              <div className="flex flex-col">
                <span className="text-foreground font-medium">Conta principal</span>
                <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
                  R$ 1.000,00 · Bet365 · BRL
                </span>
              </div>
            </div>
          ),
        }}
        action={<BancaDialog mode="create" />}
        effortHint="3 campos · menos de 30 segundos"
      />
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Seção 1: resumo agregado. É o "big picture" — responde em 3s
          "quanto eu tenho e como isso está variando?" */}
      <section aria-labelledby="banca-resumo-title" className="flex flex-col gap-4">
        <SectionTitle id="banca-resumo-title" title="Resumo consolidado" />
        <BancasResumo bancas={bancas} />
      </section>

      {/* Seção 2: operação concreta. É onde o usuário clica para agir em
          cada banca individualmente. */}
      <section aria-labelledby="banca-lista-title" className="flex flex-col gap-4">
        <SectionTitle
          id="banca-lista-title"
          title="Bancas ativas"
          subtitle={`${bancas.length} banca${bancas.length === 1 ? '' : 's'} no total`}
        />
        <BancasGrid bancas={bancas} />
      </section>
    </div>
  );
}

/**
 * Section divider with a subtle uppercase eyebrow and an optional subtitle
 * on the right side. Creates a visual "chapter break" between KPIs and
 * operational cards — avoids the "wall of cards" feeling.
 */
function SectionTitle({
  id,
  title,
  subtitle,
}: {
  id: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2
        id={id}
        className="font-heading text-foreground text-sm font-semibold tracking-tight"
      >
        {title}
      </h2>
      {subtitle && (
        <span className="text-muted-foreground text-xs tabular-nums">{subtitle}</span>
      )}
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}
