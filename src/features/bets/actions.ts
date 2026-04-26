'use server';

import { revalidatePath } from 'next/cache';

import { requireAuth, requireExecutor } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

import type { RuleGroup } from '@/features/strategies/schema';
import {
  betInputSchema,
  betResolveSchema,
  betUpdateSchema,
  calcularOddTotalMultipla,
  type BetInput,
  type BetSelectionInput,
  type PartidaInput,
} from './schema';
import {
  avaliarApostaVsEstrategia,
  type BetContext,
  type StrategyScope,
} from './rules-evaluator';

type ApostaUpdate = Database['public']['Tables']['apostas']['Update'];

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
      violacoes?: string[];
    };

const REVALIDATE_PATH = '/bets';

function zodToFieldErrors(error: import('zod').ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function isFkViolation(err: { code?: string }) {
  return err.code === '23503';
}

// ---------------------------------------------------------------------------
// Validação de regras (server-side hard-check)
// ---------------------------------------------------------------------------

async function validarContraEstrategia(
  input: BetInput,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<{ ok: boolean; violacoes: string[] }> {
  if (!input.estrategia_id) return { ok: true, violacoes: [] };

  const [estrategiaRes, tiposRes, ligasRes] = await Promise.all([
    supabase
      .from('estrategias')
      .select(
        `id, esporte_id, odd_minima, odd_maxima, minuto_minimo, contextos,
         tipo_aposta_id, regras_jsonb`,
      )
      .eq('id', input.estrategia_id)
      .maybeSingle(),
    supabase
      .from('estrategias_tipos_aposta')
      .select('tipo_aposta_id')
      .eq('estrategia_id', input.estrategia_id),
    supabase
      .from('estrategias_ligas')
      .select('liga_id')
      .eq('estrategia_id', input.estrategia_id),
  ]);

  if (estrategiaRes.error || !estrategiaRes.data) {
    return { ok: false, violacoes: ['Estratégia não encontrada.'] };
  }

  const tipos =
    (tiposRes.data ?? []).map((r) => r.tipo_aposta_id) ??
    (estrategiaRes.data.tipo_aposta_id != null
      ? [estrategiaRes.data.tipo_aposta_id]
      : []);
  const ligas = (ligasRes.data ?? []).map((r) => r.liga_id);

  const escopo: StrategyScope = {
    esporte_id: estrategiaRes.data.esporte_id,
    tipos_aposta_ids: tipos,
    ligas_ids: ligas,
    contextos: (estrategiaRes.data.contextos ?? []) as ('pre_live' | 'ao_vivo')[],
    odd_minima:
      estrategiaRes.data.odd_minima != null
        ? Number(estrategiaRes.data.odd_minima)
        : null,
    odd_maxima:
      estrategiaRes.data.odd_maxima != null
        ? Number(estrategiaRes.data.odd_maxima)
        : null,
    minuto_minimo: estrategiaRes.data.minuto_minimo,
  };

  const selecoes: BetSelectionInput[] =
    input.formato === 'multipla'
      ? input.selecoes ?? []
      : input.selecao
        ? [input.selecao]
        : [];

  const violacoes: string[] = [];
  for (const [i, sel] of selecoes.entries()) {
    const partida = sel.partida;
    const contexto: BetContext = {
      odd: sel.odd,
      tipo_aposta_id: sel.tipo_aposta_id,
      liga: partida.kind === 'new' ? partida.liga_id : null,
    };
    const check = avaliarApostaVsEstrategia({
      regras: (estrategiaRes.data.regras_jsonb ?? {
        tipo: 'grupo',
        operador: 'AND',
        filhos: [],
      }) as RuleGroup,
      escopo,
      contexto,
    });
    if (!check.ok) {
      const prefixo = selecoes.length > 1 ? `Seleção ${i + 1}: ` : '';
      for (const v of check.violacoes) violacoes.push(`${prefixo}${v}`);
    }
  }

  return { ok: violacoes.length === 0, violacoes };
}

// ---------------------------------------------------------------------------
// Payload para a RPC
// ---------------------------------------------------------------------------

function partidaParaPayload(p: PartidaInput) {
  if (p.kind === 'existing') {
    return { kind: 'existing', partida_id: p.partida_id };
  }
  return {
    kind: 'new',
    esporte_id: p.esporte_id,
    liga_id: p.liga_id,
    time_mandante_id: p.time_mandante_id,
    time_visitante_id: p.time_visitante_id,
    mandante_nome: p.mandante_nome || null,
    visitante_nome: p.visitante_nome || null,
    inicio: new Date(p.inicio).toISOString(),
  };
}

function selecaoParaPayload(s: BetSelectionInput) {
  return {
    partida: partidaParaPayload(s.partida),
    tipo_aposta_id: s.tipo_aposta_id,
    linha: s.linha || null,
    odd: s.odd,
    descricao: s.descricao,
  };
}

function inputSimplesParaPayloadRpc(input: BetInput) {
  if (!input.selecao) {
    throw new Error('Aposta simples sem seleção.');
  }
  return {
    banca_id: input.banca_id,
    estrategia_id: input.estrategia_id,
    stake: input.stake,
    odd_total: input.selecao.odd,
    eh_freebet: input.eh_freebet,
    casa_de_aposta: input.casa_de_aposta || null,
    descricao: input.descricao || null,
    observacao: input.observacao || null,
    estrategia_override: input.estrategia_override,
    motivo_override: input.estrategia_override
      ? input.motivo_override || null
      : null,
    edge: input.edge,
    valor_esperado: input.valor_esperado,
    selecao: selecaoParaPayload(input.selecao),
  };
}

function inputMultiplaParaPayloadRpc(input: BetInput) {
  const oddTotal = Number(
    calcularOddTotalMultipla(input.selecoes).toFixed(3),
  );
  return {
    banca_id: input.banca_id,
    estrategia_id: input.estrategia_id,
    stake: input.stake,
    odd_total: oddTotal,
    eh_freebet: input.eh_freebet,
    casa_de_aposta: input.casa_de_aposta || null,
    descricao: input.descricao || null,
    observacao: input.observacao || null,
    estrategia_override: input.estrategia_override,
    motivo_override: input.estrategia_override
      ? input.motivo_override || null
      : null,
    edge: input.edge,
    valor_esperado: input.valor_esperado,
    selecoes: input.selecoes.map(selecaoParaPayload),
  };
}

// ---------------------------------------------------------------------------
// Criar
// ---------------------------------------------------------------------------

export async function criarAposta(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;

  const parsed = betInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  const supabase = await createSupabaseServerClient();

  // Validação bloqueante vs estratégia (com override explícito)
  if (data.estrategia_id && !data.estrategia_override) {
    const check = await validarContraEstrategia(data, supabase);
    if (!check.ok) {
      return {
        ok: false,
        message: 'Aposta fora das regras da estratégia.',
        violacoes: check.violacoes,
      };
    }
  }

  const rpcName =
    data.formato === 'multipla' ? 'fn_criar_aposta_multipla' : 'fn_criar_aposta_simples';
  const payload =
    data.formato === 'multipla'
      ? inputMultiplaParaPayloadRpc(data)
      : inputSimplesParaPayloadRpc(data);
  const { data: novoId, error } = await supabase.rpc(rpcName, {
    payload,
  } as never);

  if (error) {
    if (isFkViolation(error)) {
      return {
        ok: false,
        message: 'Banca, estratégia, time ou liga não encontrados. Atualize a página.',
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  revalidatePath('/strategies');
  revalidatePath('/banca');
  return { ok: true, data: { id: String(novoId) } };
}

// ---------------------------------------------------------------------------
// Atualizar
// ---------------------------------------------------------------------------

export async function atualizarAposta(input: unknown): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;

  const parsed = betUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }
  const { id, ...data } = parsed.data;
  const supabase = await createSupabaseServerClient();

  // Só permitimos editar enquanto pendente (S1)
  const { data: atual, error: atualErr } = await supabase
    .from('apostas')
    .select('id, status, estrategia_id')
    .eq('id', id)
    .maybeSingle();

  if (atualErr) return { ok: false, message: atualErr.message };
  if (!atual) return { ok: false, message: 'Aposta não encontrada.' };
  if (atual.status !== 'pendente') {
    return {
      ok: false,
      message:
        'Aposta já resolvida — reabra antes de editar (disponível na próxima fatia).',
    };
  }

  if (data.estrategia_id && !data.estrategia_override) {
    const check = await validarContraEstrategia(data, supabase);
    if (!check.ok) {
      return {
        ok: false,
        message: 'Aposta fora das regras da estratégia.',
        violacoes: check.violacoes,
      };
    }
  }

  // Edição em S1/S2/S3: só permitimos editar os campos "chatos" da aposta.
  // Para simples, também atualizamos a seleção única. Para múltipla, a edição
  // estrutural da lista de seleções não é feita aqui (evita cascatas
  // complicadas em odd_total/validação do trigger) — a recomendação é
  // excluir e recriar.
  const oddTotalAtualizada =
    data.formato === 'multipla'
      ? Number(calcularOddTotalMultipla(data.selecoes).toFixed(3))
      : data.selecao?.odd ?? 0;

  const patch: ApostaUpdate = {
    banca_id: data.banca_id,
    estrategia_id: data.estrategia_id,
    stake: data.stake,
    odd_total: oddTotalAtualizada,
    eh_freebet: data.eh_freebet,
    casa_de_aposta: data.casa_de_aposta || null,
    descricao: data.descricao || null,
    observacao: data.observacao || null,
    estrategia_override: data.estrategia_override,
    motivo_override: data.estrategia_override
      ? data.motivo_override || null
      : null,
    edge: data.edge,
    valor_esperado: data.valor_esperado,
  };

  const { error } = await supabase.from('apostas').update(patch).eq('id', id);
  if (error) return { ok: false, message: error.message };

  if (data.formato === 'simples' && data.selecao) {
    const { error: errSel } = await supabase
      .from('apostas_selecoes')
      .update({
        tipo_aposta_id: data.selecao.tipo_aposta_id,
        linha: data.selecao.linha || null,
        odd: data.selecao.odd,
        descricao: data.selecao.descricao,
      })
      .eq('aposta_id', id);

    if (errSel) return { ok: false, message: errSel.message };
  }

  revalidatePath(REVALIDATE_PATH);
  revalidatePath(`${REVALIDATE_PATH}/${id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Excluir (apenas pendentes, em S1)
// ---------------------------------------------------------------------------

export async function excluirAposta(id: string): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  if (!id) return { ok: false, message: 'ID inválido.' };

  const supabase = await createSupabaseServerClient();

  const { data: atual } = await supabase
    .from('apostas')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (!atual) return { ok: false, message: 'Aposta não encontrada.' };
  if (atual.status !== 'pendente') {
    return {
      ok: false,
      message: 'Só é possível excluir apostas pendentes.',
    };
  }

  // Deleta a aposta — as seleções caem em cascata pelo FK `on delete cascade`.
  const { error } = await supabase.from('apostas').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Resolver (S2)
// ---------------------------------------------------------------------------

export async function resolverAposta(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;

  const parsed = betResolveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }
  const { id, status, retorno_real, observacao } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('fn_resolver_aposta', {
    p_aposta_id: id,
    p_status: status,
    p_retorno_real: retorno_real ?? undefined,
    p_observacao: observacao || undefined,
  });

  if (error) {
    if (isFkViolation(error)) {
      return { ok: false, message: 'Aposta não encontrada.' };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  revalidatePath(`${REVALIDATE_PATH}/${id}`);
  revalidatePath('/banca');
  revalidatePath('/strategies');
  return { ok: true, data: { id: String(data) } };
}

// ---------------------------------------------------------------------------
// Reabrir (S2)
// ---------------------------------------------------------------------------

export async function reabrirAposta(id: string): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  if (!id) return { ok: false, message: 'ID inválido.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('fn_reabrir_aposta', {
    p_aposta_id: id,
  });

  if (error) {
    if (isFkViolation(error)) {
      return { ok: false, message: 'Aposta não encontrada.' };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  revalidatePath(`${REVALIDATE_PATH}/${id}`);
  revalidatePath('/banca');
  revalidatePath('/strategies');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Helpers "dinâmicos" expostos ao cliente (carregar detalhe, buscar times)
// ---------------------------------------------------------------------------

export async function obterDetalheAposta(id: string) {
  const { obterAposta } = await import('./queries');
  return obterAposta(id);
}

export async function obterContextoResolucaoAction(id: string) {
  const { obterContextoResolucao } = await import('./queries');
  return obterContextoResolucao(id);
}

export async function buscarTimesAction(query: string, esporte_id?: number) {
  const { buscarTimes } = await import('./queries');
  return buscarTimes(query, esporte_id);
}

// ---------------------------------------------------------------------------
// Resolver seleção (S3 – múltipla)
// ---------------------------------------------------------------------------

export async function resolverSelecao(
  selecao_id: string,
  status: Database['public']['Enums']['status_aposta'],
): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  if (!selecao_id) return { ok: false, message: 'ID inválido.' };
  if (status === 'pendente') {
    return { ok: false, message: 'Use outro fluxo para reverter para pendente.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('fn_resolver_selecao', {
    p_selecao_id: selecao_id,
    p_status: status,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(REVALIDATE_PATH);
  revalidatePath('/banca');
  revalidatePath('/strategies');
  return { ok: true };
}
