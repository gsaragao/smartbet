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
export async function signInAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
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
 * Cria utilizador em auth.users. O produto assume **sem confirmação de e-mail
 * no Supabase** (Authentication → Providers → Email: confirmar e-mail
 * desligado), para sessão imediata e boas-vindas futuras via Resend.
 *
 * Se o projeto ainda exigir confirmação, não haverá sessão: devolve mensagem
 * para o utilizador fazer login após verificar o e-mail (configuração legada).
 */
export async function signUpAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
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
    if (process.env.NODE_ENV === 'development') {
      console.error('[signUpAction] Supabase Auth:', error.message, {
        code: error.code,
        status: error.status,
      });
    }
    return { ok: false, message: mapSignUpError(error) };
  }

  // Com confirmação de e-mail desligada no Supabase, quase sempre há sessão e redirect.
  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/dashboard');
  }

  return {
    ok: true,
    message: 'Conta criada. Já pode entrar com seu e-mail e senha.',
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
  if (m.includes('email not confirmed') || m.includes('not confirmed')) {
    return 'Confirme seu e-mail antes de entrar (configuração do projeto Supabase).';
  }
  return fallback;
}

/** Erro devolvido por `auth.signUp` / GoTrue (códigos estáveis em `auth-js`). */
type AuthLikeError = {
  message: string;
  code?: string;
  status?: number;
};

/** Mensagens comuns de `auth.signUp` — prioriza `code` e `status` (evita falsos positivos). */
function mapSignUpError(error: AuthLikeError): string {
  const { code, status, message } = error;
  const c = code ?? '';
  const m = message.toLowerCase();

  switch (c) {
    case 'over_request_rate_limit':
      return 'Limite de pedidos ao servidor de autenticação. Aguarde 1–2 minutos entre tentativas.';
    case 'over_email_send_rate_limit':
      return 'Limite de e-mails do Auth do Supabase ainda ativo (acumulado por tentativas anteriores; pode levar bastante tempo a libertar). Confirme “Save changes”, que o .env.local aponta para este projeto e veja Authentication → Logs. Com “Confirm email” desligado, o sign up normal não envia e-mail; hooks, reset de senha ou outro fluxo podem contar para a quota.';
    case 'over_sms_send_rate_limit':
      return 'Limite de SMS do projeto atingido. Aguarde e tente novamente.';
    case 'email_exists':
    case 'user_already_exists':
      return 'Este e-mail já está cadastrado.';
    case 'signup_disabled':
      return 'Cadastros desativados neste projeto Supabase. Em Authentication, ative “Allow new users to sign up” e clique em Save changes.';
    case 'email_address_invalid':
      return 'E-mail inválido ou rejeitado pelo provedor de autenticação.';
    case 'email_address_not_authorized':
      return 'Este domínio ou endereço de e-mail não está autorizado a registar-se neste projeto.';
    case 'weak_password':
      return 'A senha não atende à política do Supabase. Use mais caracteres ou mais variedade.';
    case 'captcha_failed':
      return 'Validação anti-robô falhou. Atualize a página e tente novamente.';
    default:
      break;
  }

  if (status === 429) {
    return 'O servidor respondeu “muitos pedidos” (429). Aguarde alguns minutos; se estiver a testar registo com e-mail de confirmação ligado, o limite de envio de e-mails pode demorar mais a libertar.';
  }

  if (
    m.includes('already registered') ||
    m.includes('user already exists') ||
    (m.includes('already') && m.includes('exists')) ||
    m.includes('duplicate key') ||
    m.includes('unique violation')
  ) {
    return 'Este e-mail já está cadastrado.';
  }

  if (
    (m.includes('rate limit') &&
      (m.includes('email') || m.includes('request') || m.includes('exceeded'))) ||
    m.includes('too many requests')
  ) {
    return 'Limite de utilização do Auth. Aguarde alguns minutos. Se recebe e-mails de confirmação, cada registo conta para o limite de envio.';
  }

  if (m.includes('security purposes') && m.includes('seconds')) {
    return 'O Supabase bloqueou pedidos repetidos muito seguidos. Aguarde o tempo indicado na mensagem técnica e tente de novo.';
  }

  if (
    (m.includes('signup') && (m.includes('disabled') || m.includes('not allowed'))) ||
    m.includes('signups not allowed')
  ) {
    return 'Novos cadastros estão desativados neste projeto Supabase.';
  }

  if (
    (m.includes('invalid') && m.includes('email')) ||
    m.includes('email address is invalid') ||
    m.includes('unable to validate email')
  ) {
    return 'E-mail inválido ou rejeitado pelo provedor de autenticação.';
  }

  if (
    m.includes('password') &&
    (m.includes('weak') ||
      m.includes('least') ||
      m.includes('short') ||
      (m.includes('long') && m.includes('password')) ||
      m.includes('requirements'))
  ) {
    return 'A senha não atende à política do servidor. Use letras, números e pelo menos 8 caracteres.';
  }

  if (
    m.includes('database error') ||
    m.includes('error saving new user') ||
    m.includes('saving new user') ||
    m.includes('creating new user') ||
    (m.includes('new user') && m.includes('fail'))
  ) {
    return 'O Auth criou o utilizador mas falhou ao gravar dados relacionados (ex.: perfil). Revise triggers/migrações no Supabase.';
  }

  if (m.includes('invalid api') || m.includes('jwt') || (m.includes('api') && m.includes('key'))) {
    return 'Chave ou URL do Supabase inválida no servidor.';
  }

  return mapAuthError(message);
}
