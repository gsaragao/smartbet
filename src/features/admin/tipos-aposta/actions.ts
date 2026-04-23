'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { tipoApostaSchema, tipoApostaUpdateSchema } from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const REVALIDATE_PATH = '/admin/tipos-aposta';

function zodToFieldErrors(error: import('zod').ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Uniqueness violation emitted by the `(esporte_id, slug)` unique index. */
function isUniqueViolation(err: { code?: string; message?: string }) {
  return err.code === '23505';
}

export async function criarTipoAposta(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = tipoApostaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('tipos_aposta').insert({
    esporte_id: parsed.data.esporte_id,
    categoria: parsed.data.categoria,
    nome: parsed.data.nome,
    slug: parsed.data.slug,
    descricao: parsed.data.descricao.trim() === '' ? null : parsed.data.descricao,
    ativo: parsed.data.ativo,
  });

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Já existe um tipo com esse slug nesse esporte.',
        fieldErrors: { slug: ['Slug duplicado para o esporte selecionado.'] },
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}

export async function atualizarTipoAposta(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = tipoApostaUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { id, descricao, ...rest } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('tipos_aposta')
    .update({ ...rest, descricao: descricao.trim() === '' ? null : descricao })
    .eq('id', id);

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Já existe um tipo com esse slug nesse esporte.',
        fieldErrors: { slug: ['Slug duplicado para o esporte selecionado.'] },
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}

/**
 * Fast toggle used from the list (switch in each row). Keeps the code path
 * separate from the full update so we avoid loading the whole form just to
 * flip a boolean.
 */
export async function alternarAtivoTipoAposta(id: number, ativo: boolean): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: 'ID inválido.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('tipos_aposta').update({ ativo }).eq('id', id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}

export async function excluirTipoAposta(id: number): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: 'ID inválido.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('tipos_aposta').delete().eq('id', id);

  if (error) {
    // 23503 = foreign_key_violation (selecao ou estrategia ainda referencia).
    if (error.code === '23503') {
      return {
        ok: false,
        message:
          'Este tipo de aposta está em uso por estratégias ou apostas. Desative-o em vez de excluir.',
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}
