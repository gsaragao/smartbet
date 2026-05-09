'use server';

import { revalidatePath } from 'next/cache';

import { requireAuth } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { changePasswordSelfSchema } from '@/lib/validators/auth';

export type SettingsActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function zodToFieldErrors(error: import('zod').ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] != null ? String(issue.path[0]) : '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function mapAuthErr(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid') && m.includes('password')) return 'Senha atual incorreta.';
  if (m.includes('same')) return 'A nova senha não pode ser igual à atual.';
  if (m.includes('weak')) return 'Senha fraca — use pelo menos 8 caracteres.';
  return 'Não foi possível atualizar a senha. Tente novamente.';
}

export async function alterarMinhaSenha(input: unknown): Promise<SettingsActionResult> {
  const profile = await requireAuth();

  const parsed = changePasswordSelfSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: parsed.data.senhaAtual,
  });

  if (signErr) {
    return {
      ok: false,
      message: 'Senha atual incorreta.',
      fieldErrors: { senhaAtual: ['Não confere com a senha da sua conta.'] },
    };
  }

  const { error: upErr } = await supabase.auth.updateUser({
    password: parsed.data.novaSenha,
  });

  if (upErr) {
    return { ok: false, message: mapAuthErr(upErr.message) };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/settings');
  return { ok: true };
}
