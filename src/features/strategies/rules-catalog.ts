/**
 * Catálogo de campos e operadores disponíveis no builder de regras.
 *
 * Este módulo é **estático** — é consumido tanto pelo schema Zod (para validar
 * que uma condição combina `campo × operador × valor` com um tipo coerente)
 * quanto pela UI (para renderizar o seletor de campo, o seletor de operador
 * compatível e o input correto do valor).
 *
 * Decisão 14: 13 campos + 9 operadores (ver plano).
 */

export type FieldKind =
  | 'number'
  | 'integer'
  | 'percent'
  | 'string'
  | 'score'
  | 'league-id'
  | 'boolean';

export type RuleField = {
  id: string;
  label: string;
  kind: FieldKind;
  /** Contexto em que o campo faz sentido. `'ambos'` = pre-live e ao-vivo. */
  contexto: 'pre_live' | 'ao_vivo' | 'ambos';
  /** Limites inclusivos para kinds numéricos. */
  min?: number;
  max?: number;
  unidade?: string;
  hint?: string;
};

export const RULE_FIELDS: readonly RuleField[] = [
  {
    id: 'odd',
    label: 'Odd',
    kind: 'number',
    contexto: 'ambos',
    min: 1.01,
    max: 100,
    hint: 'Valor da odd no momento da entrada.',
  },
  {
    id: 'minuto',
    label: 'Minuto do jogo',
    kind: 'integer',
    contexto: 'ao_vivo',
    min: 0,
    max: 120,
    unidade: "'",
  },
  {
    id: 'placar_ht',
    label: 'Placar do intervalo',
    kind: 'score',
    contexto: 'ambos',
    hint: 'Ex.: 0x0, 1x0, 2x1.',
  },
  {
    id: 'placar_atual',
    label: 'Placar atual',
    kind: 'score',
    contexto: 'ambos',
  },
  {
    id: 'finalizacoes_pct',
    label: 'Finalizações no alvo (%)',
    kind: 'percent',
    contexto: 'ao_vivo',
    min: 0,
    max: 100,
  },
  {
    id: 'xg',
    label: 'xG total do jogo',
    kind: 'number',
    contexto: 'ao_vivo',
    min: 0,
    max: 10,
  },
  {
    id: 'posse',
    label: 'Posse de bola (%)',
    kind: 'percent',
    contexto: 'ao_vivo',
    min: 0,
    max: 100,
  },
  {
    id: 'cartoes',
    label: 'Total de cartões',
    kind: 'integer',
    contexto: 'ao_vivo',
    min: 0,
    max: 30,
  },
  {
    id: 'escanteios',
    label: 'Total de escanteios',
    kind: 'integer',
    contexto: 'ao_vivo',
    min: 0,
    max: 30,
  },
  {
    id: 'btts_historico',
    label: 'BTTS histórico (%)',
    kind: 'percent',
    contexto: 'pre_live',
    min: 0,
    max: 100,
    hint: '% dos jogos recentes em que ambos marcaram.',
  },
  {
    id: 'media_gols_time',
    label: 'Média de gols por time',
    kind: 'number',
    contexto: 'pre_live',
    min: 0,
    max: 10,
    hint: 'Média móvel (últimos N jogos).',
  },
  {
    id: 'mandante',
    label: 'Mandante',
    kind: 'boolean',
    contexto: 'ambos',
    hint: 'Se a aposta é no time da casa.',
  },
  {
    id: 'liga',
    label: 'Liga',
    kind: 'league-id',
    contexto: 'ambos',
    hint: 'Comparado com a liga da partida.',
  },
] as const;

export type RuleFieldId = (typeof RULE_FIELDS)[number]['id'];

export const RULE_OPERATORS = [
  { id: 'eq', label: 'igual a', symbol: '=' },
  { id: 'neq', label: 'diferente de', symbol: '≠' },
  { id: 'gt', label: 'maior que', symbol: '>' },
  { id: 'gte', label: 'maior ou igual a', symbol: '≥' },
  { id: 'lt', label: 'menor que', symbol: '<' },
  { id: 'lte', label: 'menor ou igual a', symbol: '≤' },
  { id: 'in', label: 'pertence a', symbol: '∈' },
  { id: 'not_in', label: 'não pertence a', symbol: '∉' },
  { id: 'between', label: 'entre', symbol: '⟷' },
] as const;

export type RuleOperatorId = (typeof RULE_OPERATORS)[number]['id'];

const NUMERIC_OPS: readonly RuleOperatorId[] = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
];
const EQUALITY_OPS: readonly RuleOperatorId[] = ['eq', 'neq'];
const SET_OPS: readonly RuleOperatorId[] = ['in', 'not_in', 'eq', 'neq'];

/**
 * Retorna operadores válidos para um campo específico.
 */
export function operatorsForField(fieldId: RuleFieldId): readonly RuleOperatorId[] {
  const field = RULE_FIELDS.find((f) => f.id === fieldId);
  if (!field) return [];

  switch (field.kind) {
    case 'number':
    case 'integer':
    case 'percent':
      return NUMERIC_OPS;
    case 'score':
    case 'string':
      return EQUALITY_OPS;
    case 'league-id':
      return SET_OPS;
    case 'boolean':
      return EQUALITY_OPS;
    default:
      return [];
  }
}

export function getRuleField(fieldId: string): RuleField | undefined {
  return RULE_FIELDS.find((f) => f.id === fieldId);
}

export function getRuleOperator(op: string) {
  return RULE_OPERATORS.find((o) => o.id === op);
}

/**
 * Gera um rótulo legível para uma condição (usado no card e no detalhe).
 * Não tenta resolver FK (liga) — a UI de detalhe faz isso.
 */
export function describeCondition(input: {
  campo: string;
  operador: string;
  valor: unknown;
}): string {
  const field = getRuleField(input.campo);
  const op = getRuleOperator(input.operador);
  if (!field || !op) return 'condição inválida';

  const val = formatRuleValue(field.kind, input.valor);
  return `${field.label} ${op.symbol} ${val}`;
}

function formatRuleValue(kind: FieldKind, value: unknown): string {
  if (value == null) return '—';
  if (Array.isArray(value)) return `[${value.join(', ')}]`;
  switch (kind) {
    case 'percent':
      return `${value}%`;
    case 'integer':
    case 'number':
      return String(value);
    case 'boolean':
      return value ? 'sim' : 'não';
    default:
      return String(value);
  }
}
