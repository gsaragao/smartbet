import 'server-only';

import { cache } from 'react';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type PaisListItem = {
  id: number;
  codigo_iso: string;
  nome: string;
  criado_em: string;
  /** Ligas e times que referenciam este país via FK. */
  ligas_total: number;
  times_total: number;
};

/**
 * Lista de países com contagem de ligas/times vinculados.
 *
 * Estratégia:
 *  - Três consultas leves em paralelo (países, chaves de ligas e times).
 *  - Agregação em JS — esses catálogos são pequenos e raramente mudam,
 *    então evitamos criar uma view ou RPC por enquanto.
 *  - `React.cache` compartilha o mesmo round-trip entre RSC + Suspense
 *    boundaries do request.
 */
export const listarPaisesComEstatisticas = cache(
  async (): Promise<PaisListItem[]> => {
    const supabase = await createSupabaseServerClient();

    const [paisesRes, ligasRes, timesRes] = await Promise.all([
      supabase
        .from('paises')
        .select('id, codigo_iso, nome, criado_em')
        .order('nome', { ascending: true }),
      supabase.from('ligas').select('pais_id'),
      supabase.from('times').select('pais_id'),
    ]);

    if (paisesRes.error) {
      throw new Error(`listarPaisesComEstatisticas/paises: ${paisesRes.error.message}`);
    }
    if (ligasRes.error) {
      throw new Error(`listarPaisesComEstatisticas/ligas: ${ligasRes.error.message}`);
    }
    if (timesRes.error) {
      throw new Error(`listarPaisesComEstatisticas/times: ${timesRes.error.message}`);
    }

    const ligasPorPais = new Map<number, number>();
    for (const row of ligasRes.data ?? []) {
      if (row.pais_id == null) continue;
      ligasPorPais.set(row.pais_id, (ligasPorPais.get(row.pais_id) ?? 0) + 1);
    }

    const timesPorPais = new Map<number, number>();
    for (const row of timesRes.data ?? []) {
      if (row.pais_id == null) continue;
      timesPorPais.set(row.pais_id, (timesPorPais.get(row.pais_id) ?? 0) + 1);
    }

    return (paisesRes.data ?? []).map((p) => ({
      id: p.id,
      codigo_iso: p.codigo_iso,
      nome: p.nome,
      criado_em: p.criado_em,
      ligas_total: ligasPorPais.get(p.id) ?? 0,
      times_total: timesPorPais.get(p.id) ?? 0,
    }));
  },
);
