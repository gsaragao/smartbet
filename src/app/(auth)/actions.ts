'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signInSchema, signUpSchema } from '@/lib/validators/auth';

export type ActionResult = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Signs in with email + password. On success, redirects to the `next`
 * query-string param (or /dashboard by default). On validation or credential
 * errors, returns a structured result so the client form can display them.
 */
export async function signInAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Verifique os campos destacados.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      ok: false,
      message: mapAuthError(error.message, 'Credenciais inválidas.'),
    };
  }

  const next = getSafeNext(formData.get('next'));
  revalidatePath('/', 'layout');
  redirect(next);
}

/**
 * Creates a new user. Supabase sends a confirmation e-mail by default (if
 * enabled on the project). We surface that to the user instead of redirecting.
 */
export async function signUpAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Verifique os campos destacados.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: mapAuthError(error.message) };
  }

  // When email confirmation is disabled, Supabase returns a session and the
  // user is already logged in. In that case we go straight to the app.
  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/dashboard');
  }

  return {
    ok: true,
    message: 'Conta criada. Verifique seu e-mail para confirmar o cadastro.',
  };
}

/**
 * Destroys the current session. Called from a <form action={signOutAction}>.
 */
export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSafeNext(raw: FormDataEntryValue | null): string {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/dashboard';
  }
  return raw;
}

function mapAuthError(message: string, fallback = 'Algo deu errado. Tente novamente.'): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (m.includes('email rate limit')) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (m.includes('confirm')) return 'Confirme seu e-mail antes de entrar.';
  return fallback;
}
