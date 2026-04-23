import 'server-only';

import { cache } from 'react';

import { requireAuth } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type DashboardOverview = {
  // Banca consolidada (somando todas as bancas ativas)
  banca: {
    saldo_atual_total: number;
    saldo_inicial_total: number;
    variacao_pct: number | null;
    moeda_principal: string;
    qtd_bancas: number;
    qtd_bancas_ativas: number;
    principal: { id: string; nome: string; moeda: string } | null;
  };
  // Apostas - all-time
  apostas_total: {
    total: number;
    pendentes: number;
    ganhas: number;
    perdidas: number;
    stake_total: number;
    stake_resolvido_pago: number;
    lucro_total: number;
    roi_pct: number | null;
    hit_rate_pct: number | null;
  };
  // Apostas no mês corrente (calendário local)
  apostas_mes: {
    quantidade: number;
    pendentes: number;
    lucro: number;
    roi_pct: number | null;
  };
  // Estratégias
  estrategias: {
    total: number;
    ativas: number;
    pausadas: number;
  };
  // Última aposta para destaque/atalho
  ultima_aposta: {
    id: string;
    status: string;
    stake: number;
    odd_total: number;
    lucro: number | null;
    colocada_em: string;
  } | null;
};

function inicioDoMes(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

export const obterDashboardOverview = cache(
  async (): Promise<DashboardOverview> => {
    await requireAuth();
    const supabase = await createSupabaseServerClient();

    const inicioMes = inicioDoMes().toISOString();

    const [bancasRes, apostasRes, estrategiasRes, ultimaApostaRes] =
      await Promise.all([
        supabase
          .from('bancas')
          .select(
            'id, nome, moeda, saldo_inicial, saldo_atual, e_principal, ativa',
          ),
        supabase
          .from('apostas')
          .select('status, stake, lucro, eh_freebet, colocada_em'),
        supabase.from('estrategias').select('id, status'),
        supabase
          .from('apostas')
          .select('id, status, stake, odd_total, lucro, colocada_em')
          .order('colocada_em', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (bancasRes.error)
      throw new Error(`obterDashboardOverview.bancas: ${bancasRes.error.message}`);
    if (apostasRes.error)
      throw new Error(`obterDashboardOverview.apostas: ${apostasRes.error.message}`);
    if (estrategiasRes.error)
      throw new Error(
        `obterDashboardOverview.estrategias: ${estrategiasRes.error.message}`,
      );
    if (ultimaApostaRes.error && ultimaApostaRes.error.code !== 'PGRST116')
      throw new Error(
        `obterDashboardOverview.ultimaAposta: ${ultimaApostaRes.error.message}`,
      );

    const bancas = bancasRes.data ?? [];
    const ativas = bancas.filter((b) => b.ativa);
    const principal = ativas.find((b) => b.e_principal) ?? ativas[0] ?? null;

    const saldoInicialTotal = ativas.reduce(
      (acc, b) => acc + Number(b.saldo_inicial ?? 0),
      0,
    );
    const saldoAtualTotal = ativas.reduce(
      (acc, b) => acc + Number(b.saldo_atual ?? 0),
      0,
    );
    const variacaoPct = saldoInicialTotal
      ? ((saldoAtualTotal - saldoInicialTotal) / saldoInicialTotal) * 100
      : null;

    const apostas = apostasRes.data ?? [];
    let total = 0;
    let pendentes = 0;
    let ganhas = 0;
    let perdidas = 0;
    let stakeTotal = 0;
    let stakeResolvidoPago = 0;
    let lucroTotal = 0;

    let mesQuantidade = 0;
    let mesPendentes = 0;
    let mesLucro = 0;
    let mesStakeResolvidoPago = 0;

    for (const r of apostas) {
      const stake = Number(r.stake ?? 0);
      const lucro = r.lucro != null ? Number(r.lucro) : 0;
      const noMes = r.colocada_em && r.colocada_em >= inicioMes;

      total += 1;
      stakeTotal += stake;
      if (noMes) mesQuantidade += 1;

      if (r.status === 'pendente') {
        pendentes += 1;
        if (noMes) mesPendentes += 1;
        continue;
      }
      if (r.status === 'ganha' || r.status === 'meio_green') ganhas += 1;
      else if (r.status === 'perdida' || r.status === 'meio_red') perdidas += 1;

      if (r.status !== 'anulada') {
        lucroTotal += lucro;
        if (!r.eh_freebet) stakeResolvidoPago += stake;
        if (noMes) {
          mesLucro += lucro;
          if (!r.eh_freebet) mesStakeResolvidoPago += stake;
        }
      }
    }

    const resolvidas = ganhas + perdidas;
    const roiPct =
      stakeResolvidoPago > 0 ? (lucroTotal / stakeResolvidoPago) * 100 : null;
    const hitRatePct = resolvidas > 0 ? (ganhas / resolvidas) * 100 : null;
    const mesRoiPct =
      mesStakeResolvidoPago > 0
        ? (mesLucro / mesStakeResolvidoPago) * 100
        : null;

    const estrategias = estrategiasRes.data ?? [];
    const estrategiasAtivas = estrategias.filter((e) => e.status === 'ativa').length;
    const estrategiasPausadas = estrategias.filter(
      (e) => e.status === 'pausada',
    ).length;

    const ultima = ultimaApostaRes.data;

    return {
      banca: {
        saldo_atual_total: saldoAtualTotal,
        saldo_inicial_total: saldoInicialTotal,
        variacao_pct: variacaoPct,
        moeda_principal: principal?.moeda ?? 'BRL',
        qtd_bancas: bancas.length,
        qtd_bancas_ativas: ativas.length,
        principal: principal
          ? { id: principal.id, nome: principal.nome, moeda: principal.moeda }
          : null,
      },
      apostas_total: {
        total,
        pendentes,
        ganhas,
        perdidas,
        stake_total: stakeTotal,
        stake_resolvido_pago: stakeResolvidoPago,
        lucro_total: lucroTotal,
        roi_pct: roiPct,
        hit_rate_pct: hitRatePct,
      },
      apostas_mes: {
        quantidade: mesQuantidade,
        pendentes: mesPendentes,
        lucro: mesLucro,
        roi_pct: mesRoiPct,
      },
      estrategias: {
        total: estrategias.length,
        ativas: estrategiasAtivas,
        pausadas: estrategiasPausadas,
      },
      ultima_aposta: ultima
        ? {
            id: ultima.id,
            status: ultima.status,
            stake: Number(ultima.stake ?? 0),
            odd_total: Number(ultima.odd_total ?? 0),
            lucro: ultima.lucro != null ? Number(ultima.lucro) : null,
            colocada_em: ultima.colocada_em,
          }
        : null,
    };
  },
);
