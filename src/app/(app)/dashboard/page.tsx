import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarRange,
  PercentCircle,
  PlusCircle,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { StatCard, type StatTrend } from '@/components/dashboard/stat-card';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { StatusBadge, type Status } from '@/components/ui-kit/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { obterDashboardOverview } from '@/features/dashboard/queries';
import { formatDateTime, formatMoney, formatPercent } from '@/lib/format';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Resumo da sua banca, apostas e estratégias.',
};

// Dashboard depende de dados do usuário autenticado — não pode ser cacheado
// estaticamente entre sessões. Cada navegação refaz as queries (já com
// React.cache para deduplicar dentro do mesmo render).
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [user, overview] = await Promise.all([getCurrentUser(), obterDashboardOverview()]);

  const greetingName = user?.email?.split('@')[0] ?? 'apostador';

  const moeda = overview.banca.moeda_principal;
  const temBanca = overview.banca.qtd_bancas > 0;
  const temApostas = overview.apostas_total.total > 0;

  const variacaoPct = overview.banca.variacao_pct;
  const bancaTrend: StatTrend =
    variacaoPct == null ? 'neutral' : variacaoPct > 0 ? 'up' : variacaoPct < 0 ? 'down' : 'neutral';

  const roi = overview.apostas_total.roi_pct;
  const roiTrend: StatTrend =
    roi == null ? 'neutral' : roi > 0 ? 'up' : roi < 0 ? 'down' : 'neutral';

  const hit = overview.apostas_total.hit_rate_pct;
  const hitTrend: StatTrend = hit == null ? 'neutral' : hit >= 50 ? 'up' : 'down';

  const stats = [
    {
      label: 'Banca atual',
      value: temBanca
        ? formatMoney(overview.banca.saldo_atual_total, moeda)
        : formatMoney(0, moeda),
      hint: temBanca
        ? variacaoPct != null
          ? `${formatPercent(variacaoPct)} vs. inicial`
          : `${overview.banca.qtd_bancas_ativas} banca(s) ativa(s)`
        : 'Cadastre sua primeira banca',
      trend: bancaTrend,
      icon: Wallet,
      emphasis: 'brand' as const,
      accent: 'brand' as const,
    },
    {
      label: 'ROI',
      value: roi != null ? formatPercent(roi) : '—',
      hint:
        overview.apostas_total.ganhas + overview.apostas_total.perdidas > 0
          ? `${formatMoney(overview.apostas_total.lucro_total, moeda)} de lucro`
          : 'Sem apostas resolvidas',
      trend: roiTrend,
      icon: PercentCircle,
      accent: (roi != null && roi >= 0 ? 'win' : 'warn') as 'win' | 'warn',
    },
    {
      label: 'Taxa de acerto',
      value: hit != null ? `${hit.toFixed(1)}%` : '—',
      hint:
        overview.apostas_total.ganhas + overview.apostas_total.perdidas > 0
          ? `${overview.apostas_total.ganhas} de ${
              overview.apostas_total.ganhas + overview.apostas_total.perdidas
            } resolvidas`
          : 'Sem apostas resolvidas',
      trend: hitTrend,
      icon: Target,
      accent: 'info' as const,
    },
    {
      label: 'Apostas no mês',
      value: String(overview.apostas_mes.quantidade),
      hint: overview.apostas_mes.quantidade
        ? overview.apostas_mes.pendentes
          ? `${overview.apostas_mes.pendentes} pendente(s) · ${formatMoney(
              overview.apostas_mes.lucro,
              moeda,
            )}`
          : `Resultado: ${formatMoney(overview.apostas_mes.lucro, moeda)}`
        : 'Registre a primeira',
      trend: (overview.apostas_mes.lucro > 0
        ? 'up'
        : overview.apostas_mes.lucro < 0
          ? 'down'
          : 'neutral') as StatTrend,
      icon: CalendarRange,
      accent: 'neutral' as const,
    },
  ];

  return (
    <div className="container-wide flex flex-col gap-8 py-8">
      <PageHeader
        eyebrow="Visão geral"
        title={`Olá, ${greetingName}`}
        description="Aqui você acompanha o desempenho geral da sua banca e estratégias."
        actions={
          <Button
            className="shadow-brand-sm gap-2"
            nativeButton={false}
            render={<Link href="/bets" />}
          >
            <PlusCircle className="size-4" />
            Registrar aposta
          </Button>
        }
      />

      <section
        aria-label="Métricas principais"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden lg:col-span-2">
          <div
            aria-hidden="true"
            className="bg-primary/10 pointer-events-none absolute -top-32 -right-24 size-64 rounded-full blur-3xl"
          />
          <CardHeader className="relative">
            <CardTitle className="font-heading text-lg">
              {temApostas ? 'Atividade recente' : 'Evolução da banca'}
            </CardTitle>
            <CardDescription>
              {temApostas
                ? 'Últimas movimentações e atalhos para suas apostas.'
                : 'Os gráficos aparecem automaticamente assim que você registrar suas primeiras apostas.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            {temApostas ? (
              <RecentActivity overview={overview} />
            ) : temBanca ? (
              <EmptyState
                icon={Wallet}
                title="Pronto para começar"
                description="Sua banca está cadastrada. Registre sua primeira aposta para ver as métricas ganharem vida."
                action={
                  <Button className="gap-1" nativeButton={false} render={<Link href="/bets" />}>
                    Registrar primeira aposta
                    <ArrowUpRight className="size-4" />
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Wallet}
                title="Sem dados ainda"
                description="Cadastre sua banca inicial e comece a registrar apostas para ver sua evolução aqui."
                example={{
                  label: 'exemplo de banca',
                  preview: (
                    <div className="flex items-center gap-3">
                      <span className="bg-primary/15 text-primary flex size-7 items-center justify-center rounded-md text-[11px] font-semibold">
                        BP
                      </span>
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">Banca Principal</span>
                        <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
                          R$ 1.000,00 · Pinnacle
                        </span>
                      </div>
                    </div>
                  ),
                }}
                action={
                  <Button
                    variant="outline"
                    className="gap-1"
                    nativeButton={false}
                    render={<Link href="/banca" />}
                  >
                    Configurar banca
                    <ArrowUpRight className="size-4" />
                  </Button>
                }
                effortHint="2 campos · menos de 30 segundos"
              />
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader>
            <div className="border-primary/20 bg-primary/5 text-primary mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
              {temApostas ? 'Resumo' : 'Começar'}
            </div>
            <CardTitle className="font-heading text-lg">
              {temApostas ? 'Visão por área' : 'Próximos passos'}
            </CardTitle>
            <CardDescription>
              {temApostas
                ? 'Atalhos para o que está em movimento.'
                : 'Para começar a extrair valor do Smart Bet.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {temApostas ? (
              <SummaryByArea overview={overview} />
            ) : (
              <NextStepsList hasBanca={temBanca} hasEstrategia={overview.estrategias.total > 0} />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function RecentActivity({
  overview,
}: {
  overview: Awaited<ReturnType<typeof obterDashboardOverview>>;
}) {
  const moeda = overview.banca.moeda_principal;
  const ultima = overview.ultima_aposta;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Pendentes" value={overview.apostas_total.pendentes} />
        <MiniStat label="Ganhas" value={overview.apostas_total.ganhas} accent="win" />
        <MiniStat label="Perdidas" value={overview.apostas_total.perdidas} accent="loss" />
        <MiniStat
          label="Stake total"
          value={formatMoney(overview.apostas_total.stake_total, moeda)}
        />
      </div>

      {ultima && (
        <Link
          href={`/bets/${ultima.id}`}
          className="border-border hover:border-primary/40 hover:bg-primary/5 group flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors"
        >
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Última aposta
            </span>
            <div className="flex items-center gap-2">
              <StatusBadge status={mapStatus(ultima.status)} />
              <span className="text-foreground font-mono text-sm tabular-nums">
                {formatMoney(ultima.stake, moeda)} @ {ultima.odd_total.toFixed(2)}
              </span>
              {ultima.lucro != null && (
                <span
                  className={
                    'font-mono text-sm tabular-nums ' +
                    (ultima.lucro > 0
                      ? 'text-win'
                      : ultima.lucro < 0
                        ? 'text-loss'
                        : 'text-muted-foreground')
                  }
                >
                  {ultima.lucro > 0 ? '+' : ''}
                  {formatMoney(ultima.lucro, moeda)}
                </span>
              )}
            </div>
            <span className="text-muted-foreground text-xs">
              {formatDateTime(ultima.colocada_em)}
            </span>
          </div>
          <ArrowUpRight className="text-muted-foreground group-hover:text-primary size-5 transition-colors" />
        </Link>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/bets" />}>
          Ver todas as apostas
          <ArrowUpRight className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/strategies" />}
        >
          Estratégias
          <ArrowUpRight className="size-3.5" />
        </Button>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/banca" />}>
          Banca
          <ArrowUpRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function SummaryByArea({
  overview,
}: {
  overview: Awaited<ReturnType<typeof obterDashboardOverview>>;
}) {
  const moeda = overview.banca.moeda_principal;
  return (
    <div className="flex flex-col gap-3 text-sm">
      <SummaryRow
        icon={Wallet}
        label="Banca"
        primary={formatMoney(overview.banca.saldo_atual_total, moeda)}
        secondary={`${overview.banca.qtd_bancas_ativas} ativa(s)`}
        href="/banca"
      />
      <SummaryRow
        icon={Sparkles}
        label="Estratégias"
        primary={String(overview.estrategias.ativas)}
        secondary={`${overview.estrategias.total} no total`}
        href="/strategies"
      />
      <SummaryRow
        icon={Target}
        label="Apostas"
        primary={String(overview.apostas_total.total)}
        secondary={`${overview.apostas_total.pendentes} pendente(s)`}
        href="/bets"
      />
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  primary,
  secondary,
  href,
}: {
  icon: typeof Wallet;
  label: string;
  primary: string;
  secondary: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="border-border hover:border-primary/40 hover:bg-primary/5 group flex items-center gap-3 rounded-lg border p-3 transition-colors"
    >
      <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
        <Icon className="size-4" />
      </span>
      <div className="flex flex-1 flex-col">
        <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-foreground font-mono text-base font-semibold tabular-nums">
            {primary}
          </span>
          <span className="text-muted-foreground text-xs">{secondary}</span>
        </div>
      </div>
      <ArrowUpRight className="text-muted-foreground group-hover:text-primary size-4 transition-colors" />
    </Link>
  );
}

function MiniStat({
  label,
  value,
  accent = 'neutral',
}: {
  label: string;
  value: number | string;
  accent?: 'neutral' | 'win' | 'loss';
}) {
  const valueClass =
    accent === 'win' ? 'text-win' : accent === 'loss' ? 'text-loss' : 'text-foreground';
  return (
    <div className="border-border bg-muted/30 flex flex-col rounded-md border p-3">
      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
        {label}
      </span>
      <span className={`font-mono text-lg font-semibold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function NextStepsList({ hasBanca, hasEstrategia }: { hasBanca: boolean; hasEstrategia: boolean }) {
  return (
    <>
      <ol className="flex flex-col gap-3 text-sm">
        <Step n={1} done={hasBanca}>
          <span className="font-medium">Defina sua banca inicial.</span>{' '}
          <span className="text-muted-foreground">Base para todos os cálculos de ROI e yield.</span>
        </Step>
        <Step n={2} done={hasEstrategia}>
          <span className="font-medium">Crie sua primeira estratégia.</span>{' '}
          <span className="text-muted-foreground">Ex.: “Over 0.5 2° tempo (futebol)”.</span>
        </Step>
        <Step n={3} done={false}>
          <span className="font-medium">Registre apostas reais.</span>{' '}
          <span className="text-muted-foreground">O dashboard ganha vida em seguida.</span>
        </Step>
      </ol>

      <div className="border-border mt-5 border-t pt-4">
        <Link
          href="/banca"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
        >
          Cadastrar banca em Banca
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </>
  );
}

function Step({ n, done, children }: { n: number; done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={
          done
            ? 'bg-win text-win-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold'
            : 'border-border text-muted-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold'
        }
      >
        {n}
      </span>
      <p className="leading-relaxed">{children}</p>
    </li>
  );
}

function mapStatus(status: string): Status {
  switch (status) {
    case 'pendente':
      return 'pending';
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
