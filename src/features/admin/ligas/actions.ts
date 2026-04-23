'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { ligaSchema, ligaUpdateSchema } from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const REVALIDATE_PATH = '/admin/ligas';

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

export async function criarLiga(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = ligaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('ligas').insert({
    nome: parsed.data.nome,
    slug: parsed.data.slug,
    esporte_id: parsed.data.esporte_id,
    pais_id: parsed.data.pais_id,
    temporada: parsed.data.temporada.length > 0 ? parsed.data.temporada : null,
    ativo: parsed.data.ativo,
  });

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Já existe uma liga com esse slug para o esporte selecionado.',
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

export async function atualizarLiga(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = ligaUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { id, temporada, ...rest } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('ligas')
    .update({ ...rest, temporada: temporada.length > 0 ? temporada : null })
    .eq('id', id);

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Já existe uma liga com esse slug para o esporte selecionado.',
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

export async function alternarAtivoLiga(
  id: number,
  ativo: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: 'ID inválido.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('ligas').update({ ativo }).eq('id', id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}

export async function excluirLiga(id: number): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: 'ID inválido.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('ligas').delete().eq('id', id);

  if (error) {
    if (isFkViolation(error)) {
      return {
        ok: false,
        message:
          'Esta liga possui partidas vinculadas. Remova as partidas antes de excluir.',
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}
