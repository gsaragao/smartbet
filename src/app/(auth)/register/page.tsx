import type { Metadata } from 'next';
import Link from 'next/link';

import { SignUpForm } from './sign-up-form';

export const metadata: Metadata = {
  title: 'Criar conta',
  description: 'Crie sua conta Smart Bet e comece a apostar com método.',
};

type SearchParams = { next?: string };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Criar sua conta</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Leva menos de 1 minuto. Sem cartão, sem pegadinha.
        </p>
      </header>

      <SignUpForm nextUrl={next} />

      <p className="text-muted-foreground text-center text-sm">
        Já tem conta?{' '}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
