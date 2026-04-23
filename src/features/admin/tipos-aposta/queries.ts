import 'server-only';

import { cache } from 'react';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type TipoApostaListItem = {
  id: number;
  esporte_id: number;
  esporte_nome: string;
  categoria: string;
  nome: string;
  slug: string;
  descricao: string | null;
  ativo: boolean;
};

/**
 * Lists every bet type alongside the parent sport name. Cached per request
 * so RSCs + Server Actions sharing this call incur one round trip.
 */
export const listarTiposAposta = cache(async (): Promise<TipoApostaListItem[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tipos_aposta')
    .select('id, esporte_id, categoria, nome, slug, descricao, ativo, esportes(nome)')
    .order('esporte_id', { ascending: true })
    .order('categoria', { ascending: true })
    .order('nome', { ascending: true });

  if (error) throw new Error(`listarTiposAposta: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    esporte_id: row.esporte_id,
    esporte_nome: (row.esportes as unknown as { nome: string } | null)?.nome ?? '—',
    categoria: row.categoria,
    nome: row.nome,
    slug: row.slug,
    descricao: row.descricao,
    ativo: row.ativo,
  }));
});

export type EsporteOption = { id: number; nome: string; slug: string };

export const listarEsportesAtivos = cache(async (): Promise<EsporteOption[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('esportes')
    .select('id, nome, slug')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw new Error(`listarEsportesAtivos: ${error.message}`);
  return data ?? [];
});
