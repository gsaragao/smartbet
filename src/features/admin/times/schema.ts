import { z } from 'zod';

/**
 * Slug para times. Mesma regra das ligas: unique (esporte_id, slug),
 * `citext` no banco. Forçamos kebab-case no cliente por consistência
 * visual.
 */
export const slugTimeSchema = z
  .string()
  .trim()
  .min(2, 'Mínimo 2 caracteres.')
  .max(64, 'Máximo 64 caracteres.')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use apenas minúsculas, números e hífens (ex.: flamengo, real-madrid).',
  );

/**
 * URL de escudo — opcional. Aceita string vazia (convertida para `null`
 * no Server Action) e qualquer URL http(s). Não validamos content-type
 * do host para não travar UX em ambientes com CDNs variadas.
 */
const escudoUrlSchema = z
  .string()
  .trim()
  .max(500, 'URL muito longa.')
  .refine(
    (v) => v.length === 0 || /^https?:\/\/.+/i.test(v),
    'Informe uma URL http(s) válida.',
  );

export const timeSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres.')
    .max(80, 'Máximo 80 caracteres.'),
  slug: slugTimeSchema,
  esporte_id: z
    .number({ error: 'Selecione um esporte.' })
    .int()
    .positive('Selecione um esporte.'),
  /** `null` = time sem país (seleções regionais, amadores, etc.). */
  pais_id: z.number().int().positive().nullable(),
  escudo_url: escudoUrlSchema,
});

export type TimeInput = z.infer<typeof timeSchema>;

export const timeUpdateSchema = timeSchema.extend({
  id: z.number().int().positive(),
});

export type TimeUpdateInput = z.infer<typeof timeUpdateSchema>;
