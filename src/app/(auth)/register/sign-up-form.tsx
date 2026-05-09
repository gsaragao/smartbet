'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { signUpAction, type ActionResult } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { signUpSchema, type SignUpInput } from '@/lib/validators/auth';
import { cn } from '@/lib/utils';

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, label: 'Mínimo de 8 caracteres' },
  { test: (v: string) => /[A-Za-z]/.test(v), label: 'Contém uma letra' },
  { test: (v: string) => /\d/.test(v), label: 'Contém um número' },
] as const;

export function SignUpForm({ nextUrl }: { nextUrl?: string }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const passwordValue = useWatch({ control: form.control, name: 'password' });

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set('email', values.email);
      fd.set('password', values.password);
      fd.set('confirmPassword', values.confirmPassword);
      if (nextUrl) fd.set('next', nextUrl);

      const result: ActionResult = await signUpAction(null, fd);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof SignUpInput, {
              message: msgs?.[0] ?? 'Valor inválido',
            });
          }
        }
        if (result.message) toast.error(result.message);
        return;
      }

      if (result.message) toast.success(result.message);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="voce@email.com"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 transition-colors"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
              <PasswordChecklist value={passwordValue ?? ''} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar senha</FormLabel>
              <FormControl>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </Button>

        <p className="text-muted-foreground text-center text-xs leading-relaxed">
          Ao criar sua conta você concorda em apostar com responsabilidade. Aposte apenas o que pode
          perder.
        </p>
      </form>
    </Form>
  );
}

function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="mt-1 grid gap-1 text-xs">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.label}
            className={cn(
              'flex items-center gap-2 transition-colors',
              ok ? 'text-win' : 'text-muted-foreground',
            )}
          >
            {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
