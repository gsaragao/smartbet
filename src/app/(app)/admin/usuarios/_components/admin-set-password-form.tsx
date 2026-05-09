'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { adminDefinirSenhaUsuario, type ActionResult } from '@/features/admin/usuarios/actions';
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
import { adminSetPasswordSchema, type AdminSetPasswordInput } from '@/lib/validators/auth';

type Props = {
  usuarioId: string;
};

export function AdminSetPasswordForm({ usuarioId }: Props) {
  const form = useForm<AdminSetPasswordInput>({
    resolver: zodResolver(adminSetPasswordSchema),
    defaultValues: {
      usuarioId,
      novaSenha: '',
      confirmarSenha: '',
    },
  });

  React.useEffect(() => {
    form.reset({
      usuarioId,
      novaSenha: '',
      confirmarSenha: '',
    });
  }, [usuarioId, form]);

  async function onSubmit(values: AdminSetPasswordInput) {
    const result: ActionResult = await adminDefinirSenhaUsuario(values);
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [k, msgs] of Object.entries(result.fieldErrors)) {
          const key = k as keyof AdminSetPasswordInput;
          if (key in form.getValues()) {
            form.setError(key, { message: msgs?.[0] ?? '' });
          }
        }
      }
      toast.error(result.message);
      return;
    }
    toast.success('Nova senha definida para este utilizador.');
    form.reset({ usuarioId, novaSenha: '', confirmarSenha: '' });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
        <Button
          type="submit"
          variant="secondary"
          disabled={form.formState.isSubmitting}
          className="gap-2"
        >
          {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Definir nova senha
        </Button>
      </form>
    </Form>
  );
}
