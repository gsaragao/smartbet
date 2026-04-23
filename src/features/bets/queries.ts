import 'server-only';

import { cache } from 'react';

import { requireAuth } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

import type { RuleGroup } from '@/features/strategies/schema';
import type { StrategyScope } from './rules-evaluator';

type StatusAposta = Database['public']['Enums']['status_aposta'];
type FormatoAposta = Database['public']['Enums']['formato_aposta'];

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type BetListItem = {
  id: string;
  colocada_em: string;
  resolvida_em: string | null;
  formato: FormatoAposta;
  status: StatusAposta;
  stake: number;
  odd_total: number;
  lucro: number | null;
  eh_freebet: boolean;
  estrategia_override: boolean;
  casa_de_aposta: string | null;
  descricao: string | null;

  banca: { id: string; nome: string; moeda: string } | null;
  estrategia: { id: string; nome: string; cor: string | null } | null;
  qtd_selecoes: number;

  // Primeira seleção, útil para preview em card/tabela
  selecao_resumo: {
    descricao: string;
    linha: string | null;
    odd: number;
    tipo_aposta_id: number | null;
    tipo_aposta_nome: string | null;
    partida: {
      id: string | null;
      mandante: string | null;
      visitante: string | null;
      inicio: string | null;
      liga_id: number | null;
      liga_nome: string | null;
      time_mandante_id: number | null;
      time_visitante_id: number | null;
    } | null;
  } | null;
};

export type BetResolutionContext = {
  saldo_atual_banca: number;
  moeda: string;
  progresso: {
    passo_atual: number;
    greens_consecutivos: number;
    reds_consecutivos: number;
    total_apostas: number;
    total_greens: number;
    total_reds: number;
    lucro_acumulado: number;
  } | null;
};

export type BetDetail = BetListItem & {
  observacao: string | null;
  motivo_override: string | null;
  edge: number | null;
  valor_esperado: number | null;
  selecoes: Array<{
    id: string;
    descricao: string;
    linha: string | null;
    odd: number;
    status: StatusAposta;
    tipo_aposta: { id: number; nome: string; slug: string } | null;
    partida: {
      id: string;
      mandante: string | null;
      visitante: string | null;
      inicio: string;
      liga: { id: number; nome: string } | null;
      esporte_id: number;
    } | null;
  }>;
};

export type BetFilters = {
  status?: 'todas' | 'pendentes' | 'resolvidas' | StatusAposta;
  estrategia_id?: string;
  banca_id?: string;
  de?: string;
  ate?: string;
};

export type BetsResumoData = {
  total: number;
  pendentes: number;
  ganhas: number;
  perdidas: number;
  stake_total: number;
  lucro_total: number;
  roi: number;
  hit_rate: number;
};

export type RegistroOptions = {
  bancas: Array<{ id: string; nome: string; moeda: string; e_principal: boolean }>;
  estrategias: Array<{
    id: string;
    nome: string;
    cor: string | null;
    status: 'ativa' | 'pausada' | 'arquivada';
    regras: RuleGroup;
    escopo: StrategyScope;
  }>;
  tipos_aposta: Array<{
    id: number;
    nome: string;
    slug: string;
    esporte_id: number;
    categoria: string;
  }>;
  esportes: Array<{ id: number; nome: string; slug: string }>;
  ligas: Array<{ id: number; nome: string; slug: string; esporte_id: number }>;
};

// ---------------------------------------------------------------------------
// listarApostas — lista paginada (S1: sem paginação ainda, apenas ordem desc)
// ---------------------------------------------------------------------------

export const listarApostas = cache(
  async (filtros: BetFilters = {}): Promise<BetListItem[]> => {
    await requireAuth();
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from('apostas')
      .select(
        `
        id, colocada_em, resolvida_em, formato, status, stake, odd_total, lucro,
        eh_freebet, estrategia_override, casa_de_aposta, descricao,
        banca:bancas!inner(id, nome, moeda),
        estrategia:estrategias(id, nome, cor),
        selecoes:apostas_selecoes(
          id, descricao, linha, odd,
          tipo_aposta:tipos_aposta(id, nome),
          partida:partidas(
            id, mandante_nome, visitante_nome, inicio,
            time_mandante:times!partidas_time_mandante_id_fkey(id, nome),
            time_visitante:times!partidas_time_visitante_id_fkey(id, nome),
            liga:ligas(id, nome)
          )
        )
        `,
      )
      .order('colocada_em', { ascending: false });

    if (filtros.status && filtros.status !== 'todas') {
      if (filtros.status === 'pendentes') {
        query = query.eq('status', 'pendente');
      } else if (filtros.status === 'resolvidas') {
        query = query.neq('status', 'pendente');
      } else {
        query = query.eq('status', filtros.status);
      }
    }

    if (filtros.estrategia_id) query = query.eq('estrategia_id', filtros.estrategia_id);
    if (filtros.banca_id) query = query.eq('banca_id', filtros.banca_id);
    if (filtros.de) query = query.gte('colocada_em', filtros.de);
    if (filtros.ate) query = query.lte('colocada_em', filtros.ate);

    const { data, error } = await query;
    if (error) throw new Error(`listarApostas: ${error.message}`);

    return (data ?? []).map((row) => {
      const selecoes = (row.selecoes ?? []) as Array<{
        id: string;
        descricao: string;
        linha: string | null;
        odd: number;
        tipo_aposta: { id: number; nome: string } | null;
        partida: {
          id: string;
          mandante_nome: string | null;
          visitante_nome: string | null;
          inicio: string;
          time_mandante: { id: number; nome: string } | null;
          time_visitante: { id: number; nome: string } | null;
          liga: { id: number; nome: string } | null;
        } | null;
      }>;

      const primeiraSelecao = selecoes[0];

      const selecaoResumo = primeiraSelecao
        ? {
            descricao: primeiraSelecao.descricao,
            linha: primeiraSelecao.linha,
            odd: Number(primeiraSelecao.odd),
            tipo_aposta_id: primeiraSelecao.tipo_aposta?.id ?? null,
            tipo_aposta_nome: primeiraSelecao.tipo_aposta?.nome ?? null,
            partida: primeiraSelecao.partida
              ? {
                  id: primeiraSelecao.partida.id,
                  mandante:
                    primeiraSelecao.partida.time_mandante?.nome ??
                    primeiraSelecao.partida.mandante_nome ??
                    null,
                  visitante:
                    primeiraSelecao.partida.time_visitante?.nome ??
                    primeiraSelecao.partida.visitante_nome ??
                    null,
                  inicio: primeiraSelecao.partida.inicio,
                  liga_id: primeiraSelecao.partida.liga?.id ?? null,
                  liga_nome: primeiraSelecao.partida.liga?.nome ?? null,
                  time_mandante_id:
                    primeiraSelecao.partida.time_mandante?.id ?? null,
                  time_visitante_id:
                    primeiraSelecao.partida.time_visitante?.id ?? null,
                }
              : null,
          }
        : null;

      return {
        id: row.id,
        colocada_em: row.colocada_em,
        resolvida_em: row.resolvida_em,
        formato: row.formato,
        status: row.status,
        stake: Number(row.stake),
        odd_total: Number(row.odd_total),
        lucro: row.lucro != null ? Number(row.lucro) : null,
        eh_freebet: row.eh_freebet,
        estrategia_override: row.estrategia_override,
        casa_de_aposta: row.casa_de_aposta,
        descricao: row.descricao,
        banca: (row.banca as BetListItem['banca']) ?? null,
        estrategia: (row.estrategia as BetListItem['estrategia']) ?? null,
        qtd_selecoes: selecoes.length,
        selecao_resumo: selecaoResumo,
      };
    });
  },
);

// ---------------------------------------------------------------------------
// obterAposta — detalhe
// ---------------------------------------------------------------------------

export const obterAposta = cache(
  async (id: string): Promise<BetDetail | null> => {
    await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('apostas')
      .select(
        `
        id, colocada_em, resolvida_em, formato, status, stake, odd_total, lucro,
        eh_freebet, estrategia_override, motivo_override, edge, valor_esperado,
        casa_de_aposta, descricao, observacao,
        banca:bancas!inner(id, nome, moeda),
        estrategia:estrategias(id, nome, cor),
        selecoes:apostas_selecoes(
          id, descricao, linha, odd, status,
          tipo_aposta:tipos_aposta(id, nome, slug),
          partida:partidas(
            id, mandante_nome, visitante_nome, inicio, esporte_id,
            time_mandante:times!partidas_time_mandante_id_fkey(id, nome),
            time_visitante:times!partidas_time_visitante_id_fkey(id, nome),
            liga:ligas(id, nome)
          )
        )
        `,
      )
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`obterAposta: ${error.message}`);
    if (!data) return null;

    type Row = typeof data;
    const row = data as Row;

    const selecoes = (row.selecoes ?? []).map((s) => {
      const partida = s.partida;
      return {
        id: s.id,
        descricao: s.descricao,
        linha: s.linha,
        odd: Number(s.odd),
        status: s.status,
        tipo_aposta: s.tipo_aposta
          ? {
              id: s.tipo_aposta.id,
              nome: s.tipo_aposta.nome,
              slug: s.tipo_aposta.slug,
            }
          : null,
        partida: partida
          ? {
              id: partida.id,
              mandante: partida.time_mandante?.nome ?? partida.mandante_nome,
              visitante: partida.time_visitante?.nome ?? partida.visitante_nome,
              inicio: partida.inicio,
              liga: partida.liga ? { id: partida.liga.id, nome: partida.liga.nome } : null,
              esporte_id: partida.esporte_id,
            }
          : null,
      };
    });

    const primeira = selecoes[0] ?? null;

    return {
      id: row.id,
      colocada_em: row.colocada_em,
      resolvida_em: row.resolvida_em,
      formato: row.formato,
      status: row.status,
      stake: Number(row.stake),
      odd_total: Number(row.odd_total),
      lucro: row.lucro != null ? Number(row.lucro) : null,
      eh_freebet: row.eh_freebet,
      estrategia_override: row.estrategia_override,
      casa_de_aposta: row.casa_de_aposta,
      descricao: row.descricao,
      observacao: row.observacao,
      motivo_override: row.motivo_override,
      edge: row.edge != null ? Number(row.edge) : null,
      valor_esperado: row.valor_esperado != null ? Number(row.valor_esperado) : null,
      banca: (row.banca as BetDetail['banca']) ?? null,
      estrategia: (row.estrategia as BetDetail['estrategia']) ?? null,
      qtd_selecoes: selecoes.length,
      selecao_resumo: primeira
        ? {
            descricao: primeira.descricao,
            linha: primeira.linha,
            odd: primeira.odd,
            tipo_aposta_id: primeira.tipo_aposta?.id ?? null,
            tipo_aposta_nome: primeira.tipo_aposta?.nome ?? null,
            partida: primeira.partida
              ? {
                  id: primeira.partida.id,
                  mandante: primeira.partida.mandante,
                  visitante: primeira.partida.visitante,
                  inicio: primeira.partida.inicio,
                  liga_id: primeira.partida.liga?.id ?? null,
                  liga_nome: primeira.partida.liga?.nome ?? null,
                  time_mandante_id: null,
                  time_visitante_id: null,
                }
              : null,
          }
        : null,
      selecoes,
    };
  },
);

// ---------------------------------------------------------------------------
// listarOpcoesRegistro — tudo que o BetDialog precisa em 1 round-trip
// ---------------------------------------------------------------------------

export const listarOpcoesRegistro = cache(
  async (): Promise<RegistroOptions> => {
    await requireAuth();
    const supabase = await createSupabaseServerClient();

    const [
      bancasRes,
      estrategiasRes,
      estrategiasLigasRes,
      estrategiasTiposRes,
      tiposRes,
      esportesRes,
      ligasRes,
    ] = await Promise.all([
      supabase
        .from('bancas')
        .select('id, nome, moeda, e_principal')
        .eq('ativa', true)
        .order('e_principal', { ascending: false })
        .order('nome', { ascending: true }),
      supabase
        .from('estrategias')
        .select(
          `
          id, nome, cor, status, esporte_id, contextos,
          tipo_aposta_id, odd_minima, odd_maxima, minuto_minimo,
          regras_jsonb
          `,
        )
        .neq('status', 'arquivada')
        .order('status', { ascending: true })
        .order('nome', { ascending: true }),
      supabase.from('estrategias_ligas').select('estrategia_id, liga_id'),
      supabase
        .from('estrategias_tipos_aposta')
        .select('estrategia_id, tipo_aposta_id'),
      supabase
        .from('tipos_aposta')
        .select('id, nome, slug, esporte_id, categoria')
        .eq('ativo', true)
        .order('nome', { ascending: true }),
      supabase
        .from('esportes')
        .select('id, nome, slug')
        .eq('ativo', true)
        .order('nome', { ascending: true }),
      supabase
        .from('ligas')
        .select('id, nome, slug, esporte_id')
        .eq('ativo', true)
        .order('nome', { ascending: true }),
    ]);

    if (bancasRes.error) throw new Error(bancasRes.error.message);
    if (estrategiasRes.error) throw new Error(estrategiasRes.error.message);
    if (estrategiasLigasRes.error) throw new Error(estrategiasLigasRes.error.message);
    if (estrategiasTiposRes.error) throw new Error(estrategiasTiposRes.error.message);
    if (tiposRes.error) throw new Error(tiposRes.error.message);
    if (esportesRes.error) throw new Error(esportesRes.error.message);
    if (ligasRes.error) throw new Error(ligasRes.error.message);

    const ligasPorEstrategia = new Map<string, number[]>();
    for (const r of estrategiasLigasRes.data ?? []) {
      const arr = ligasPorEstrategia.get(r.estrategia_id) ?? [];
      arr.push(r.liga_id);
      ligasPorEstrategia.set(r.estrategia_id, arr);
    }
    const tiposPorEstrategia = new Map<string, number[]>();
    for (const r of estrategiasTiposRes.data ?? []) {
      const arr = tiposPorEstrategia.get(r.estrategia_id) ?? [];
      arr.push(r.tipo_aposta_id);
      tiposPorEstrategia.set(r.estrategia_id, arr);
    }

    const estrategias: RegistroOptions['estrategias'] = (estrategiasRes.data ?? []).map(
      (e) => ({
        id: e.id,
        nome: e.nome,
        cor: e.cor,
        status: e.status,
        regras: (e.regras_jsonb ?? {
          tipo: 'grupo',
          operador: 'AND',
          filhos: [],
        }) as RuleGroup,
        escopo: {
          esporte_id: e.esporte_id,
          tipos_aposta_ids:
            tiposPorEstrategia.get(e.id) ??
            (e.tipo_aposta_id != null ? [e.tipo_aposta_id] : []),
          ligas_ids: ligasPorEstrategia.get(e.id) ?? [],
          contextos: (e.contextos ?? []) as ('pre_live' | 'ao_vivo')[],
          odd_minima: e.odd_minima != null ? Number(e.odd_minima) : null,
          odd_maxima: e.odd_maxima != null ? Number(e.odd_maxima) : null,
          minuto_minimo: e.minuto_minimo,
        },
      }),
    );

    return {
      bancas: bancasRes.data ?? [],
      estrategias,
      tipos_aposta: tiposRes.data ?? [],
      esportes: esportesRes.data ?? [],
      ligas: ligasRes.data ?? [],
    };
  },
);

// ---------------------------------------------------------------------------
// resumoApostas — KPIs da barra superior
// ---------------------------------------------------------------------------

export const resumoApostas = cache(
  async (filtros: BetFilters = {}): Promise<BetsResumoData> => {
    await requireAuth();
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from('apostas')
      .select('status, stake, lucro, eh_freebet');

    if (filtros.estrategia_id) query = query.eq('estrategia_id', filtros.estrategia_id);
    if (filtros.banca_id) query = query.eq('banca_id', filtros.banca_id);
    if (filtros.de) query = query.gte('colocada_em', filtros.de);
    if (filtros.ate) query = query.lte('colocada_em', filtros.ate);

    const { data, error } = await query;
    if (error) throw new Error(`resumoApostas: ${error.message}`);

    const rows = data ?? [];

    let pendentes = 0;
    let ganhas = 0;
    let perdidas = 0;
    let stakeTotal = 0;
    let stakeResolvidoPago = 0; // exclui freebet e anulada do denominador do ROI
    let lucroTotal = 0;

    for (const r of rows) {
      const stake = Number(r.stake ?? 0);
      const lucro = r.lucro != null ? Number(r.lucro) : 0;

      stakeTotal += stake;
      if (r.status === 'pendente') {
        pendentes += 1;
        continue;
      }
      if (r.status === 'ganha' || r.status === 'meio_green') {
        ganhas += 1;
      } else if (r.status === 'perdida' || r.status === 'meio_red') {
        perdidas += 1;
      }
      if (r.status !== 'anulada') {
        lucroTotal += lucro;
        if (!r.eh_freebet) {
          stakeResolvidoPago += stake;
        }
      }
    }

    const resolvidas = ganhas + perdidas;
    const roi = stakeResolvidoPago > 0 ? (lucroTotal / stakeResolvidoPago) * 100 : 0;
    const hit_rate = resolvidas > 0 ? (ganhas / resolvidas) * 100 : 0;

    return {
      total: rows.length,
      pendentes,
      ganhas,
      perdidas,
      stake_total: stakeTotal,
      lucro_total: lucroTotal,
      roi,
      hit_rate,
    };
  },
);

// ---------------------------------------------------------------------------
// obterContextoResolucao — usado pelo preview de resolução
// ---------------------------------------------------------------------------

export const obterContextoResolucao = cache(
  async (aposta_id: string): Promise<BetResolutionContext | null> => {
    await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { data: aposta, error } = await supabase
      .from('apostas')
      .select(
        `
        id, banca_id, estrategia_id,
        banca:bancas!inner(saldo_atual, moeda)
        `,
      )
      .eq('id', aposta_id)
      .maybeSingle();

    if (error) throw new Error(`obterContextoResolucao: ${error.message}`);
    if (!aposta) return null;

    const banca = aposta.banca as { saldo_atual: number; moeda: string };

    let progresso: BetResolutionContext['progresso'] = null;
    if (aposta.estrategia_id) {
      const { data: p } = await supabase
        .from('estrategias_progresso')
        .select(
          `passo_atual, greens_consecutivos, reds_consecutivos,
           total_apostas, total_greens, total_reds, lucro_acumulado`,
        )
        .eq('estrategia_id', aposta.estrategia_id)
        .maybeSingle();

      if (p) {
        progresso = {
          passo_atual: p.passo_atual,
          greens_consecutivos: p.greens_consecutivos,
          reds_consecutivos: p.reds_consecutivos,
          total_apostas: p.total_apostas,
          total_greens: p.total_greens,
          total_reds: p.total_reds,
          lucro_acumulado: Number(p.lucro_acumulado),
        };
      }
    }

    return {
      saldo_atual_banca: Number(banca.saldo_atual),
      moeda: banca.moeda,
      progresso,
    };
  },
);

// ---------------------------------------------------------------------------
// buscarTimes — autocomplete do PartidaPicker
// ---------------------------------------------------------------------------

export type TimeOption = {
  id: number;
  nome: string;
  slug: string;
  esporte_id: number;
  pais_nome: string | null;
};

export async function buscarTimes(
  query: string,
  esporte_id?: number,
): Promise<TimeOption[]> {
  await requireAuth();
  const supabase = await createSupabaseServerClient();

  const q = query.trim();
  if (q.length < 2) return [];

  let sb = supabase
    .from('times')
    .select('id, nome, slug, esporte_id, pais:paises(nome)')
    .ilike('nome', `%${q}%`)
    .order('nome', { ascending: true })
    .limit(20);

  if (esporte_id && esporte_id > 0) sb = sb.eq('esporte_id', esporte_id);

  const { data, error } = await sb;
  if (error) throw new Error(`buscarTimes: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    esporte_id: row.esporte_id,
    pais_nome:
      (row.pais as { nome?: string } | null)?.nome ?? null,
  }));
}
