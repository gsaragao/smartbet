import { z } from 'zod';

import { RULE_FIELDS, RULE_OPERATORS } from './rules-catalog';

const RULE_FIELD_IDS = RULE_FIELDS.map((f) => f.id) as [string, ...string[]];
const RULE_OPERATOR_IDS = RULE_OPERATORS.map((o) => o.id) as [string, ...string[]];

// ---------------------------------------------------------------------------
// Identidade
// ---------------------------------------------------------------------------

const HEX_REGEX = /^#([0-9a-fA-F]{3}){1,2}$/;

export const strategyIdentitySchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Nome muito curto.')
    .max(80, 'Máximo 80 caracteres.'),
  descricao: z.string().trim().max(500, 'Máximo 500 caracteres.').default(''),
  cor: z
    .string()
    .trim()
    .regex(HEX_REGEX, 'Informe uma cor hexadecimal (ex.: #ef4444).')
    .default('#6366f1'),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Tag vazia.')
        .max(24, 'Tag muito longa.'),
    )
    .max(10, 'Máximo 10 tags.')
    .default([]),
  status: z.enum(['ativa', 'pausada', 'arquivada']).default('ativa'),
});

export type StrategyIdentityInput = z.infer<typeof strategyIdentitySchema>;

// ---------------------------------------------------------------------------
// Escopo
// ---------------------------------------------------------------------------

export const strategyScopeSchema = z
  .object({
    esporte_id: z.number().int().positive('Selecione um esporte.'),
    tipos_aposta_ids: z
      .array(z.number().int().positive())
      .min(1, 'Selecione ao menos 1 tipo de aposta.')
      .max(50, 'Máximo 50 tipos.'),
    ligas_ids: z.array(z.number().int().positive()).max(200).default([]),
    contextos: z
      .array(z.enum(['pre_live', 'ao_vivo']))
      .min(1, 'Selecione ao menos 1 contexto.'),
    odd_minima: z
      .number()
      .min(1.01, 'Odd mínima deve ser ≥ 1.01.')
      .max(100, 'Odd mínima deve ser ≤ 100.')
      .nullable()
      .default(null),
    odd_maxima: z
      .number()
      .min(1.01, 'Odd máxima deve ser ≥ 1.01.')
      .max(100, 'Odd máxima deve ser ≤ 100.')
      .nullable()
      .default(null),
    minuto_minimo: z
      .number()
      .int()
      .min(0, 'Mínimo 0.')
      .max(120, 'Máximo 120.')
      .nullable()
      .default(null),
  })
  .superRefine((data, ctx) => {
    if (
      data.odd_minima != null &&
      data.odd_maxima != null &&
      data.odd_minima > data.odd_maxima
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['odd_maxima'],
        message: 'Odd máxima deve ser ≥ odd mínima.',
      });
    }
    if (data.minuto_minimo != null && !data.contextos.includes('ao_vivo')) {
      ctx.addIssue({
        code: 'custom',
        path: ['minuto_minimo'],
        message: 'Minuto mínimo só faz sentido quando o contexto "ao vivo" está ativo.',
      });
    }
  });

export type StrategyScopeInput = z.infer<typeof strategyScopeSchema>;

// ---------------------------------------------------------------------------
// Gestão (método de stake + banca de referência + stop-loss)
// ---------------------------------------------------------------------------

const bancaReferenciaEnum = z.enum(['saldo_atual', 'saldo_inicial', 'media_7d']);

const progressaoTipoEnum = z.enum(['martingale', 'customizado', 'fibonacci']);

const stakeConfigSchema = z.discriminatedUnion('metodo', [
  z.object({ metodo: z.literal('livre') }),
  z.object({
    metodo: z.literal('fixo'),
    valor: z.number().positive('Valor deve ser > 0.').max(1_000_000),
  }),
  z.object({
    metodo: z.literal('percentual'),
    percentual: z
      .number()
      .gt(0, 'Percentual deve ser > 0.')
      .max(10, 'Máximo 10%.'),
  }),
  z.object({
    metodo: z.literal('kelly'),
    fracao: z
      .number()
      .min(0.1, 'Fração mínima: 0.1.')
      .max(1, 'Fração máxima: 1.0.'),
  }),
  z.object({
    metodo: z.literal('progressao'),
    tipo: progressaoTipoEnum,
    valor_inicial: z.number().positive().max(1_000_000),
    /** Usado pelos modos customizado e martingale (multiplicador). */
    multiplicador: z.number().positive().max(10).nullable().default(null),
    /** Degraus explícitos para o modo customizado. */
    degraus: z
      .array(z.number().positive())
      .max(20, 'Máximo 20 degraus.')
      .default([]),
  }),
]);

export const strategyManagementSchema = z
  .object({
    metodo_stake: z.enum(['livre', 'fixo', 'percentual', 'kelly', 'progressao']),
    stake_config: stakeConfigSchema,
    banca_referencia: bancaReferenciaEnum.default('saldo_atual'),
    edge_minimo: z
      .number()
      .min(0)
      .max(100)
      .nullable()
      .default(null),
    stop_loss_reds: z
      .number()
      .int()
      .min(1, 'Mínimo 1.')
      .max(30, 'Máximo 30.')
      .nullable()
      .default(null),
    stop_loss_banca_pct: z
      .number()
      .min(0.5, 'Mínimo 0,5%.')
      .max(100, 'Máximo 100%.')
      .nullable()
      .default(null),
  })
  .superRefine((data, ctx) => {
    if (data.metodo_stake !== data.stake_config.metodo) {
      ctx.addIssue({
        code: 'custom',
        path: ['stake_config'],
        message: 'Configuração não bate com o método selecionado.',
      });
    }
  });

export type StrategyManagementInput = z.infer<typeof strategyManagementSchema>;

// ---------------------------------------------------------------------------
// Regras (AST recursivo: grupos AND/OR contendo condições ou sub-grupos)
// ---------------------------------------------------------------------------

const conditionSchema = z.object({
  tipo: z.literal('condicao'),
  campo: z.enum(RULE_FIELD_IDS),
  operador: z.enum(RULE_OPERATOR_IDS),
  valor: z.unknown(),
});

export type RuleCondition = z.infer<typeof conditionSchema>;

export type RuleNode = RuleCondition | RuleGroup;
export type RuleGroup = {
  tipo: 'grupo';
  operador: 'AND' | 'OR';
  filhos: RuleNode[];
};

// Schema recursivo (lazy). Usamos `z.custom` para evitar o problema de
// z.lazy + discriminatedUnion em runtimes mais estritos.
export const ruleNodeSchema: z.ZodType<RuleNode> = z.lazy(() =>
  z.union([conditionSchema, ruleGroupSchema]),
);

export const ruleGroupSchema: z.ZodType<RuleGroup> = z.lazy(() =>
  z.object({
    tipo: z.literal('grupo'),
    operador: z.enum(['AND', 'OR']),
    filhos: z
      .array(ruleNodeSchema)
      .max(50, 'Limite de 50 nós em um grupo.'),
  }),
);

export const strategyRulesSchema = ruleGroupSchema;

// ---------------------------------------------------------------------------
// Guardrails e revisão
// ---------------------------------------------------------------------------

export const strategyGuardrailsSchema = z
  .object({
    drawdown_alerta_pct: z.number().min(0).max(100).nullable().default(null),
    reds_consec_alerta: z.number().int().min(1).max(30).nullable().default(null),
    yield_minimo_alerta: z.number().min(-100).max(100).nullable().default(null),
    revisao_apos_apostas: z.number().int().min(1).max(10_000).nullable().default(null),
    revisao_apos_dias: z.number().int().min(1).max(365).nullable().default(null),
  })
  .default({
    drawdown_alerta_pct: null,
    reds_consec_alerta: null,
    yield_minimo_alerta: null,
    revisao_apos_apostas: null,
    revisao_apos_dias: null,
  });

export type StrategyGuardrailsInput = z.infer<typeof strategyGuardrailsSchema>;

// ---------------------------------------------------------------------------
// Composição final
// ---------------------------------------------------------------------------

export const strategyInputSchema = z.object({
  identidade: strategyIdentitySchema,
  escopo: strategyScopeSchema,
  gestao: strategyManagementSchema,
  regras: strategyRulesSchema,
  guardrails: strategyGuardrailsSchema,
});

export type StrategyInput = z.infer<typeof strategyInputSchema>;

export const strategyUpdateSchema = strategyInputSchema.extend({
  id: z.string().uuid(),
});

export type StrategyUpdateInput = z.infer<typeof strategyUpdateSchema>;

// ---------------------------------------------------------------------------
// Defaults expostos para o wizard
// ---------------------------------------------------------------------------

export function defaultStrategyInput(): StrategyInput {
  return {
    identidade: {
      nome: '',
      descricao: '',
      cor: '#6366f1',
      tags: [],
      status: 'ativa',
    },
    escopo: {
      esporte_id: 0,
      tipos_aposta_ids: [],
      ligas_ids: [],
      contextos: ['pre_live'],
      odd_minima: null,
      odd_maxima: null,
      minuto_minimo: null,
    },
    gestao: {
      metodo_stake: 'livre',
      stake_config: { metodo: 'livre' },
      banca_referencia: 'saldo_atual',
      edge_minimo: null,
      stop_loss_reds: null,
      stop_loss_banca_pct: null,
    },
    regras: { tipo: 'grupo', operador: 'AND', filhos: [] },
    guardrails: {
      drawdown_alerta_pct: null,
      reds_consec_alerta: null,
      yield_minimo_alerta: null,
      revisao_apos_apostas: null,
      revisao_apos_dias: null,
    },
  };
}
