import { z } from 'zod';

/**
 * Authentication schemas shared between client forms and server actions,
 * so validation is identical on both sides (no drift between UX and security).
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail')
  .email('E-mail inválido');

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(72, 'A senha não pode ter mais de 72 caracteres');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha'),
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
