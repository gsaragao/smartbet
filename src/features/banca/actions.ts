'use server';

import { revalidatePath } from 'next/cache';

import { requireAuth, requireExecutor } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import {
  bancaSchema,
  bancaUpdateSchema,
  eventoBancaSchema,
} from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const PATH_LISTA = '/banca';
const pathDetalhe = (id: string) => `/banca/${id}`;

function zodToFieldErrors(
  error: import('zod').ZodError,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function normalizeText(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

// ---------------------------------------------------------------------------
// Bancas
// ---------------------------------------------------------------------------

export async function criarBanca(input: unknown): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  const profile = authResult;

  const parsed = bancaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();

  // Regra: apenas UMA banca principal por usuário. Se o usuário marcou
  // a nova como principal, desmarca as demais em uma transação leve.
  if (parsed.data.e_principal) {
    const { error: resetError } = await supabase
      .from('bancas')
      .update({ e_principal: false })
      .eq('usuario_id', profile.id)
      .eq('e_principal', true);
    if (resetError) return { ok: false, message: resetError.message };
  }

  const { data, error } = await supabase
    .from('bancas')
    .insert({
      usuario_id: profile.id,
      nome: parsed.data.nome,
      casa_de_aposta: normalizeText(parsed.data.casa_de_aposta),
      moeda: parsed.data.moeda,
      saldo_inicial: parsed.data.saldo_inicial,
      // saldo_atual inicia igual ao saldo_inicial; o trigger mantém depois.
      saldo_atual: parsed.data.saldo_inicial,
      e_principal: parsed.data.e_principal,
    })
    .select('id')
    .single();

  if (error) return { ok: false, message: error.message };

  // Trilha de auditoria: registra o saldo inicial como evento `saldo_inicial`
  // (não entra na soma do trigger, serve como histórico).
  if (parsed.data.saldo_inicial > 0 && data?.id) {
    await supabase.from('eventos_banca').insert({
      banca_id: data.id,
      usuario_id: profile.id,
      tipo: 'saldo_inicial',
      valor: parsed.data.saldo_inicial,
      observacao: 'Saldo inicial ao criar a banca.',
    });
  }

  revalidatePath(PATH_LISTA);
  return { ok: true };
}

export async function atualizarBanca(input: unknown): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  const profile = authResult;

  const parsed = bancaUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();

  if (parsed.data.e_principal) {
    const { error: resetError } = await supabase
      .from('bancas')
      .update({ e_principal: false })
      .eq('usuario_id', profile.id)
      .neq('id', parsed.data.id)
      .eq('e_principal', true);
    if (resetError) return { ok: false, message: resetError.message };
  }

  const { error } = await supabase
    .from('bancas')
    .update({
      nome: parsed.data.nome,
      casa_de_aposta: normalizeText(parsed.data.casa_de_aposta),
      moeda: parsed.data.moeda,
      saldo_inicial: parsed.data.saldo_inicial,
      e_principal: parsed.data.e_principal,
    })
    .eq('id', parsed.data.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(PATH_LISTA);
  revalidatePath(pathDetalhe(parsed.data.id));
  return { ok: true };
}

export async function alternarAtivaBanca(
  id: string,
  ativa: boolean,
): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  if (!id) return { ok: false, message: 'ID inválido.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('bancas')
    .update({ ativa })
    .eq('id', id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(PATH_LISTA);
  revalidatePath(pathDetalhe(id));
  return { ok: true };
}

export async function definirBancaPrincipal(id: string): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  const profile = authResult;
  if (!id) return { ok: false, message: 'ID inválido.' };

  const supabase = await createSupabaseServerClient();

  // Primeiro desmarca todas as outras, depois marca a escolhida.
  const { error: resetError } = await supabase
    .from('bancas')
    .update({ e_principal: false })
    .eq('usuario_id', profile.id)
    .neq('id', id)
    .eq('e_principal', true);
  if (resetError) return { ok: false, message: resetError.message };

  const { error } = await supabase
    .from('bancas')
    .update({ e_principal: true })
    .eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidatePath(PATH_LISTA);
  return { ok: true };
}

export async function excluirBanca(id: string): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  if (!id) return { ok: false, message: 'ID inválido.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('bancas').delete().eq('id', id);

  if (error) {
    // 23503 = foreign_key_violation (apostas já existentes referenciam).
    if (error.code === '23503') {
      return {
        ok: false,
        message:
          'Não é possível excluir: existem apostas vinculadas a esta banca. Arquive-a em vez disso.',
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(PATH_LISTA);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Eventos de banca
// ---------------------------------------------------------------------------

export async function criarEventoBanca(input: unknown): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  const profile = authResult;

  const parsed = eventoBancaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  // Normalização de sinal (usuário sempre digita valor positivo para saque).
  const tipoDB = parsed.data.tipo; // deposito | saque | ajuste (no DB o enum também existe)
  const valorAbs = Math.abs(parsed.data.valor);
  const valorDB =
    parsed.data.tipo === 'saque'
      ? -valorAbs
      : parsed.data.tipo === 'deposito'
        ? valorAbs
        : parsed.data.valor; // ajuste: mantém sinal

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('eventos_banca').insert({
    banca_id: parsed.data.banca_id,
    usuario_id: profile.id,
    tipo: tipoDB,
    valor: valorDB,
    observacao: normalizeText(parsed.data.observacao),
    ocorrido_em: new Date(parsed.data.ocorrido_em).toISOString(),
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(PATH_LISTA);
  revalidatePath(pathDetalhe(parsed.data.banca_id));
  return { ok: true };
}

export async function excluirEventoBanca(
  id: string,
  bancaId: string,
): Promise<ActionResult> {
  const authResult = await requireExecutor();
  if (!('id' in authResult)) return authResult;
  if (!id || !bancaId) return { ok: false, message: 'ID inválido.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('eventos_banca').delete().eq('id', id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(PATH_LISTA);
  revalidatePath(pathDetalhe(bancaId));
  return { ok: true };
}
