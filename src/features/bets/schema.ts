import { z } from 'zod';

// ---------------------------------------------------------------------------
// Partida (modo híbrido)
// ---------------------------------------------------------------------------
// Uma aposta precisa de uma partida. Pode ser:
//   a) uma partida já existente no banco (reutilizar id), OU
//   b) uma nova partida informada no momento da aposta (time do catálogo
//      e/ou nome livre, data/hora, liga opcional, esporte).
//
// A escolha entre (a) e (b) é feita por um discriminator `kind`, no melhor
// estilo das Server Actions tipadas.

const partidaExistenteSchema = z.object({
  kind: z.literal('existing'),
  partida_id: z.string().uuid(),
});

const partidaNovaSchema = z
  .object({
    kind: z.literal('new'),
    esporte_id: z.number().int().positive('Selecione um esporte.'),
    liga_id: z.number().int().positive().nullable().default(null),
    // Time do catálogo OU nome livre — pelo menos um dos dois.
    time_mandante_id: z.number().int().positive().nullable().default(null),
    time_visitante_id: z.number().int().positive().nullable().default(null),
    mandante_nome: z.string().trim().max(120).default(''),
    visitante_nome: z.string().trim().max(120).default(''),
    inicio: z
      .string()
      .min(1, 'Informe a data e hora do jogo.')
      .refine((s) => !Number.isNaN(new Date(s).getTime()), 'Data/hora inválida.'),
  })
  .superRefine((data, ctx) => {
    const mandanteOk = Boolean(data.time_mandante_id) || data.mandante_nome.length > 0;
    const visitanteOk = Boolean(data.time_visitante_id) || data.visitante_nome.length > 0;
    if (!mandanteOk) {
      ctx.addIssue({
        code: 'custom',
        path: ['mandante_nome'],
        message: 'Informe o mandante (selecione um time ou digite um nome).',
      });
    }
    if (!visitanteOk) {
      ctx.addIssue({
        code: 'custom',
        path: ['visitante_nome'],
        message: 'Informe o visitante (selecione um time ou digite um nome).',
      });
    }
    if (
      data.time_mandante_id &&
      data.time_visitante_id &&
      data.time_mandante_id === data.time_visitante_id
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['time_visitante_id'],
        message: 'Mandante e visitante devem ser diferentes.',
      });
    }
  });

export const partidaInputSchema = z.discriminatedUnion('kind', [
  partidaExistenteSchema,
  partidaNovaSchema,
]);

export type PartidaInput = z.infer<typeof partidaInputSchema>;

// ---------------------------------------------------------------------------
// Seleção de aposta
// ---------------------------------------------------------------------------
// Em S1 a aposta é SIMPLES, então temos 1 seleção. O schema já está genérico
// o bastante para S3 (múltipla) reutilizar via `z.array(betSelectionSchema)`.

export const betSelectionSchema = z.object({
  partida: partidaInputSchema,
  tipo_aposta_id: z.number().int().positive('Selecione um tipo de aposta.'),
  linha: z.string().trim().max(40).default(''),
  odd: z
    .number()
    .min(1.01, 'Odd deve ser ≥ 1.01.')
    .max(1000, 'Odd deve ser ≤ 1000.'),
  descricao: z
    .string()
    .trim()
    .min(1, 'Descreva brevemente a seleção.')
    .max(200, 'Máximo 200 caracteres.'),
});

export type BetSelectionInput = z.infer<typeof betSelectionSchema>;

// ---------------------------------------------------------------------------
// Aposta (S1 = simples)
// ---------------------------------------------------------------------------

export const betInputSchema = z
  .object({
    banca_id: z.string().uuid('Selecione uma banca.'),
    estrategia_id: z.string().uuid().nullable().default(null),
    formato: z.enum(['simples', 'multipla']).default('simples'),
    stake: z
      .number()
      .positive('Stake deve ser > 0.')
      .max(10_000_000, 'Stake muito alto.'),
    eh_freebet: z.boolean().default(false),
    casa_de_aposta: z.string().trim().max(80).default(''),
    descricao: z.string().trim().max(200).default(''),
    observacao: z.string().trim().max(500).default(''),

    // S1: usado em aposta simples.
    selecao: betSelectionSchema.optional(),
    // S3: usado em aposta múltipla (2+ seleções).
    selecoes: z.array(betSelectionSchema).max(12).default([]),

    estrategia_override: z.boolean().default(false),
    motivo_override: z.string().trim().max(500).default(''),

    edge: z
      .number()
      .min(-100, 'Edge inválido.')
      .max(100, 'Edge inválido.')
      .nullable()
      .default(null),
    valor_esperado: z
      .number()
      .min(-10_000_000)
      .max(10_000_000)
      .nullable()
      .default(null),
  })
  .superRefine((data, ctx) => {
    if (data.estrategia_override && !data.estrategia_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['estrategia_id'],
        message: 'Override só se aplica quando há estratégia vinculada.',
      });
    }
    if (data.estrategia_override && data.motivo_override.length < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['motivo_override'],
        message: 'Informe o motivo do override (mínimo 3 caracteres).',
      });
    }

    if (data.formato === 'simples') {
      if (!data.selecao) {
        ctx.addIssue({
          code: 'custom',
          path: ['selecao'],
          message: 'Aposta simples requer uma seleção.',
        });
      }
    } else if (data.formato === 'multipla') {
      if (!data.selecoes || data.selecoes.length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['selecoes'],
          message: 'Múltipla requer pelo menos 2 seleções.',
        });
      }
    }
  });

export type BetInput = z.infer<typeof betInputSchema>;

export const betUpdateSchema = z.intersection(
  betInputSchema,
  z.object({ id: z.string().uuid() }),
);

export type BetUpdateInput = z.infer<typeof betUpdateSchema>;

// Produto das odds das seleções (para odd_total da múltipla).
export function calcularOddTotalMultipla(selecoes: BetSelectionInput[]): number {
  if (!selecoes || selecoes.length === 0) return 0;
  return selecoes.reduce((acc, s) => acc * (s.odd || 1), 1);
}

// ---------------------------------------------------------------------------
// Resolução
// ---------------------------------------------------------------------------

export const statusResolucaoSchema = z.enum([
  'ganha',
  'perdida',
  'anulada',
  'cashout',
  'meio_green',
  'meio_red',
]);

export const betResolveSchema = z
  .object({
    id: z.string().uuid(),
    status: statusResolucaoSchema,
    retorno_real: z
      .number()
      .min(0, 'Retorno não pode ser negativo.')
      .max(10_000_000)
      .nullable()
      .default(null),
    observacao: z.string().trim().max(500).default(''),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'cashout' && data.retorno_real == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['retorno_real'],
        message: 'Cashout exige retorno explícito.',
      });
    }
  });

export type BetResolveInput = z.infer<typeof betResolveSchema>;

// ---------------------------------------------------------------------------
// Default factory (usado pelo wizard)
// ---------------------------------------------------------------------------

export function defaultBetInput(overrides?: {
  banca_id?: string;
  esporte_id?: number;
}): BetInput {
  return {
    banca_id: overrides?.banca_id ?? '',
    estrategia_id: null,
    formato: 'simples',
    stake: 0,
    eh_freebet: false,
    casa_de_aposta: '',
    descricao: '',
    observacao: '',
    selecao: {
      partida: {
        kind: 'new',
        esporte_id: overrides?.esporte_id ?? 0,
        liga_id: null,
        time_mandante_id: null,
        time_visitante_id: null,
        mandante_nome: '',
        visitante_nome: '',
        inicio: '',
      },
      tipo_aposta_id: 0,
      linha: '',
      odd: 1.01,
      descricao: '',
    },
    selecoes: [],
    estrategia_override: false,
    motivo_override: '',
    edge: null,
    valor_esperado: null,
  };
}

// ---------------------------------------------------------------------------
// Helpers de análise (EV+ e Edge)
// ---------------------------------------------------------------------------

/**
 * Edge = probabilidade estimada - probabilidade implícita na odd.
 *
 *   odd_justa < odd_ofertada → edge positivo ("aposta valor")
 *
 * Em pontos percentuais (0.05 = 5%).
 */
export function calcularEdge(oddOfertada: number, oddJusta: number): number {
  if (!Number.isFinite(oddOfertada) || !Number.isFinite(oddJusta)) return 0;
  if (oddOfertada < 1.01 || oddJusta < 1.01) return 0;
  const probEstimada = 1 / oddJusta;
  const probImplicita = 1 / oddOfertada;
  return probEstimada - probImplicita;
}

/**
 * EV+ monetário esperado por unidade de stake.
 *
 *   EV = (P × ganho_liquido) - ((1 - P) × stake)
 *
 * onde P é a probabilidade estimada (1/odd_justa).
 */
export function calcularValorEsperado(
  stake: number,
  oddOfertada: number,
  oddJusta: number,
): number {
  if (stake <= 0 || oddOfertada < 1.01 || oddJusta < 1.01) return 0;
  const p = 1 / oddJusta;
  const ganhoLiquido = stake * (oddOfertada - 1);
  return p * ganhoLiquido - (1 - p) * stake;
}
