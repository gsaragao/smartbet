import { z } from 'zod';

/**
 * Código ISO-3166 alpha-2, sempre 2 letras maiúsculas. A coluna do banco é
 * `char(2) not null unique`, então qualquer entrada que não case é recusada
 * ali também — este schema só antecipa a rejeição com mensagem amigável.
 */
export const codigoIsoSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(2, 'Use exatamente 2 letras.')
  .regex(/^[A-Z]{2}$/, 'Use apenas letras (ex.: BR, US, ES).');

export const paisSchema = z.object({
  codigo_iso: codigoIsoSchema,
  nome: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres.')
    .max(60, 'Máximo 60 caracteres.'),
});

export type PaisInput = z.infer<typeof paisSchema>;

export const paisUpdateSchema = paisSchema.extend({
  id: z.number().int().positive(),
});

export type PaisUpdateInput = z.infer<typeof paisUpdateSchema>;
