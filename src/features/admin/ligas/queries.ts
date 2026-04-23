import 'server-only';

import { cache } from 'react';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type LigaListItem = {
  id: number;
  nome: string;
  slug: string;
  temporada: string | null;
  ativo: boolean;
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
  /** Quantos times têm partidas nesta liga (via `partidas.liga_id`). */
  partidas_total: number;
};

export type EsporteOpcao = { id: number; nome: string; slug: string };
export type PaisOpcao = { id: number; nome: string; codigo_iso: string };

/**
 * Lista de ligas com joins de esporte e país (obrigatório e opcional
 * respectivamente) + contagem de partidas vinculadas. Usa dois requests
 * paralelos: PostgREST faz o join de esporte/país de uma vez, e uma
 * segunda query agrega partidas.
 */
export const listarLigasComEstatisticas = cache(
  async (): Promise<LigaListItem[]> => {
    const supabase = await createSupabaseServerClient();

    const [ligasRes, partidasRes] = await Promise.all([
      supabase
        .from('ligas')
        .select(
          `
          id, nome, slug, temporada, ativo, criado_em,
          esporte:esportes!inner(id, nome, slug),
          pais:paises(id, nome, codigo_iso)
        `,
        )
        .order('ativo', { ascending: false })
        .order('nome', { ascending: true }),
      supabase.from('partidas').select('liga_id'),
    ]);

    if (ligasRes.error) {
      throw new Error(`listarLigasComEstatisticas/ligas: ${ligasRes.error.message}`);
    }
    if (partidasRes.error) {
      throw new Error(
        `listarLigasComEstatisticas/partidas: ${partidasRes.error.message}`,
      );
    }

    const partidasPorLiga = new Map<number, number>();
    for (const row of partidasRes.data ?? []) {
      if (row.liga_id == null) continue;
      partidasPorLiga.set(row.liga_id, (partidasPorLiga.get(row.liga_id) ?? 0) + 1);
    }

    return (ligasRes.data ?? []).map((l) => ({
      id: l.id,
      nome: l.nome,
      slug: l.slug,
      temporada: l.temporada,
      ativo: l.ativo,
      criado_em: l.criado_em,
      esporte: l.esporte,
      pais: l.pais,
      partidas_total: partidasPorLiga.get(l.id) ?? 0,
    }));
  },
);

/**
 * Opções de esporte/país usadas pelos selects do dialog. Só trazemos os
 * ativos (no caso de esportes; países não tem flag de ativo no schema).
 * Chamadas em paralelo pelo page para alimentar o form sem esperas extras.
 */
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
