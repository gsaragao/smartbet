import 'server-only';

import { cache } from 'react';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

type BancaRow = Database['public']['Tables']['bancas']['Row'];
type EventoBancaRow = Database['public']['Tables']['eventos_banca']['Row'];

// ---------------------------------------------------------------------------
// Bancas (lista)
// ---------------------------------------------------------------------------

export type BancaListItem = Pick<
  BancaRow,
  | 'id'
  | 'nome'
  | 'casa_de_aposta'
  | 'moeda'
  | 'saldo_inicial'
  | 'saldo_atual'
  | 'e_principal'
  | 'ativa'
  | 'criado_em'
  | 'atualizado_em'
> & {
  // Derivado: variação percentual do saldo em relação ao inicial.
  // null quando saldo_inicial = 0 para evitar divisão por zero.
  variacao_pct: number | null;
};

function computeVariacao(inicial: number, atual: number): number | null {
  if (!inicial) return null;
  return ((atual - inicial) / inicial) * 100;
}

/**
 * Lista todas as bancas do usuário autenticado. RLS cuida do filtro.
 * Ordenação: principal primeiro, depois ativas, depois por criação desc.
 */
export const listarBancas = cache(async (): Promise<BancaListItem[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('bancas')
    .select(
      'id, nome, casa_de_aposta, moeda, saldo_inicial, saldo_atual, e_principal, ativa, criado_em, atualizado_em',
    )
    .order('e_principal', { ascending: false })
    .order('ativa', { ascending: false })
    .order('criado_em', { ascending: false });

  if (error) throw new Error(`listarBancas: ${error.message}`);

  return (data ?? []).map((row) => ({
    ...row,
    variacao_pct: computeVariacao(Number(row.saldo_inicial), Number(row.saldo_atual)),
  }));
});

// ---------------------------------------------------------------------------
// Banca (detalhe)
// ---------------------------------------------------------------------------

export type BancaDetalhe = BancaListItem & {
  // Agregados úteis no cabeçalho da tela de detalhes.
  total_depositos: number;
  total_saques: number;
  total_ajustes: number;
  qtd_eventos: number;
};

/**
 * Carrega a banca + agregados em uma única chamada (uma query para a banca,
 * uma para a agregação de eventos). Não-cached pois cada detalhe depende do id.
 */
export async function obterBanca(id: string): Promise<BancaDetalhe | null> {
  const supabase = await createSupabaseServerClient();

  const [bancaResult, eventosResult] = await Promise.all([
    supabase
      .from('bancas')
      .select(
        'id, nome, casa_de_aposta, moeda, saldo_inicial, saldo_atual, e_principal, ativa, criado_em, atualizado_em',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('eventos_banca')
      .select('tipo, valor')
      .eq('banca_id', id)
      // `saldo_inicial` é um registro de auditoria, não conta como evento
      // financeiro visível na UI.
      .neq('tipo', 'saldo_inicial'),
  ]);

  if (bancaResult.error) throw new Error(`obterBanca: ${bancaResult.error.message}`);
  if (!bancaResult.data) return null;
  if (eventosResult.error) {
    throw new Error(`obterBanca.eventos: ${eventosResult.error.message}`);
  }

  const eventos = eventosResult.data ?? [];

  const totals = eventos.reduce(
    (acc, e) => {
      const v = Number(e.valor);
      if (e.tipo === 'deposito') acc.total_depositos += v;
      else if (e.tipo === 'saque') acc.total_saques += Math.abs(v);
      else if (e.tipo === 'ajuste') acc.total_ajustes += v;
      return acc;
    },
    { total_depositos: 0, total_saques: 0, total_ajustes: 0 },
  );

  return {
    ...bancaResult.data,
    variacao_pct: computeVariacao(
      Number(bancaResult.data.saldo_inicial),
      Number(bancaResult.data.saldo_atual),
    ),
    ...totals,
    qtd_eventos: eventos.length,
  };
}

// ---------------------------------------------------------------------------
// Eventos (detalhe)
// ---------------------------------------------------------------------------

export type EventoBancaListItem = Pick<
  EventoBancaRow,
  'id' | 'tipo' | 'valor' | 'observacao' | 'ocorrido_em' | 'criado_em'
>;

export async function listarEventosBanca(
  bancaId: string,
): Promise<EventoBancaListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('eventos_banca')
    .select('id, tipo, valor, observacao, ocorrido_em, criado_em')
    // `saldo_inicial` só aparece como trilha histórica, não exibimos por padrão.
    .neq('tipo', 'saldo_inicial')
    .eq('banca_id', bancaId)
    .order('ocorrido_em', { ascending: false })
    .order('criado_em', { ascending: false });

  if (error) throw new Error(`listarEventosBanca: ${error.message}`);
  return data ?? [];
}
