/**
 * Avaliador de regras da estratégia no contexto de uma aposta.
 *
 * A UI precisa mostrar em tempo real se os valores digitados pelo usuário
 * (odd, liga, tipo, etc.) batem com o AST de regras da estratégia. A mesma
 * lógica é executada server-side no Server Action para impedir que um cliente
 * malicioso burle a validação.
 *
 * Por que não reusamos nenhuma lib? Porque o AST é estreito (13 campos × 9
 * operadores) e 100% nosso — uma função pura de < 150 linhas é mais fácil
 * de auditar do que puxar uma dependência genérica.
 */

import type { RuleCondition, RuleGroup, RuleNode } from '@/features/strategies/schema';

/**
 * Contexto disponível no momento de avaliar regras.
 *
 * Em S1, populamos apenas o que está no formulário (odd, liga, tipo de
 * aposta, contexto pre_live/ao_vivo e minuto se ao_vivo). Campos de jogo ao
 * vivo (placar, finalizações, xG, posse, etc.) ficam `undefined` — regras
 * que dependem deles são tratadas como "não aplicáveis" em vez de
 * "violadas", porque o usuário está registrando ANTES do fim do jogo.
 */
export type BetContext = {
  odd?: number;
  minuto?: number | null;
  placar_ht?: string;
  placar_atual?: string;
  finalizacoes_pct?: number;
  xg?: number;
  posse?: number;
  cartoes?: number;
  escanteios?: number;
  btts_historico?: number;
  media_gols_time?: number;
  mandante?: boolean;
  liga?: number | null;
  tipo_aposta_id?: number;
  contextos_aposta?: ('pre_live' | 'ao_vivo')[];
};

export type RuleEvaluation = {
  ok: boolean;
  violacoes: string[];
};

/**
 * Avalia o AST inteiro e devolve:
 *   - ok: true se nenhuma regra foi violada (ou se não há regras).
 *   - violacoes: lista de mensagens humanas para cada regra violada.
 */
export function avaliarRegrasDaEstrategia(
  regras: RuleGroup | null,
  ctx: BetContext,
): RuleEvaluation {
  if (!regras || !regras.filhos || regras.filhos.length === 0) {
    return { ok: true, violacoes: [] };
  }

  const violacoes: string[] = [];
  const ok = avaliarNo(regras, ctx, violacoes);
  return { ok, violacoes };
}

function avaliarNo(node: RuleNode, ctx: BetContext, acc: string[]): boolean {
  if (node.tipo === 'grupo') {
    return avaliarGrupo(node, ctx, acc);
  }
  return avaliarCondicao(node, ctx, acc);
}

function avaliarGrupo(group: RuleGroup, ctx: BetContext, acc: string[]): boolean {
  if (group.filhos.length === 0) return true;

  if (group.operador === 'AND') {
    let ok = true;
    for (const filho of group.filhos) {
      const sub = avaliarNo(filho, ctx, acc);
      if (!sub) ok = false;
    }
    return ok;
  }

  // OR: pelo menos 1 precisa passar. Se nenhum passar, anexamos a primeira
  // violação (para dar contexto), mas não poluímos com todas.
  const subAcc: string[] = [];
  for (const filho of group.filhos) {
    const passou = avaliarNo(filho, ctx, subAcc);
    if (passou) return true;
  }
  if (subAcc.length > 0) {
    acc.push(`Nenhuma condição do grupo OR foi atendida (ex.: ${subAcc[0]}).`);
  }
  return false;
}

function avaliarCondicao(
  cond: RuleCondition,
  ctx: BetContext,
  acc: string[],
): boolean {
  const valorContexto = getContextValue(cond.campo, ctx);

  if (valorContexto === undefined) {
    // Regra não aplicável com os dados disponíveis no momento do registro
    // (ex.: finalizacoes_pct em pré-live). Não tratamos como violação.
    return true;
  }

  const ok = compareValues(cond.operador, valorContexto, cond.valor);
  if (!ok) {
    acc.push(describeCondicaoViolada(cond, valorContexto));
  }
  return ok;
}

function getContextValue(campo: string, ctx: BetContext): unknown {
  switch (campo) {
    case 'odd':
      return ctx.odd;
    case 'minuto':
      return ctx.minuto ?? undefined;
    case 'placar_ht':
      return ctx.placar_ht;
    case 'placar_atual':
      return ctx.placar_atual;
    case 'finalizacoes_pct':
      return ctx.finalizacoes_pct;
    case 'xg':
      return ctx.xg;
    case 'posse':
      return ctx.posse;
    case 'cartoes':
      return ctx.cartoes;
    case 'escanteios':
      return ctx.escanteios;
    case 'btts_historico':
      return ctx.btts_historico;
    case 'media_gols_time':
      return ctx.media_gols_time;
    case 'mandante':
      return ctx.mandante;
    case 'liga':
      return ctx.liga ?? undefined;
    default:
      return undefined;
  }
}

function compareValues(operador: string, a: unknown, b: unknown): boolean {
  switch (operador) {
    case 'eq':
      return coerceEqual(a, b);
    case 'neq':
      return !coerceEqual(a, b);
    case 'gt':
      return toNumber(a) > toNumber(b);
    case 'gte':
      return toNumber(a) >= toNumber(b);
    case 'lt':
      return toNumber(a) < toNumber(b);
    case 'lte':
      return toNumber(a) <= toNumber(b);
    case 'in':
      return Array.isArray(b) && b.some((v) => coerceEqual(a, v));
    case 'not_in':
      return Array.isArray(b) && !b.some((v) => coerceEqual(a, v));
    case 'between':
      if (!Array.isArray(b) || b.length !== 2) return false;
      return toNumber(a) >= toNumber(b[0]) && toNumber(a) <= toNumber(b[1]);
    default:
      return false;
  }
}

function coerceEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' || typeof b === 'number') {
    return toNumber(a) === toNumber(b);
  }
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return Boolean(a) === Boolean(b);
  }
  return String(a) === String(b);
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }
  if (typeof v === 'boolean') return v ? 1 : 0;
  return NaN;
}

function describeCondicaoViolada(cond: RuleCondition, valorAtual: unknown): string {
  const campo = FIELD_LABEL[cond.campo] ?? cond.campo;
  const op = OPERATOR_SYMBOL[cond.operador] ?? cond.operador;
  const alvo = Array.isArray(cond.valor) ? `[${cond.valor.join(', ')}]` : String(cond.valor);
  return `${campo} (${format(valorAtual)}) ${op} ${alvo} não foi atendido.`;
}

function format(v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
  }
  return String(v);
}

const FIELD_LABEL: Record<string, string> = {
  odd: 'Odd',
  minuto: 'Minuto',
  placar_ht: 'Placar HT',
  placar_atual: 'Placar atual',
  finalizacoes_pct: 'Finalizações no alvo (%)',
  xg: 'xG',
  posse: 'Posse (%)',
  cartoes: 'Cartões',
  escanteios: 'Escanteios',
  btts_historico: 'BTTS histórico (%)',
  media_gols_time: 'Média de gols por time',
  mandante: 'Mandante',
  liga: 'Liga',
};

const OPERATOR_SYMBOL: Record<string, string> = {
  eq: '=',
  neq: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  in: '∈',
  not_in: '∉',
  between: 'entre',
};

/**
 * Helper adicional: verifica o ESCOPO da estratégia (odd range, tipo de
 * aposta permitido, liga permitida, contexto). Isso é separado do AST
 * porque o escopo é hard-coded na estratégia (colunas diretas), não uma
 * condição do builder de regras.
 */
export type ScopeCheck = {
  ok: boolean;
  violacoes: string[];
};

export type StrategyScope = {
  esporte_id: number;
  tipos_aposta_ids: number[];
  ligas_ids: number[];
  contextos: ('pre_live' | 'ao_vivo')[];
  odd_minima: number | null;
  odd_maxima: number | null;
  minuto_minimo: number | null;
};

export function avaliarEscopoDaEstrategia(
  escopo: StrategyScope,
  ctx: BetContext,
): ScopeCheck {
  const violacoes: string[] = [];

  if (
    ctx.odd != null &&
    escopo.odd_minima != null &&
    ctx.odd < escopo.odd_minima
  ) {
    violacoes.push(`Odd ${ctx.odd.toFixed(2)} abaixo do mínimo (${escopo.odd_minima}).`);
  }
  if (
    ctx.odd != null &&
    escopo.odd_maxima != null &&
    ctx.odd > escopo.odd_maxima
  ) {
    violacoes.push(`Odd ${ctx.odd.toFixed(2)} acima do máximo (${escopo.odd_maxima}).`);
  }

  if (
    ctx.tipo_aposta_id != null &&
    escopo.tipos_aposta_ids.length > 0 &&
    !escopo.tipos_aposta_ids.includes(ctx.tipo_aposta_id)
  ) {
    violacoes.push('Tipo de aposta fora do escopo da estratégia.');
  }

  if (
    ctx.liga != null &&
    escopo.ligas_ids.length > 0 &&
    !escopo.ligas_ids.includes(ctx.liga)
  ) {
    violacoes.push('Liga fora do escopo da estratégia.');
  }

  // Contextos não são obrigatórios em S1 (o usuário não informa no form).
  // A validação fica preparada para quando a UI passar explicitamente.

  if (
    ctx.minuto != null &&
    escopo.minuto_minimo != null &&
    ctx.minuto < escopo.minuto_minimo
  ) {
    violacoes.push(
      `Minuto ${ctx.minuto} abaixo do mínimo configurado (${escopo.minuto_minimo}).`,
    );
  }

  return { ok: violacoes.length === 0, violacoes };
}

/**
 * Combinação de escopo + regras. É o que a UI e a action chamam.
 */
export function avaliarApostaVsEstrategia(params: {
  regras: RuleGroup | null;
  escopo: StrategyScope;
  contexto: BetContext;
}): { ok: boolean; violacoes: string[] } {
  const esc = avaliarEscopoDaEstrategia(params.escopo, params.contexto);
  const reg = avaliarRegrasDaEstrategia(params.regras, params.contexto);
  return {
    ok: esc.ok && reg.ok,
    violacoes: [...esc.violacoes, ...reg.violacoes],
  };
}
