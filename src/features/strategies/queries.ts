import 'server-only';

import { cache } from 'react';

import { requireAuth } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

import type {
  RuleGroup,
  StrategyInput,
} from './schema';

type EstrategiaRow = Database['public']['Tables']['estrategias']['Row'];
type StatusEstrategia = Database['public']['Enums']['status_estrategia'];
type MetodoStake = Database['public']['Enums']['metodo_stake'];

export type StrategyListItem = {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string | null;
  status: StatusEstrategia;
  tags: string[];
  contextos: string[];
  metodo_stake: MetodoStake;
  odd_minima: number | null;
  odd_maxima: number | null;
  regras_versao: number;
  criado_em: string;
  atualizado_em: string;
  arquivada_em: string | null;
  estrategia_pai_id: string | null;
  esporte: { id: number; nome: string; slug: string };
  tipos_aposta_count: number;
  ligas_count: number;
  progresso: {
    total_apostas: number;
    total_greens: number;
    total_reds: number;
    lucro_acumulado: number;
    reds_consecutivos: number;
    greens_consecutivos: number;
  } | null;
};

export type StrategyDetail = StrategyListItem & {
  regras: RuleGroup;
  gestao: StrategyInput['gestao'];
  escopo: {
    esporte_id: number;
    tipos_aposta_ids: number[];
    ligas_ids: number[];
    contextos: ('pre_live' | 'ao_vivo')[];
    odd_minima: number | null;
    odd_maxima: number | null;
    minuto_minimo: number | null;
  };
  guardrails: StrategyInput['guardrails'];
  tipos_aposta: { id: number; nome: string; slug: string }[];
  ligas: { id: number; nome: string; slug: string }[];
};

export type WizardOptions = {
  esportes: { id: number; nome: string; slug: string }[];
  tipos_aposta: { id: number; nome: string; slug: string; esporte_id: number }[];
  ligas: { id: number; nome: string; slug: string; esporte_id: number }[];
};

// ---------------------------------------------------------------------------
// listarEstrategiasDoUsuario — cards da listagem
// ---------------------------------------------------------------------------

export const listarEstrategiasDoUsuario = cache(
  async (): Promise<StrategyListItem[]> => {
    await requireAuth();
    const supabase = await createSupabaseServerClient();

    const [estrategiasRes, tiposRes, ligasRes, progressoRes] = await Promise.all([
      supabase
        .from('estrategias')
        .select(
          `
          id, nome, descricao, cor, status, tags, contextos, metodo_stake,
          odd_minima, odd_maxima, regras_versao, criado_em, atualizado_em,
          arquivada_em, estrategia_pai_id,
          esporte:esportes!inner(id, nome, slug)
          `,
        )
        .order('status', { ascending: true })
        .order('atualizado_em', { ascending: false }),
      supabase.from('estrategias_tipos_aposta').select('estrategia_id'),
      supabase.from('estrategias_ligas').select('estrategia_id'),
      supabase
        .from('estrategias_progresso')
        .select(
          'estrategia_id, total_apostas, total_greens, total_reds, lucro_acumulado, reds_consecutivos, greens_consecutivos',
        ),
    ]);

    if (estrategiasRes.error) {
      throw new Error(
        `listarEstrategiasDoUsuario: ${estrategiasRes.error.message}`,
      );
    }

    const tiposCount = new Map<string, number>();
    for (const row of tiposRes.data ?? []) {
      tiposCount.set(row.estrategia_id, (tiposCount.get(row.estrategia_id) ?? 0) + 1);
    }
    const ligasCount = new Map<string, number>();
    for (const row of ligasRes.data ?? []) {
      ligasCount.set(row.estrategia_id, (ligasCount.get(row.estrategia_id) ?? 0) + 1);
    }
    const progresso = new Map<string, StrategyListItem['progresso']>();
    for (const row of progressoRes.data ?? []) {
      progresso.set(row.estrategia_id, {
        total_apostas: row.total_apostas,
        total_greens: row.total_greens,
        total_reds: row.total_reds,
        lucro_acumulado: Number(row.lucro_acumulado),
        reds_consecutivos: row.reds_consecutivos,
        greens_consecutivos: row.greens_consecutivos,
      });
    }

    return (estrategiasRes.data ?? []).map((e) => ({
      id: e.id,
      nome: e.nome,
      descricao: e.descricao,
      cor: e.cor,
      status: e.status,
      tags: e.tags,
      contextos: e.contextos,
      metodo_stake: e.metodo_stake,
      odd_minima: e.odd_minima != null ? Number(e.odd_minima) : null,
      odd_maxima: e.odd_maxima != null ? Number(e.odd_maxima) : null,
      regras_versao: e.regras_versao,
      criado_em: e.criado_em,
      atualizado_em: e.atualizado_em,
      arquivada_em: e.arquivada_em,
      estrategia_pai_id: e.estrategia_pai_id,
      esporte: e.esporte,
      tipos_aposta_count: tiposCount.get(e.id) ?? 0,
      ligas_count: ligasCount.get(e.id) ?? 0,
      progresso: progresso.get(e.id) ?? null,
    }));
  },
);

// ---------------------------------------------------------------------------
// obterEstrategia — detalhe
// ---------------------------------------------------------------------------

export const obterEstrategia = cache(
  async (id: string): Promise<StrategyDetail | null> => {
    await requireAuth();
    const supabase = await createSupabaseServerClient();

    const [estrategiaRes, tiposRes, ligasRes, progressoRes] = await Promise.all([
      supabase
        .from('estrategias')
        .select(
          `
          *,
          esporte:esportes!inner(id, nome, slug)
          `,
        )
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('estrategias_tipos_aposta')
        .select('tipo_aposta:tipos_aposta!inner(id, nome, slug)')
        .eq('estrategia_id', id),
      supabase
        .from('estrategias_ligas')
        .select('liga:ligas!inner(id, nome, slug)')
        .eq('estrategia_id', id),
      supabase
        .from('estrategias_progresso')
        .select('*')
        .eq('estrategia_id', id)
        .maybeSingle(),
    ]);

    if (estrategiaRes.error) {
      throw new Error(`obterEstrategia: ${estrategiaRes.error.message}`);
    }
    const e = estrategiaRes.data as EstrategiaRow & {
      esporte: { id: number; nome: string; slug: string };
    } | null;
    if (!e) return null;

    const tipos = (tiposRes.data ?? [])
      .map((r) => r.tipo_aposta as { id: number; nome: string; slug: string })
      .filter(Boolean);
    const ligas = (ligasRes.data ?? [])
      .map((r) => r.liga as { id: number; nome: string; slug: string })
      .filter(Boolean);

    const progresso = progressoRes.data;

    const regras = (e.regras_jsonb ?? {
      tipo: 'grupo',
      operador: 'AND',
      filhos: [],
    }) as RuleGroup;

    const stakeConfig = (e.stake_config ?? {
      metodo: e.metodo_stake,
    }) as StrategyInput['gestao']['stake_config'];

    return {
      id: e.id,
      nome: e.nome,
      descricao: e.descricao,
      cor: e.cor,
      status: e.status,
      tags: e.tags,
      contextos: e.contextos,
      metodo_stake: e.metodo_stake,
      odd_minima: e.odd_minima != null ? Number(e.odd_minima) : null,
      odd_maxima: e.odd_maxima != null ? Number(e.odd_maxima) : null,
      regras_versao: e.regras_versao,
      criado_em: e.criado_em,
      atualizado_em: e.atualizado_em,
      arquivada_em: e.arquivada_em,
      estrategia_pai_id: e.estrategia_pai_id,
      esporte: e.esporte,
      tipos_aposta_count: tipos.length,
      ligas_count: ligas.length,
      progresso: progresso
        ? {
            total_apostas: progresso.total_apostas,
            total_greens: progresso.total_greens,
            total_reds: progresso.total_reds,
            lucro_acumulado: Number(progresso.lucro_acumulado),
            reds_consecutivos: progresso.reds_consecutivos,
            greens_consecutivos: progresso.greens_consecutivos,
          }
        : null,
      regras,
      gestao: {
        metodo_stake: e.metodo_stake,
        stake_config: stakeConfig,
        banca_referencia: e.banca_referencia as StrategyInput['gestao']['banca_referencia'],
        edge_minimo: e.edge_minimo != null ? Number(e.edge_minimo) : null,
        stop_loss_reds: e.stop_loss_reds,
        stop_loss_banca_pct:
          e.stop_loss_banca_pct != null ? Number(e.stop_loss_banca_pct) : null,
      },
      escopo: {
        esporte_id: e.esporte_id,
        tipos_aposta_ids: tipos.map((t) => t.id),
        ligas_ids: ligas.map((l) => l.id),
        contextos: e.contextos as ('pre_live' | 'ao_vivo')[],
        odd_minima: e.odd_minima != null ? Number(e.odd_minima) : null,
        odd_maxima: e.odd_maxima != null ? Number(e.odd_maxima) : null,
        minuto_minimo: e.minuto_minimo,
      },
      guardrails: {
        drawdown_alerta_pct:
          e.drawdown_alerta_pct != null ? Number(e.drawdown_alerta_pct) : null,
        reds_consec_alerta: e.reds_consec_alerta,
        yield_minimo_alerta:
          e.yield_minimo_alerta != null ? Number(e.yield_minimo_alerta) : null,
        revisao_apos_apostas: e.revisao_apos_apostas,
        revisao_apos_dias: e.revisao_apos_dias,
      },
      tipos_aposta: tipos,
      ligas,
    };
  },
);

// ---------------------------------------------------------------------------
// listarOpcoesWizard — dados para o wizard (todos os selects em 1 round-trip)
// ---------------------------------------------------------------------------

export const listarOpcoesWizard = cache(async (): Promise<WizardOptions> => {
  await requireAuth();
  const supabase = await createSupabaseServerClient();

  const [esportesRes, tiposRes, ligasRes] = await Promise.all([
    supabase
      .from('esportes')
      .select('id, nome, slug')
      .eq('ativo', true)
      .order('nome', { ascending: true }),
    supabase
      .from('tipos_aposta')
      .select('id, nome, slug, esporte_id')
      .eq('ativo', true)
      .order('nome', { ascending: true }),
    supabase
      .from('ligas')
      .select('id, nome, slug, esporte_id')
      .eq('ativo', true)
      .order('nome', { ascending: true }),
  ]);

  if (esportesRes.error) throw new Error(esportesRes.error.message);
  if (tiposRes.error) throw new Error(tiposRes.error.message);
  if (ligasRes.error) throw new Error(ligasRes.error.message);

  return {
    esportes: esportesRes.data ?? [],
    tipos_aposta: tiposRes.data ?? [],
    ligas: ligasRes.data ?? [],
  };
});
