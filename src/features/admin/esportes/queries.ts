import 'server-only';

import { cache } from 'react';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type EsporteListItem = {
  id: number;
  nome: string;
  slug: string;
  ativo: boolean;
  criado_em: string;
  /** Quantidade de mercados (`tipos_aposta`) associados, ativos e inativos. */
  tipos_total: number;
  tipos_ativos: number;
};

/**
 * Lista os esportes cadastrados com contagem de mercados vinculados.
 *
 * Estratégia de performance:
 *  - Duas consultas leves em paralelo (`esportes` e chaves `tipos_aposta`).
 *  - Agregação em JS, já que o volume esperado é pequeno (poucas dezenas de
 *    esportes × alguns mercados). Evita criar uma view/rpc só pra isso.
 *  - Envolvido em `React.cache` para que RSC + suspense boundaries
 *    compartilhem o mesmo round-trip por request.
 */
export const listarEsportesComEstatisticas = cache(
  async (): Promise<EsporteListItem[]> => {
    const supabase = await createSupabaseServerClient();

    const [esportesRes, tiposRes] = await Promise.all([
      supabase
        .from('esportes')
        .select('id, nome, slug, ativo, criado_em')
        .order('ativo', { ascending: false })
        .order('nome', { ascending: true }),
      supabase.from('tipos_aposta').select('esporte_id, ativo'),
    ]);

    if (esportesRes.error) {
      throw new Error(`listarEsportesComEstatisticas/esportes: ${esportesRes.error.message}`);
    }
    if (tiposRes.error) {
      throw new Error(`listarEsportesComEstatisticas/tipos: ${tiposRes.error.message}`);
    }

    const totais = new Map<number, { total: number; ativos: number }>();
    for (const row of tiposRes.data ?? []) {
      const bucket = totais.get(row.esporte_id) ?? { total: 0, ativos: 0 };
      bucket.total += 1;
      if (row.ativo) bucket.ativos += 1;
      totais.set(row.esporte_id, bucket);
    }

    return (esportesRes.data ?? []).map((e) => {
      const stats = totais.get(e.id) ?? { total: 0, ativos: 0 };
      return {
        id: e.id,
        nome: e.nome,
        slug: e.slug,
        ativo: e.ativo,
        criado_em: e.criado_em,
        tipos_total: stats.total,
        tipos_ativos: stats.ativos,
      };
    });
  },
);
