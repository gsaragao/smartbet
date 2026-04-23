'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { esporteSchema, esporteUpdateSchema } from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const REVALIDATE_PATHS = ['/admin/esportes', '/admin/tipos-aposta'] as const;

function revalidate() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

function zodToFieldErrors(error: import('zod').ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Viola a unique `esportes.slug`. */
function isUniqueViolation(err: { code?: string }) {
  return err.code === '23505';
}

/** Chave estrangeira restringindo o delete (times/ligas/tipos referenciam). */
function isFkViolation(err: { code?: string }) {
  return err.code === '23503';
}

export async function criarEsporte(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = esporteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('esportes').insert({
    nome: parsed.data.nome,
    slug: parsed.data.slug,
    ativo: parsed.data.ativo,
  });

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Já existe um esporte com esse slug.',
        fieldErrors: { slug: ['Slug já utilizado.'] },
      };
    }
    return { ok: false, message: error.message };
  }

  revalidate();
  return { ok: true };
}

export async function atualizarEsporte(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = esporteUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { id, ...rest } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('esportes').update(rest).eq('id', id);

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Já existe um esporte com esse slug.',
        fieldErrors: { slug: ['Slug já utilizado.'] },
      };
    }
    return { ok: false, message: error.message };
  }

  revalidate();
  return { ok: true };
}

/**
 * Toggle rápido a partir do switch na listagem — evita carregar o form
 * inteiro só pra inverter um booleano.
 */
export async function alternarAtivoEsporte(id: number, ativo: boolean): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: 'ID inválido.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('esportes').update({ ativo }).eq('id', id);

  if (error) return { ok: false, message: error.message };

  revalidate();
  return { ok: true };
}

export async function excluirEsporte(id: number): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: 'ID inválido.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('esportes').delete().eq('id', id);

  if (error) {
    if (isFkViolation(error)) {
      return {
        ok: false,
        message:
          'Este esporte possui tipos de aposta, ligas ou times vinculados. Desative-o em vez de excluir.',
      };
    }
    return { ok: false, message: error.message };
  }

  revalidate();
  return { ok: true };
}
