import {
  ArrowLeft,
  CircleDollarSign,
  Info,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, type Status } from '@/components/ui-kit/status-badge';
import { obterAposta } from '@/features/bets/queries';
import { formatDateTime, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

import { BetReopenButton } from '../_components/bet-reopen-button';
import { BetResolveButton } from '../_components/bet-resolve-button';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const aposta = await obterAposta(id);
  const nome = aposta?.selecao_resumo?.descricao ?? 'Aposta';
  return { title: `${nome} · Aposta` };
}

export default async function BetDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<DetailSkeleton />}>
        <Detail id={id} />
      </Suspense>
    </div>
  );
}

async function Detail({ id }: { id: string }) {
  const aposta = await obterAposta(id);
  if (!aposta) notFound();

  const moeda = aposta.banca?.moeda ?? 'BRL';
  const status = mapStatus(aposta.status);
  const partida = aposta.selecao_resumo?.partida;

  return (
    <>
      {/* Voltar + breadcrumb */}
      <div>
        <Link
          href="/bets"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-3.5" />
          Voltar para apostas
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {aposta.estrategia?.cor && (
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: aposta.estrategia.cor }}
              />
            )}
            <h1 className="font-heading text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
              {partida
                ? `${partida.mandante ?? '—'} × ${partida.visitante ?? '—'}`
                : (aposta.selecao_resumo?.descricao ?? 'Aposta')}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {aposta.selecao_resumo?.descricao ?? '—'}
            {aposta.selecao_resumo?.linha
              ? ` · linha ${aposta.selecao_resumo.linha}`
              : ''}
            {aposta.selecao_resumo?.tipo_aposta_nome
              ? ` · ${aposta.selecao_resumo.tipo_aposta_nome}`
              : ''}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={status} label={statusLabel(aposta.status)} />
            {aposta.eh_freebet && (
              <Badge variant="outline">
                <Sparkles className="mr-1 size-3" /> Freebet
              </Badge>
            )}
            {aposta.estrategia_override && (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              >
                Override
              </Badge>
            )}
            {aposta.estrategia && (
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link href={`/strategies/${aposta.estrategia.id}`} />
                }
              >
                <Target className="size-3.5" />
                {aposta.estrategia.nome}
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {aposta.status === 'pendente' ? (
            <BetResolveButton aposta={aposta} />
          ) : (
            <BetReopenButton id={aposta.id} />
          )}
          <span className="text-muted-foreground text-[11px]">
            Registrada em {formatDateTime(aposta.colocada_em)}
            {aposta.resolvida_em
              ? ` · resolvida em ${formatDateTime(aposta.resolvida_em)}`
              : ''}
          </span>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={CircleDollarSign}
          label="Stake"
          value={formatMoney(aposta.stake, moeda)}
        />
        <KpiCard
          icon={Target}
          label="Odd total"
          value={aposta.odd_total.toFixed(2)}
          mono
        />
        <KpiCard
          icon={Wallet}
          label="Retorno potencial"
          value={formatMoney(aposta.stake * aposta.odd_total, moeda)}
        />
        <KpiCard
          icon={Info}
          label="Lucro"
          value={aposta.lucro != null ? formatMoney(aposta.lucro, moeda) : '—'}
          tone={
            aposta.lucro != null
              ? aposta.lucro > 0
                ? 'pos'
                : aposta.lucro < 0
                  ? 'neg'
                  : 'neutral'
              : 'neutral'
          }
        />
      </section>

      {/* Detalhes */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border-border/70 bg-card col-span-2 flex flex-col gap-4 rounded-xl border p-5">
          <h2 className="text-foreground text-sm font-semibold">Seleções</h2>
          <ul className="divide-border/60 divide-y">
            {aposta.selecoes.map((s) => (
              <li key={s.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-foreground text-sm font-medium">
                      {s.descricao}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {s.partida
                        ? `${s.partida.mandante ?? '—'} × ${s.partida.visitante ?? '—'}`
                        : '—'}
                      {s.partida?.liga ? ` · ${s.partida.liga.nome}` : ''}
                      {s.partida?.inicio
                        ? ` · ${formatDateTime(s.partida.inicio)}`
                        : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold tabular-nums">
                      {s.odd.toFixed(2)}
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      {s.tipo_aposta?.nome ?? ''}
                      {s.linha ? ` · ${s.linha}` : ''}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-border/70 bg-card flex flex-col gap-4 rounded-xl border p-5">
          <h2 className="text-foreground text-sm font-semibold">Contexto</h2>
          <Info2 label="Banca" value={aposta.banca?.nome ?? '—'} />
          <Info2
            label="Casa de aposta"
            value={aposta.casa_de_aposta ?? '—'}
          />
          <Info2
            label="Edge"
            value={aposta.edge != null ? `${aposta.edge.toFixed(2)}%` : '—'}
          />
          <Info2
            label="Valor esperado"
            value={
              aposta.valor_esperado != null
                ? formatMoney(aposta.valor_esperado, moeda)
                : '—'
            }
          />
          {aposta.estrategia_override && aposta.motivo_override && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
              <div className="font-semibold text-amber-700 dark:text-amber-300">
                Motivo do override
              </div>
              <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                {aposta.motivo_override}
              </p>
            </div>
          )}
          {aposta.observacao && (
            <div>
              <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Observação
              </div>
              <p className="text-foreground mt-1 text-sm">{aposta.observacao}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  mono,
  tone = 'neutral',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'pos' | 'neg' | 'neutral';
}) {
  const toneClass =
    tone === 'pos'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'neg'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-foreground';
  return (
    <div className="border-border/70 bg-card flex flex-col gap-1.5 rounded-xl border p-4">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div
        className={cn(
          'text-xl font-semibold',
          mono && 'font-mono tabular-nums',
          toneClass,
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

type AnyApostaStatus = NonNullable<Awaited<ReturnType<typeof obterAposta>>>['status'];

function mapStatus(s: AnyApostaStatus): Status {
  switch (s) {
    case 'ganha':
    case 'meio_green':
      return 'win';
    case 'perdida':
    case 'meio_red':
      return 'loss';
    case 'anulada':
      return 'void';
    case 'cashout':
      return 'cashout';
    default:
      return 'pending';
  }
}

function statusLabel(s: string) {
  const LABELS: Record<string, string> = {
    pendente: 'Pendente',
    ganha: 'Green',
    perdida: 'Red',
    anulada: 'Anulada',
    cashout: 'Cashout',
    meio_green: 'Meio green',
    meio_red: 'Meio red',
  };
  return LABELS[s] ?? s;
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-32" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
