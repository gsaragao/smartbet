import { z } from 'zod';

/**
 * Slug usado em ligas. `citext` no banco + unique (esporte_id, slug): o mesmo
 * slug pode coexistir em esportes diferentes. O formato é o que `slugify()`
 * produz — lowercase, alfanumérico, hífens internos.
 */
export const slugLigaSchema = z
  .string()
  .trim()
  .min(2, 'Mínimo 2 caracteres.')
  .max(64, 'Máximo 64 caracteres.')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use apenas minúsculas, números e hífens (ex.: brasileirao-serie-a).',
  );

/**
 * Schema sem `transform` para manter `input = output` — o React Hook Form
 * fica feliz (um único tipo genérico) e o Server Action pode converter o
 * que for necessário (ex.: `temporada === ''` → `null`) antes do insert.
 */
export const ligaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres.')
    .max(80, 'Máximo 80 caracteres.'),
  slug: slugLigaSchema,
  esporte_id: z
    .number({ error: 'Selecione um esporte.' })
    .int()
    .positive('Selecione um esporte.'),
  /** `null` = liga internacional / sem país associado (Champions, Libertadores). */
  pais_id: z.number().int().positive().nullable(),
  /** String vazia é tratada como ausência de temporada no Server Action. */
  temporada: z
    .string()
    .trim()
    .max(32, 'Máximo 32 caracteres.'),
  ativo: z.boolean(),
});

export type LigaInput = z.infer<typeof ligaSchema>;

export const ligaUpdateSchema = ligaSchema.extend({
  id: z.number().int().positive(),
});

export type LigaUpdateInput = z.infer<typeof ligaUpdateSchema>;
