import type { StrategyInput } from './schema';

/**
 * Templates prontos (S2) oferecidos no empty state e no template picker.
 *
 * Cada template cita os tipos de aposta por **slug** (não por id), porque
 * os ids podem diferir entre ambientes. A camada de UI faz o lookup do id
 * no momento de aplicar o template.
 */

export type StrategyTemplate = {
  id: 'ambas-marcam' | 'ao-vivo-0x0' | 'under-25';
  nome: string;
  descricao: string;
  cor: string;
  icone: '⚽' | '⏱' | '🛡';
  tipos_aposta_slugs: string[];
  esporte_slug: 'futebol';
  /**
   * Fábrica que produz o input pronto (faltando só `esporte_id` e
   * `tipos_aposta_ids`, que dependem dos IDs do ambiente).
   */
  build: (ids: {
    esporte_id: number;
    tipos_aposta_ids: number[];
  }) => StrategyInput;
};

export const STRATEGY_TEMPLATES: readonly StrategyTemplate[] = [
  {
    id: 'ambas-marcam',
    nome: 'Ambas Marcam',
    descricao:
      'Pré-live focada em jogos com histórico de BTTS alto e médias de gols equilibradas.',
    cor: '#22c55e',
    icone: '⚽',
    tipos_aposta_slugs: ['ambas-marcam'],
    esporte_slug: 'futebol',
    build: ({ esporte_id, tipos_aposta_ids }) => ({
      identidade: {
        nome: 'Ambas Marcam',
        descricao:
          'Foco em jogos com BTTS histórico ≥ 60% e médias de gols confortáveis em ambos os lados.',
        cor: '#22c55e',
        tags: ['pre-live', 'btts'],
        status: 'ativa',
      },
      escopo: {
        esporte_id,
        tipos_aposta_ids,
        ligas_ids: [],
        contextos: ['pre_live'],
        odd_minima: 1.6,
        odd_maxima: 2.2,
        minuto_minimo: null,
      },
      gestao: {
        metodo_stake: 'percentual',
        stake_config: { metodo: 'percentual', percentual: 2 },
        banca_referencia: 'saldo_atual',
        edge_minimo: 4,
        stop_loss_reds: 5,
        stop_loss_banca_pct: 10,
      },
      regras: {
        tipo: 'grupo',
        operador: 'AND',
        filhos: [
          { tipo: 'condicao', campo: 'btts_historico', operador: 'gte', valor: 60 },
          { tipo: 'condicao', campo: 'media_gols_time', operador: 'gte', valor: 1.2 },
        ],
      },
      guardrails: {
        drawdown_alerta_pct: 8,
        reds_consec_alerta: 3,
        yield_minimo_alerta: null,
        revisao_apos_apostas: 30,
        revisao_apos_dias: 15,
      },
    }),
  },
  {
    id: 'ao-vivo-0x0',
    nome: 'Ao vivo · Over 0.5 (2º tempo 0x0)',
    descricao:
      'Ao vivo, entra quando o jogo está 0x0 no 2º tempo com pressão ofensiva clara.',
    cor: '#f97316',
    icone: '⏱',
    tipos_aposta_slugs: ['mais-de-meio-gol'],
    esporte_slug: 'futebol',
    build: ({ esporte_id, tipos_aposta_ids }) => ({
      identidade: {
        nome: 'Ao vivo · Over 0.5 (2T 0x0)',
        descricao:
          'Identifica jogos parados no 2º tempo com boas estatísticas de finalização e xG.',
        cor: '#f97316',
        tags: ['ao-vivo', 'over', '2t'],
        status: 'ativa',
      },
      escopo: {
        esporte_id,
        tipos_aposta_ids,
        ligas_ids: [],
        contextos: ['ao_vivo'],
        odd_minima: 1.4,
        odd_maxima: 1.8,
        minuto_minimo: 50,
      },
      gestao: {
        metodo_stake: 'fixo',
        stake_config: { metodo: 'fixo', valor: 15 },
        banca_referencia: 'saldo_inicial',
        edge_minimo: 3,
        stop_loss_reds: 4,
        stop_loss_banca_pct: null,
      },
      regras: {
        tipo: 'grupo',
        operador: 'AND',
        filhos: [
          { tipo: 'condicao', campo: 'placar_atual', operador: 'eq', valor: '0x0' },
          { tipo: 'condicao', campo: 'minuto', operador: 'gte', valor: 50 },
          { tipo: 'condicao', campo: 'finalizacoes_pct', operador: 'gte', valor: 50 },
          { tipo: 'condicao', campo: 'xg', operador: 'gte', valor: 1.4 },
        ],
      },
      guardrails: {
        drawdown_alerta_pct: 10,
        reds_consec_alerta: 3,
        yield_minimo_alerta: null,
        revisao_apos_apostas: 25,
        revisao_apos_dias: 10,
      },
    }),
  },
  {
    id: 'under-25',
    nome: 'Under 2.5',
    descricao:
      'Pré-live conservadora: jogos defensivos com médias baixas de gols em ambos os times.',
    cor: '#0ea5e9',
    icone: '🛡',
    tipos_aposta_slugs: ['menos-de-2-5-gols'],
    esporte_slug: 'futebol',
    build: ({ esporte_id, tipos_aposta_ids }) => ({
      identidade: {
        nome: 'Under 2.5',
        descricao:
          'Foco em jogos defensivos com médias de gols baixas. Kelly conservador (¼).',
        cor: '#0ea5e9',
        tags: ['pre-live', 'under', 'conservador'],
        status: 'ativa',
      },
      escopo: {
        esporte_id,
        tipos_aposta_ids,
        ligas_ids: [],
        contextos: ['pre_live'],
        odd_minima: 1.6,
        odd_maxima: 2.1,
        minuto_minimo: null,
      },
      gestao: {
        metodo_stake: 'kelly',
        stake_config: { metodo: 'kelly', fracao: 0.25 },
        banca_referencia: 'saldo_atual',
        edge_minimo: 5,
        stop_loss_reds: 5,
        stop_loss_banca_pct: 10,
      },
      regras: {
        tipo: 'grupo',
        operador: 'AND',
        filhos: [
          { tipo: 'condicao', campo: 'media_gols_time', operador: 'lte', valor: 1.3 },
        ],
      },
      guardrails: {
        drawdown_alerta_pct: 8,
        reds_consec_alerta: 3,
        yield_minimo_alerta: null,
        revisao_apos_apostas: 40,
        revisao_apos_dias: 20,
      },
    }),
  },
];

export function findTemplate(id: string): StrategyTemplate | undefined {
  return STRATEGY_TEMPLATES.find((t) => t.id === id);
}
