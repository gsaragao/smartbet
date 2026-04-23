import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  History,
  Scale,
  Wallet,
} from 'lucide-react';
import { Suspense } from 'react';

import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import {
  listarEventosBanca,
  obterBanca,
  type BancaDetalhe,
} from '@/features/banca/queries';
import { formatMoney, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

import { EventoDialog } from './_components/evento-dialog';
import { EventosTable } from './_components/eventos-table';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const banca = await obterBanca(id);
  return {
    title: banca ? `${banca.nome} · Banca` : 'Banca',
  };
}

export default async function BancaDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const banca = await obterBanca(id);
  if (!banca) notFound();

  return (
    <div className="container-wide flex flex-col gap-8 py-8 pb-14">
      {/* Bloco hero: agrupa navegação + título + CTA com fundo suave e borda,
          lendo como “painel” único em vez de elementos soltos no branco. */}
      <div
        className={cn(
          'border-border/60 from-card via-card to-muted/25 relative overflow-hidden rounded-2xl border',
          'bg-gradient-to-br shadow-sm',
          'p-5 sm:p-8',
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 size-[min(55vw,22rem)] rounded-full bg-primary/[0.07] blur-3xl"
        />
        <div className="relative flex flex-col gap-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground w-fit gap-1.5 px-2 -ml-2"
            nativeButton={false}
            render={
              <Link href="/banca">
                <ArrowLeft className="size-4 shrink-0" />
                Voltar para bancas
              </Link>
            }
          />

          <PageHeader
            eyebrow={banca.casa_de_aposta ?? 'Banca'}
            eyebrowAsTag
            title={banca.nome}
            description={`Controle detalhado, eventos financeiros e evolução do saldo em ${banca.moeda}.`}
            actions={
              <EventoDialog
                bancaId={banca.id}
                triggerClassName="h-10 w-full min-[480px]:w-auto sm:h-9"
              />
            }
            className="gap-5 sm:gap-4"
          />
        </div>
      </div>

      <ResumoCards banca={banca} />

      {banca.total_ajustes !== 0 && (
        <p className="text-muted-foreground -mt-2 text-center text-xs sm:text-left">
          Ajustes manuais líquidos:{' '}
          <span className="text-foreground font-mono font-medium tabular-nums">
            {formatMoney(banca.total_ajustes, banca.moeda)}
          </span>
        </p>
      )}

      <section className="flex flex-col gap-5">
        <div className="border-border/50 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-foreground text-lg font-semibold tracking-tight">
              Histórico de eventos
            </h2>
            <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
              Extrato com data, tipo e valores. Toque em um evento no celular para ver detalhes e ações.
            </p>
          </div>
          <span className="bg-muted/80 text-muted-foreground w-fit rounded-full px-3 py-1 text-xs font-medium tabular-nums">
            {banca.qtd_eventos} evento{banca.qtd_eventos === 1 ? '' : 's'}
          </span>
        </div>

        <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
          <EventosContainer bancaId={banca.id} moeda={banca.moeda} />
        </Suspense>
      </section>
    </div>
  );
}

const kpiCardClass =
  'transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:hover:transform-none';

function ResumoCards({ banca }: { banca: BancaDetalhe }) {
  const variacao = banca.variacao_pct;

  const hintDepositos =
    banca.total_depositos === 0
      ? 'Nenhum depósito após a criação.'
      : 'Total aportado após a criação.';

  const hintSaques =
    banca.total_saques === 0
      ? 'Sem saques registrados.'
      : 'Total retirado após a criação.';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        className={kpiCardClass}
        label="Saldo atual"
        value={formatMoney(Number(banca.saldo_atual), banca.moeda)}
        hint={`Inicial: ${formatMoney(Number(banca.saldo_inicial), banca.moeda)}`}
        emphasis="brand"
        icon={Wallet}
        trend={
          variacao === null
            ? 'neutral'
            : variacao > 0
              ? 'up'
              : variacao < 0
                ? 'down'
                : 'neutral'
        }
      />
      <StatCard
        className={kpiCardClass}
        label="Variação"
        value={variacao === null ? '—' : formatPercent(variacao)}
        hint="Relativa ao saldo inicial."
        icon={Scale}
        accent="info"
        trend={
          variacao === null
            ? 'neutral'
            : variacao > 0
              ? 'up'
              : variacao < 0
                ? 'down'
                : 'neutral'
        }
      />
      <StatCard
        className={kpiCardClass}
        label="Depósitos"
        value={formatMoney(banca.total_depositos, banca.moeda)}
        hint={hintDepositos}
        icon={ArrowDownCircle}
        accent="win"
        trend={banca.total_depositos > 0 ? 'up' : 'neutral'}
      />
      <StatCard
        className={kpiCardClass}
        label="Saques"
        value={formatMoney(banca.total_saques, banca.moeda)}
        hint={hintSaques}
        icon={ArrowUpCircle}
        accent="neutral"
        trend="neutral"
      />
    </div>
  );
}

async function EventosContainer({
  bancaId,
  moeda,
}: {
  bancaId: string;
  moeda: string;
}) {
  const eventos = await listarEventosBanca(bancaId);

  if (eventos.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sem eventos ainda"
        description="Registre depósitos, saques ou ajustes para manter o saldo atual sempre reconciliado."
        action={<EventoDialog bancaId={bancaId} triggerClassName="w-full sm:w-auto" />}
      />
    );
  }

  return <EventosTable bancaId={bancaId} eventos={eventos} moeda={moeda} />;
}
