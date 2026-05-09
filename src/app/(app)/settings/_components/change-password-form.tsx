'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { alterarMinhaSenha, type SettingsActionResult } from '@/features/settings/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { changePasswordSelfSchema, type ChangePasswordSelfInput } from '@/lib/validators/auth';

type Props = {
  userEmail: string;
};

export function ChangePasswordForm({ userEmail }: Props) {
  const form = useForm<ChangePasswordSelfInput>({
    resolver: zodResolver(changePasswordSelfSchema),
    defaultValues: {
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
    },
  });

  async function onSubmit(values: ChangePasswordSelfInput) {
    const result: SettingsActionResult = await alterarMinhaSenha(values);
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [k, msgs] of Object.entries(result.fieldErrors)) {
          const key = k as keyof ChangePasswordSelfInput;
          if (key in form.getValues()) {
            form.setError(key, { message: msgs?.[0] ?? '' });
          }
        }
      }
      toast.error(result.message);
      return;
    }
    toast.success('Senha atualizada.');
    form.reset({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
  }

  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary ring-primary/15 flex size-10 items-center justify-center rounded-xl ring-1">
            <KeyRound className="size-4" />
          </span>
          <div>
            <CardTitle className="font-heading text-base">Senha de acesso</CardTitle>
            <CardDescription className="font-mono text-xs">{userEmail}</CardDescription>
          </div>
        </div>
        <CardDescription className="!mt-3 text-sm leading-relaxed">
          Por segurança, confirme a senha atual. Apenas você pode alterar a sua própria senha aqui.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-4">
            <FormField
              control={form.control}
              name="senhaAtual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha atual</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="current-password"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="novaSenha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Mínimo 8 caracteres.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmarSenha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-fit gap-2">
              {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Atualizar senha
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
