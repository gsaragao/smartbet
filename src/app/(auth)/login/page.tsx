import type { Metadata } from 'next';
import Link from 'next/link';

import { SignInForm } from './sign-in-form';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Acesse sua conta Smart Bet.',
};

type SearchParams = { next?: string; registered?: string };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { next, registered } = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Acesse o painel e continue acompanhando suas estratégias.
        </p>
      </header>

      {registered === '1' && (
        <div
          role="status"
          className="border-win/30 bg-win-muted text-foreground rounded-md border px-3 py-2 text-sm"
        >
          Conta criada! Confirme seu e-mail se necessário e faça login.
        </div>
      )}

      <SignInForm nextUrl={next} />

      <p className="text-muted-foreground text-center text-sm">
        Ainda não tem conta?{' '}
        <Link
          href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}
