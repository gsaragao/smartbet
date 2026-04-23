'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { paisSchema, paisUpdateSchema } from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const REVALIDATE_PATH = '/admin/paises';

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

export async function criarPais(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = paisSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('paises').insert({
    codigo_iso: parsed.data.codigo_iso,
    nome: parsed.data.nome,
  });

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Já existe um país com esse código ISO.',
        fieldErrors: { codigo_iso: ['Código já utilizado.'] },
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}

export async function atualizarPais(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = paisUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { id, ...rest } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('paises').update(rest).eq('id', id);

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Já existe um país com esse código ISO.',
        fieldErrors: { codigo_iso: ['Código já utilizado.'] },
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}

export async function excluirPais(id: number): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: 'ID inválido.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('paises').delete().eq('id', id);

  if (error) {
    if (isFkViolation(error)) {
      return {
        ok: false,
        message:
          'Este país possui ligas ou times vinculados. Remova os vínculos antes de excluir.',
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(REVALIDATE_PATH);
  return { ok: true };
}
