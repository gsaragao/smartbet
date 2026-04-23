import 'server-only';

import { cache } from 'react';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type TimeListItem = {
  id: number;
  nome: string;
  slug: string;
  escudo_url: string | null;
  criado_em: string;
  esporte: {
    id: number;
    nome: string;
    slug: string;
  };
  pais: {
    id: number;
    nome: string;
    codigo_iso: string;
  } | null;
  /** Contagem combinada (mandante + visitante) em `partidas`. */
  partidas_total: number;
};

export type EsporteOpcao = { id: number; nome: string; slug: string };
export type PaisOpcao = { id: number; nome: string; codigo_iso: string };

/**
 * Lista de times + joins de esporte/país + contagem total de partidas
 * (como mandante ou visitante). Três queries paralelas, agregação em JS
 * para evitar dependência de views.
 */
export const listarTimesComEstatisticas = cache(
  async (): Promise<TimeListItem[]> => {
    const supabase = await createSupabaseServerClient();

    const [timesRes, partidasRes] = await Promise.all([
      supabase
        .from('times')
        .select(
          `
          id, nome, slug, escudo_url, criado_em,
          esporte:esportes!inner(id, nome, slug),
          pais:paises(id, nome, codigo_iso)
        `,
        )
        .order('nome', { ascending: true }),
      supabase
        .from('partidas')
        .select('time_mandante_id, time_visitante_id'),
    ]);

    if (timesRes.error) {
      throw new Error(`listarTimesComEstatisticas/times: ${timesRes.error.message}`);
    }
    if (partidasRes.error) {
      throw new Error(
        `listarTimesComEstatisticas/partidas: ${partidasRes.error.message}`,
      );
    }

    const partidasPorTime = new Map<number, number>();
    for (const row of partidasRes.data ?? []) {
      if (row.time_mandante_id != null) {
        partidasPorTime.set(
          row.time_mandante_id,
          (partidasPorTime.get(row.time_mandante_id) ?? 0) + 1,
        );
      }
      if (row.time_visitante_id != null) {
        partidasPorTime.set(
          row.time_visitante_id,
          (partidasPorTime.get(row.time_visitante_id) ?? 0) + 1,
        );
      }
    }

    return (timesRes.data ?? []).map((t) => ({
      id: t.id,
      nome: t.nome,
      slug: t.slug,
      escudo_url: t.escudo_url,
      criado_em: t.criado_em,
      esporte: t.esporte,
      pais: t.pais,
      partidas_total: partidasPorTime.get(t.id) ?? 0,
    }));
  },
);

export const listarEsportesAtivos = cache(async (): Promise<EsporteOpcao[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('esportes')
    .select('id, nome, slug')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw new Error(`listarEsportesAtivos: ${error.message}`);
  return data ?? [];
});

export const listarPaisesOrdenados = cache(async (): Promise<PaisOpcao[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('paises')
    .select('id, nome, codigo_iso')
    .order('nome', { ascending: true });

  if (error) throw new Error(`listarPaisesOrdenados: ${error.message}`);
  return data ?? [];
});
