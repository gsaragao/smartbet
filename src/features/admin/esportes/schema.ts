import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

/**
 * Slug do esporte (ex.: `futebol`, `basquete`). Precisa ser URL-safe e
 * estável, já que referencia `ligas`, `times` e `tipos_aposta` em toda a
 * aplicação.
 */
export const slugEsporteSchema = z
  .string()
  .trim()
  .min(2, 'Mínimo 2 caracteres.')
  .max(32, 'Máximo 32 caracteres.')
  .regex(slugRegex, 'Use apenas letras minúsculas, números, hífens ou underscores.');

/**
 * Schema compartilhado entre o formulário e a Server Action. Mantido "plano"
 * (sem `.transform()` / `.default()`) para que os tipos `input` e `output` do
 * Zod fiquem alinhados — é isso que o React Hook Form precisa para inferir
 * corretamente seus genéricos.
 */
export const esporteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres.')
    .max(40, 'Máximo 40 caracteres.'),
  slug: slugEsporteSchema,
  ativo: z.boolean(),
});

export type EsporteInput = z.infer<typeof esporteSchema>;

/** Shape usado pela action de atualização: igual ao insert + id. */
export const esporteUpdateSchema = esporteSchema.extend({
  id: z.number().int().positive(),
});

export type EsporteUpdateInput = z.infer<typeof esporteUpdateSchema>;
