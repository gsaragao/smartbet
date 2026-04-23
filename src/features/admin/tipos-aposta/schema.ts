import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

/**
 * Slug rule: lowercase letters/digits separated by `-` or `_`. Keeps URLs
 * friendly and matches the ones we seeded in migration 0007.
 */
export const slugSchema = z
  .string()
  .trim()
  .min(2, 'Mínimo 2 caracteres.')
  .max(48, 'Máximo 48 caracteres.')
  .regex(slugRegex, 'Use apenas letras minúsculas, números, hífens ou underscores.');

/**
 * Schema shared between the UI form and the server action. We purposely avoid
 * `z.coerce` here so that the Zod `input` and `output` types stay aligned —
 * which keeps React Hook Form's generics happy. The (few) fields that need
 * coercion (numeric `esporte_id` coming from a <select>) are pre-processed
 * in the client side before calling the action.
 */
export const tipoApostaSchema = z.object({
  esporte_id: z
    .number({ error: 'Selecione um esporte.' })
    .int()
    .positive('Selecione um esporte.'),
  categoria: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres.')
    .max(40, 'Máximo 40 caracteres.'),
  nome: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres.')
    .max(60, 'Máximo 60 caracteres.'),
  slug: slugSchema,
  // Kept as plain `string` (no `.default()` / `.transform()`) so Zod's
  // input and output types stay aligned — that's what React Hook Form
  // needs to infer its generics cleanly. The server action is the one
  // that coerces empty string to null when persisting.
  descricao: z
    .string()
    .trim()
    .max(280, 'Máximo 280 caracteres.'),
  ativo: z.boolean(),
});

export type TipoApostaInput = z.infer<typeof tipoApostaSchema>;

/** Shape used by the update action: same as insert, plus the row id. */
export const tipoApostaUpdateSchema = tipoApostaSchema.extend({
  id: z.number().int().positive(),
});

export type TipoApostaUpdateInput = z.infer<typeof tipoApostaUpdateSchema>;
