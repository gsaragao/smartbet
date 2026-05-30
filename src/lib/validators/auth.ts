import { z } from 'zod';

/**
 * Authentication schemas shared between client forms and server actions,
 * so validation is identical on both sides (no drift between UX and security).
 */

export const emailSchema = z.string().trim().min(1, 'Informe seu e-mail').email('E-mail inválido');

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(72, 'A senha não pode ter mais de 72 caracteres');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha'),
});

export const signUpPasswordSchema = passwordSchema
  .refine((s) => /[A-Za-z]/.test(s), {
    message: 'A senha deve conter pelo menos uma letra.',
  })
  .refine((s) => /\d/.test(s), {
    message: 'A senha deve conter pelo menos um número.',
  });

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: signUpPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Utilizador autenticado altera a própria senha (confirma senha atual). */
export const changePasswordSelfSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Informe a senha atual.'),
    novaSenha: passwordSchema,
    confirmarSenha: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((d) => d.novaSenha === d.confirmarSenha, {
    path: ['confirmarSenha'],
    message: 'As senhas não conferem.',
  })
  .refine((d) => d.senhaAtual !== d.novaSenha, {
    path: ['novaSenha'],
    message: 'A nova senha deve ser diferente da atual.',
  });

/** Admin define senha de outro utilizador (Auth). */
export const adminSetPasswordSchema = z
  .object({
    usuarioId: z.string().uuid('ID inválido.'),
    novaSenha: passwordSchema,
    confirmarSenha: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((d) => d.novaSenha === d.confirmarSenha, {
    path: ['confirmarSenha'],
    message: 'As senhas não conferem.',
  });

export type ChangePasswordSelfInput = z.infer<typeof changePasswordSelfSchema>;
export type AdminSetPasswordInput = z.infer<typeof adminSetPasswordSchema>;
