'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { adminAtualizarPerfil, type ActionResult } from '@/features/admin/usuarios/actions';
import type { PerfilAdminListItem } from '@/features/admin/usuarios/queries';
import {
  adminUsuarioFormSchema,
  type AdminUsuarioFormValues,
  type AdminUsuarioPatchInput,
} from '@/features/admin/usuarios/schema';
import { MOEDAS } from '@/features/banca/schema';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isValidTimeZoneId } from '@/lib/timezones';

import { AdminSetPasswordForm } from './admin-set-password-form';
import { TimezoneCombobox } from './timezone-combobox';

const PAPEL_OPTIONS: { value: AdminUsuarioFormValues['papel']; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'executor', label: 'Executor' },
  { value: 'consulta', label: 'Consulta (somente leitura)' },
  { value: 'usuario', label: 'Usuário (legado)' },
];

function moedaParaForm(iso: string): AdminUsuarioFormValues['moeda'] {
  return (MOEDAS as readonly string[]).includes(iso)
    ? (iso as AdminUsuarioFormValues['moeda'])
    : 'BRL';
}

type Props = {
  usuario: PerfilAdminListItem;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UsuarioEditDialog({ usuario, currentUserId, open, onOpenChange }: Props) {
  const router = useRouter();
  const isSelf = usuario.id === currentUserId;

  const moedaLegacy = !(MOEDAS as readonly string[]).includes(usuario.moeda);
  const fusoInvalido = !isValidTimeZoneId(usuario.fuso_horario);

  const form = useForm<AdminUsuarioFormValues>({
    resolver: zodResolver(adminUsuarioFormSchema),
    defaultValues: {
      usuarioId: usuario.id,
      papel: usuario.papel as AdminUsuarioFormValues['papel'],
      nomeCompleto: usuario.nome_completo ?? '',
      moeda: moedaParaForm(usuario.moeda),
      fusoHorario: usuario.fuso_horario,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        usuarioId: usuario.id,
        papel: usuario.papel as AdminUsuarioFormValues['papel'],
        nomeCompleto: usuario.nome_completo ?? '',
        moeda: moedaParaForm(usuario.moeda),
        fusoHorario: usuario.fuso_horario,
      });
    }
  }, [open, usuario, form]);

  async function onSubmit(values: AdminUsuarioFormValues) {
    const payload: AdminUsuarioPatchInput = {
      usuarioId: values.usuarioId,
      papel: values.papel,
      nomeCompleto: values.nomeCompleto?.trim() ? values.nomeCompleto.trim() : null,
      moeda: values.moeda,
      fusoHorario: values.fusoHorario,
    };

    const result: ActionResult = await adminAtualizarPerfil(payload);
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [k, msgs] of Object.entries(result.fieldErrors)) {
          const key = k as keyof AdminUsuarioFormValues;
          if (key in form.getValues()) {
            form.setError(key, { message: msgs?.[0] ?? '' });
          }
        }
      }
      toast.error(result.message);
      return;
    }
    toast.success('Usuário atualizado.');
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/80 bg-background/95 sm:max-w-md">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary ring-primary/15 flex size-10 items-center justify-center rounded-xl ring-1">
              <Pencil className="size-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="font-heading text-lg">Editar usuário</DialogTitle>
              <DialogDescription className="truncate font-mono text-xs">
                {usuario.email}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 pt-1">
            <FormField
              control={form.control}
              name="papel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Papel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAPEL_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isSelf ? (
                    <FormDescription>
                      Se rebaixar seu papel, certifique-se de que outro administrador existe.
                    </FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nomeCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-border/70 space-y-3 border-t pt-4">
              <div>
                <p className="text-foreground text-sm font-medium">Preferências da conta</p>
                <FormDescription className="pt-0.5 text-xs leading-relaxed">
                  Moeda e fuso definem como a conta enxerga valores regionais (padrão ao criar
                  recursos). As apostas e o saldo continuam na moeda de cada banca.
                </FormDescription>
              </div>

              {moedaLegacy ? (
                <p className="text-[11px] leading-snug text-amber-700 dark:text-amber-400/90">
                  A moeda guardada ({usuario.moeda}) não está no conjunto MVP (BRL, USD, EUR).
                  Selecione uma opção suportada para gravar.
                </p>
              ) : null}
              {fusoInvalido ? (
                <p className="text-[11px] leading-snug text-amber-700 dark:text-amber-400/90">
                  O fuso atual não é um identificador IANA válido. Escolha um item da lista para
                  corrigir.
                </p>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="moeda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moeda preferida</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={form.formState.isSubmitting}
                          items={MOEDAS.map((m) => ({ value: m, label: m }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MOEDAS.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        ISO 4217 — mesmo conjunto das bancas no MVP.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fusoHorario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuso horário</FormLabel>
                      <FormControl>
                        <TimezoneCombobox
                          id={`tz-${usuario.id}`}
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={form.formState.isSubmitting}
                          invalid={!!form.formState.errors.fusoHorario}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Lista IANA — use a busca para achar sua região.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="shadow-brand-sm gap-2"
              >
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>

        <div className="border-border/70 space-y-3 border-t pt-4">
          <div>
            <p className="text-foreground text-sm font-medium">Redefinir senha</p>
          </div>
          <AdminSetPasswordForm usuarioId={usuario.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
