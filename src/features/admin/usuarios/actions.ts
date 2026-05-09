'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/profile';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/admin-client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adminSetPasswordSchema } from '@/lib/validators/auth';
import type { Json } from '@/types/supabase';

import { adminUsuarioPatchSchema } from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const REVALIDATE = ['/admin/usuarios', '/dashboard'] as const;

function revalidate() {
  for (const p of REVALIDATE) revalidatePath(p);
}

function zodToFieldErrors(error: import('zod').ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function mapRpcMessage(raw: string): string {
  if (raw.includes('Nao e possivel remover o unico administrador')) {
    return 'Não é possível remover o único administrador do sistema.';
  }
  if (raw.includes('Nao autenticado')) return 'Sessão expirada. Faça login novamente.';
  if (raw.includes('Acesso negado')) return 'Sem permissão para esta ação.';
  if (raw.includes('Usuario nao encontrado')) return 'Usuário não encontrado.';
  if (raw.includes('Papel invalido')) return 'Papel inválido.';
  if (raw.includes('Moeda invalida')) return 'Moeda inválida — use 3 letras ISO (ex.: BRL).';
  if (raw.includes('Fuso horario')) return 'Fuso horário inválido.';
  return raw;
}

export async function adminAtualizarPerfil(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = adminUsuarioPatchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { usuarioId, papel, nomeCompleto, moeda, fusoHorario } = parsed.data;

  const p_patch: Record<string, string | null> = {};
  if (papel !== undefined) p_patch.papel = papel;
  if (nomeCompleto !== undefined) p_patch.nome_completo = nomeCompleto;
  if (moeda !== undefined) p_patch.moeda = moeda;
  if (fusoHorario !== undefined) p_patch.fuso_horario = fusoHorario;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('fn_admin_atualizar_perfil', {
    p_usuario_id: usuarioId,
    p_patch: p_patch as Json,
  });

  if (error) {
    return { ok: false, message: mapRpcMessage(error.message) };
  }

  revalidate();
  return { ok: true };
}

/**
 * Define a senha de outro utilizador via Auth Admin (requer service role no servidor).
 */
export async function adminDefinirSenhaUsuario(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = adminSetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Corrija os campos destacados.',
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { usuarioId, novaSenha } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: perfil, error: perfilErr } = await supabase
    .from('perfis')
    .select('id')
    .eq('id', usuarioId)
    .maybeSingle();

  if (perfilErr) {
    return { ok: false, message: `Erro ao verificar usuário: ${perfilErr.message}` };
  }
  if (!perfil) {
    return { ok: false, message: 'Usuário não encontrado.' };
  }

  let service: ReturnType<typeof createSupabaseServiceRoleClient>;
  try {
    service = createSupabaseServiceRoleClient();
  } catch {
    return {
      ok: false,
      message:
        'Redefinição de senha por administrador indisponível: defina SUPABASE_SERVICE_ROLE_KEY no servidor.',
    };
  }

  const { error } = await service.auth.admin.updateUserById(usuarioId, {
    password: novaSenha,
  });

  if (error) {
    return {
      ok: false,
      message:
        error.message.includes('Database error') || error.message.includes('password')
          ? 'Não foi possível atualizar a senha. Verifique a política de senhas do projeto.'
          : error.message,
    };
  }

  revalidate();
  return { ok: true };
}
