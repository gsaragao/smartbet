import { z } from 'zod';

import { MOEDAS } from '@/features/banca/schema';
import { isValidTimeZoneId } from '@/lib/timezones';

const papeis = ['admin', 'executor', 'consulta', 'usuario'] as const;

const fusoHorarioBase = z
  .string()
  .min(1, 'Obrigatório.')
  .max(120)
  .refine(isValidTimeZoneId, 'Selecione um fuso horário IANA válido.');

export const adminUsuarioFormSchema = z.object({
  usuarioId: z.string().uuid('ID inválido.'),
  papel: z.enum(papeis),
  nomeCompleto: z.string().max(200, 'Máx. 200 caracteres.').optional(),
  moeda: z.enum(MOEDAS, { error: 'Selecione uma moeda.' }),
  fusoHorario: fusoHorarioBase,
});

export type AdminUsuarioFormValues = z.infer<typeof adminUsuarioFormSchema>;

/** Payload para a server action (campos opcionais exceto usuarioId). */
export const adminUsuarioPatchSchema = z
  .object({
    usuarioId: z.string().uuid('ID inválido.'),
    papel: z.enum(papeis).optional(),
    nomeCompleto: z.string().max(200, 'Máx. 200 caracteres.').optional().nullable(),
    moeda: z.enum(MOEDAS, { error: 'Selecione uma moeda.' }).optional(),
    fusoHorario: fusoHorarioBase.optional(),
  })
  .refine(
    (data) =>
      data.papel !== undefined ||
      data.nomeCompleto !== undefined ||
      data.moeda !== undefined ||
      data.fusoHorario !== undefined,
    { message: 'Nada para atualizar.', path: ['usuarioId'] },
  );

export type AdminUsuarioPatchInput = z.infer<typeof adminUsuarioPatchSchema>;
