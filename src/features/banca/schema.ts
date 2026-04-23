import { z } from 'zod';

// Moedas suportadas no MVP. Ampliar conforme necessidade (GBP, ARS, etc.).
export const MOEDAS = ['BRL', 'USD', 'EUR'] as const;
export type Moeda = (typeof MOEDAS)[number];

// ---------------------------------------------------------------------------
// Banca
// ---------------------------------------------------------------------------

export const bancaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres.')
    .max(80, 'Máximo 80 caracteres.'),
  casa_de_aposta: z
    .string()
    .trim()
    .max(60, 'Máximo 60 caracteres.')
    .optional()
    .default(''),
  moeda: z.enum(MOEDAS, { error: 'Selecione uma moeda.' }),
  saldo_inicial: z
    .number({ error: 'Informe um valor numérico.' })
    .nonnegative('Saldo inicial não pode ser negativo.')
    .max(999_999_999_99, 'Valor muito alto.'),
  e_principal: z.boolean(),
});

export type BancaInput = z.input<typeof bancaSchema>;
export type BancaParsed = z.output<typeof bancaSchema>;

export const bancaUpdateSchema = bancaSchema
  .extend({
    id: z.string().uuid(),
  })
  // No update, saldo_inicial é editável mas o trigger recalcula saldo_atual.
  // Mantemos o mesmo shape para simplificar o form.
  ;

export type BancaUpdateInput = z.input<typeof bancaUpdateSchema>;

// ---------------------------------------------------------------------------
// Evento de Banca (depósito / saque / ajuste)
// ---------------------------------------------------------------------------
// Convenção de sinal exposta ao usuário:
//   - deposito: valor positivo digitado
//   - saque:    valor positivo digitado (será persistido como negativo)
//   - ajuste:   valor pode ser negativo (usar sinal explícito)
//
// A Server Action faz a normalização antes de persistir.
// ---------------------------------------------------------------------------

export const TIPOS_EVENTO_UI = ['deposito', 'saque', 'ajuste'] as const;
export type TipoEventoUI = (typeof TIPOS_EVENTO_UI)[number];

export const eventoBancaSchema = z
  .object({
    banca_id: z.string().uuid(),
    tipo: z.enum(TIPOS_EVENTO_UI, { error: 'Selecione um tipo.' }),
    valor: z
      .number({ error: 'Informe um valor numérico.' })
      .refine((v) => v !== 0, 'O valor não pode ser zero.')
      .refine((v) => Math.abs(v) <= 999_999_999_99, 'Valor muito alto.'),
    observacao: z
      .string()
      .trim()
      .max(200, 'Máximo 200 caracteres.')
      .optional()
      .default(''),
    ocorrido_em: z
      .string()
      .min(1, 'Informe a data do evento.')
      .refine((s) => !Number.isNaN(Date.parse(s)), 'Data inválida.'),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === 'deposito' && data.valor <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['valor'],
        message: 'Depósito precisa ser positivo.',
      });
    }
    if (data.tipo === 'saque' && data.valor <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['valor'],
        message: 'Informe o valor do saque como positivo.',
      });
    }
  });

export type EventoBancaInput = z.input<typeof eventoBancaSchema>;
export type EventoBancaParsed = z.output<typeof eventoBancaSchema>;
