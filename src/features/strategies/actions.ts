'use server';

import { revalidatePath } from 'next/cache';

import { requireExecutor } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

import { strategyInputSchema, strategyUpdateSchema, type StrategyInput } from './schema';

type EstrategiaInsert = Database['public']['Tables']['estrategias']['Insert'];
type EstrategiaUpdate = Database['public']['Tables']['estrategias']['Update'];

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const REVALIDATE_PATH = '/strategies';

function zodToFieldErrors(error: import('zod').ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function isUniqueViolation(err: { code?: string }) {
  return err.code === '23505';
}

function isFkViolation(err: { code?: string }) {
  return err.code === '23503';
}

/**
 * Traduz o `StrategyInput` (formato rico usado no wizard) para o formato
 * achatado persistido em `public.estrategias`. As junções N:N são aplicadas
 * separadamente.
 */
function toEstrategiaRow(input: StrategyInput, usuario_id: string): EstrategiaInsert {
  const arquivadaEm = input.identidade.status === 'arquivada' ? new Date().toISOString() : null;

  return {
    usuario_id,
    nome: input.identidade.nome,
    descricao: input.identidade.descricao || null,
    cor: input.identidade.cor,
    tags: input.identidade.tags,
    status: input.identidade.status,
    contextos: input.escopo.contextos,
    esporte_id: input.escopo.esporte_id,
    odd_minima: input.escopo.odd_minima,
    odd_maxima: input.escopo.odd_maxima,
    minuto_minimo: input.escopo.minuto_minimo,
    metodo_stake: input.gestao.metodo_stake,
    stake_config: input.gestao
      .stake_config as unknown as Database['public']['Tables']['estrategias']['Insert']['stake_config'],
    banca_referencia: input.gestao.banca_referencia,
    edge_minimo: input.gestao.edge_minimo,
    stop_loss_reds: input.gestao.stop_loss_reds,
    stop_loss_banca_pct: input.gestao.stop_loss_banca_pct,
    drawdown_alerta_pct: input.guardrails.drawdown_alerta_pct,
    reds_consec_alerta: input.guardrails.reds_consec_alerta,
    yield_minimo_alerta: input.guardrails.yield_minimo_alerta,
    revisao_apos_apostas: input.guardrails.revisao_apos_apostas,
    revisao_apos_dias: input.guardrails.revisao_apos_dias,
    regras_jsonb:
      input.regras as unknown as Database['public']['Tables']['estrategias']['Insert']['regras_jsonb'],
    tipo_aposta_id: input.escopo.tipos_aposta_ids[0] ?? null,
    arquivada_em: arquivadaEm,
  };
}

async function syncJuncoes(estrategia_id: string, usuario_id: string, input: StrategyInput) {
  const supabase = await createSupabaseServerClient();

  // Reset total e reinserção — operação controlada pelo dono via RLS.
  const [delTipos, delLigas] = await Promise.all([
    supabase.from('estrategias_tipos_aposta').delete().eq('estrategia_id', estrategia_id),
    supabase.from('estrategias_ligas').delete().eq('estrategia_id', estrategia_id),
  ]);
  if (delTipos.error) throw new Error(delTipos.error.message);
  if (delLigas.error) throw new Error(delLigas.error.message);

  if (input.escopo.tipos_aposta_ids.length > 0) {
    const rows = input.escopo.tipos_aposta_ids.map((id) => ({
      estrategia_id,
      tipo_aposta_id: id,
      usuario_id,
    }));
    const { error } = await supabase.from('estrategias_tipos_aposta').insert(rows);
    if (error) throw new Error(error.message);
  }

  if (input.escopo.ligas_ids.length > 0) {
    const rows = input.escopo.ligas_ids.map((id) => ({
      estrategia_id,
      liga_id: id,
      usuario_id,
    }));
    const { error } = await supabase.from('estrategias_ligas').insert(rows);
    if (error) throw new Error(error.message);
  }
}

// ---------------------------------------------------------------------------
// Criar
// ---------------------------------------------------------------------------

export async function criarEstrategia(input: unknown): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  const profile = authResult;

  const parsed = strategyInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const insertRow = toEstrategiaRow(parsed.data, profile.id);

  const { data, error } = await supabase
    .from('estrategias')
    .insert(insertRow)
    .select('id')
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Já existe uma estratégia com esse nome.',
        fieldErrors: { 'identidade.nome': ['Nome já utilizado.'] },
      };
    }
    if (isFkViolation(error)) {
      return {
        ok: false,
        message: 'Esporte, liga ou tipo de aposta não existe mais. Atualize a página.',
      };
    }
    return { ok: false, message: error.message };
  }

  try {
    await syncJuncoes(data.id, profile.id, parsed.data);
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }

  revalidatePath(REVALIDATE_PATH);
  return { ok: true, data: { id: data.id } };
}

// ---------------------------------------------------------------------------
// Atualizar
// ---------------------------------------------------------------------------

export async function atualizarEstrategia(input: unknown): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  const profile = authResult;

  const parsed = strategyUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { id, ...data } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const updateRow: EstrategiaUpdate = toEstrategiaRow(data, profile.id);

  const { error } = await supabase.from('estrategias').update(updateRow).eq('id', id);

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Já existe uma estratégia com esse nome.',
        fieldErrors: { 'identidade.nome': ['Nome já utilizado.'] },
      };
    }
    return { ok: false, message: error.message };
  }

  try {
    await syncJuncoes(id, profile.id, data);
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }

  revalidatePath(REVALIDATE_PATH);
  revalidatePath(`${REVALIDATE_PATH}/${id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Status (pausar / ativar / arquivar)
// ---------------------------------------------------------------------------

async function mudarStatus(
  id: string,
  status: Database['public']['Enums']['status_estrategia'],
): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  if (!id) return { ok: false, message: 'ID inválido.' };

  const supabase = await createSupabaseServerClient();
  const patch: EstrategiaUpdate = {
    status,
    arquivada_em: status === 'arquivada' ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from('estrategias').update(patch).eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidatePath(REVALIDATE_PATH);
  revalidatePath(`${REVALIDATE_PATH}/${id}`);
  return { ok: true };
}

export async function pausarEstrategia(id: string) {
  return mudarStatus(id, 'pausada');
}

export async function ativarEstrategia(id: string) {
  return mudarStatus(id, 'ativa');
}

export async function arquivarEstrategia(id: string) {
  return mudarStatus(id, 'arquivada');
}

// ---------------------------------------------------------------------------
// Excluir
// ---------------------------------------------------------------------------

export async function excluirEstrategia(id: string): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  if (!id) return { ok: false, message: 'ID inválido.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('estrategias').delete().eq('id', id);

  if (error) {
    if (isFkViolation(error)) {
      return {
        ok: false,
        message: 'Esta estratégia possui apostas vinculadas. Arquive em vez de excluir.',
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Duplicar (clone + opção A/B)
// ---------------------------------------------------------------------------

export async function duplicarEstrategia(
  id: string,
  opcoes: { comoAB: boolean } = { comoAB: false },
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  const profile = authResult;
  if (!id) return { ok: false, message: 'ID inválido.' };

  const supabase = await createSupabaseServerClient();

  const [origemRes, tiposRes, ligasRes] = await Promise.all([
    supabase.from('estrategias').select('*').eq('id', id).maybeSingle(),
    supabase.from('estrategias_tipos_aposta').select('tipo_aposta_id').eq('estrategia_id', id),
    supabase.from('estrategias_ligas').select('liga_id').eq('estrategia_id', id),
  ]);

  if (origemRes.error || !origemRes.data) {
    return { ok: false, message: 'Estratégia de origem não encontrada.' };
  }
  const origem = origemRes.data;

  const novoNome = await gerarNomeDuplicata(origem.nome, profile.id);

  const insertRow: EstrategiaInsert = {
    usuario_id: profile.id,
    nome: novoNome,
    descricao: origem.descricao,
    cor: origem.cor,
    tags: origem.tags,
    status: 'pausada',
    contextos: origem.contextos,
    esporte_id: origem.esporte_id,
    odd_minima: origem.odd_minima,
    odd_maxima: origem.odd_maxima,
    minuto_minimo: origem.minuto_minimo,
    metodo_stake: origem.metodo_stake,
    stake_config: origem.stake_config,
    banca_referencia: origem.banca_referencia,
    edge_minimo: origem.edge_minimo,
    stop_loss_reds: origem.stop_loss_reds,
    stop_loss_banca_pct: origem.stop_loss_banca_pct,
    drawdown_alerta_pct: origem.drawdown_alerta_pct,
    reds_consec_alerta: origem.reds_consec_alerta,
    yield_minimo_alerta: origem.yield_minimo_alerta,
    revisao_apos_apostas: origem.revisao_apos_apostas,
    revisao_apos_dias: origem.revisao_apos_dias,
    regras_jsonb: origem.regras_jsonb,
    tipo_aposta_id: origem.tipo_aposta_id,
    estrategia_pai_id: opcoes.comoAB ? id : null,
  };

  const { data: novo, error } = await supabase
    .from('estrategias')
    .insert(insertRow)
    .select('id')
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  const tipos = (tiposRes.data ?? []).map((r) => r.tipo_aposta_id);
  const ligas = (ligasRes.data ?? []).map((r) => r.liga_id);

  if (tipos.length > 0) {
    const { error: e } = await supabase.from('estrategias_tipos_aposta').insert(
      tipos.map((t) => ({
        estrategia_id: novo.id,
        tipo_aposta_id: t,
        usuario_id: profile.id,
      })),
    );
    if (e) return { ok: false, message: e.message };
  }
  if (ligas.length > 0) {
    const { error: e } = await supabase.from('estrategias_ligas').insert(
      ligas.map((l) => ({
        estrategia_id: novo.id,
        liga_id: l,
        usuario_id: profile.id,
      })),
    );
    if (e) return { ok: false, message: e.message };
  }

  revalidatePath(REVALIDATE_PATH);
  return { ok: true, data: { id: novo.id } };
}

async function gerarNomeDuplicata(base: string, usuario_id: string): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('estrategias').select('nome').eq('usuario_id', usuario_id);

  const nomes = new Set((data ?? []).map((r) => r.nome.toLowerCase()));
  let candidato = `${base} (cópia)`;
  let i = 2;
  while (nomes.has(candidato.toLowerCase())) {
    candidato = `${base} (cópia ${i})`;
    i += 1;
  }
  return candidato;
}

// ---------------------------------------------------------------------------
// Aplicar template (atalho: cria uma estratégia a partir de um template)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Carregar detalhe (para abrir wizard em modo edição sem prop drilling)
// ---------------------------------------------------------------------------

export async function obterDetalheEstrategia(id: string) {
  const { obterEstrategia } = await import('./queries');
  return obterEstrategia(id);
}

export async function criarEstrategiaDeTemplate(payload: {
  templateId: string;
  esporte_id: number;
  tipos_aposta_ids: number[];
}): Promise<ActionResult<{ id: string }>> {
  const { STRATEGY_TEMPLATES } = await import('./templates');
  const template = STRATEGY_TEMPLATES.find((t) => t.id === payload.templateId);
  if (!template) return { ok: false, message: 'Template não encontrado.' };

  const input = template.build({
    esporte_id: payload.esporte_id,
    tipos_aposta_ids: payload.tipos_aposta_ids,
  });

  return criarEstrategia(input);
}
