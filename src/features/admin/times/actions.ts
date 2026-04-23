'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { timeSchema, timeUpdateSchema } from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const REVALIDATE_PATH = '/admin/times';

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
 * Converte string vazia em `null` para colunas nullable. Centralizado
 * aqui em vez de no schema para manter input=output do RHF limpo.
 */
function nullIfEmpty(v: string): string | null {
  return v.length > 0 ? v : null;
}

export async function criarTime(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = timeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('times').insert({
    nome: parsed.data.nome,
    slug: parsed.data.slug,
    esporte_id: parsed.data.esporte_id,
    pais_id: parsed.data.pais_id,
    escudo_url: nullIfEmpty(parsed.data.escudo_url),
  });

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Já existe um time com esse slug para o esporte selecionado.',
        fieldErrors: { slug: ['Slug já utilizado neste esporte.'] },
      };
    }
    if (isFkViolation(error)) {
      return {
        ok: false,
        message: 'Esporte ou país selecionado não existe mais. Atualize a página.',
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}

export async function atualizarTime(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = timeUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { id, escudo_url, ...rest } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('times')
    .update({ ...rest, escudo_url: nullIfEmpty(escudo_url) })
    .eq('id', id);

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Já existe um time com esse slug para o esporte selecionado.',
        fieldErrors: { slug: ['Slug já utilizado neste esporte.'] },
      };
    }
    if (isFkViolation(error)) {
      return {
        ok: false,
        message: 'Esporte ou país selecionado não existe mais. Atualize a página.',
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}

/**
 * Excluir time é seguro: partidas referenciam com `on delete set null`,
 * então apenas perdemos o vínculo histórico. O Server Action não
 * bloqueia pela contagem de partidas.
 */
export async function excluirTime(id: number): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: 'ID inválido.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('times').delete().eq('id', id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}
