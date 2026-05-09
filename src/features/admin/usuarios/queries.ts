import 'server-only';

import { cache } from 'react';

import { requireAdmin } from '@/lib/auth/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type PerfilAdminListItem = {
  id: string;
  email: string;
  nome_completo: string | null;
  papel: string;
  moeda: string;
  fuso_horario: string;
  criado_em: string;
  atualizado_em: string;
};

export type UsuariosAdminResumo = {
  total: number;
  admins: number;
  executores: number;
  consultas: number;
  legacy_usuario: number;
};

export const listarPerfisAdmin = cache(async (): Promise<PerfilAdminListItem[]> => {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('perfis')
    .select('id, email, nome_completo, papel, moeda, fuso_horario, criado_em, atualizado_em')
    .order('criado_em', { ascending: false });

  if (error) throw new Error(`listarPerfisAdmin: ${error.message}`);
  return (data ?? []) as PerfilAdminListItem[];
});

export function resumoPerfis(perfis: PerfilAdminListItem[]): UsuariosAdminResumo {
  let admins = 0;
  let executores = 0;
  let consultas = 0;
  let legacy_usuario = 0;
  for (const p of perfis) {
    switch (p.papel) {
      case 'admin':
        admins += 1;
        break;
      case 'executor':
        executores += 1;
        break;
      case 'consulta':
        consultas += 1;
        break;
      case 'usuario':
        legacy_usuario += 1;
        break;
      default:
        break;
    }
  }
  return {
    total: perfis.length,
    admins,
    executores,
    consultas,
    legacy_usuario,
  };
}
