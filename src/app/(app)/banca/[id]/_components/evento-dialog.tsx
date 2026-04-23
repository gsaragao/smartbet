'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Loader2, Plus } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
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
import { Textarea } from '@/components/ui/textarea';
import { criarEventoBanca, type ActionResult } from '@/features/banca/actions';
import {
  eventoBancaSchema,
  TIPOS_EVENTO_UI,
  type EventoBancaInput,
  type TipoEventoUI,
} from '@/features/banca/schema';
import { toDatetimeLocalInput } from '@/lib/format';
import { cn } from '@/lib/utils';

type EventoFormValues = EventoBancaInput;

const TIPO_LABEL: Record<TipoEventoUI, string> = {
  deposito: 'Depósito',
  saque: 'Saque',
  ajuste: 'Ajuste',
};

const TIPO_DESCRIPTION: Record<TipoEventoUI, string> = {
  deposito: 'Entrada de valor na banca.',
  saque: 'Retirada de valor. Informe o valor positivo — será subtraído automaticamente.',
  ajuste:
    'Correção manual do saldo. Pode ser positivo ou negativo (use o sinal explícito).',
};

/** Altura e foco alinhados ao `Input` do design system (evita select “pesado”). */
const fieldControlClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-none transition-[color,box-shadow] md:text-sm';

const focusRingClass =
  'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25';

type Props = {
  bancaId: string;
  /** Ex.: `w-full sm:w-auto` para o CTA ocupar a linha no mobile. */
  triggerClassName?: string;
};

export function EventoDialog({ bancaId, triggerClassName }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className={cn('gap-1.5', triggerClassName)}>
            <Plus className="size-4" />
            Novo evento
          </Button>
        }
      />
      <DialogContent
        className={cn(
          'flex max-h-[min(90dvh,44rem)] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md',
          'sm:w-full',
        )}
      >
        <div className="border-border/60 shrink-0 space-y-2 border-b px-5 pb-4 pt-5 pr-12 sm:px-6 sm:pr-14">
          <DialogHeader className="gap-2 space-y-0">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Novo evento
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed text-pretty">
              Registre um depósito, saque ou ajuste. O saldo da banca é recalculado
              automaticamente.
            </DialogDescription>
          </DialogHeader>
        </div>

        <EventoForm bancaId={bancaId} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EventoForm({
  bancaId,
  onDone,
}: {
  bancaId: string;
  onDone: () => void;
}) {
  const form = useForm<EventoFormValues>({
    resolver: zodResolver(eventoBancaSchema),
    defaultValues: {
      banca_id: bancaId,
      tipo: 'deposito',
      valor: 0,
      observacao: '',
      ocorrido_em: toDatetimeLocalInput(new Date()),
    },
  });

  const tipoAtual = (useWatch({ control: form.control, name: 'tipo' }) ??
    'deposito') as TipoEventoUI;

  const [isPending, startTransition] = React.useTransition();

  const onSubmit = (values: EventoFormValues) => {
    startTransition(async () => {
      const result: ActionResult = await criarEventoBanca(values);
      if (result.ok) {
        toast.success('Evento registrado.');
        form.reset({
          banca_id: bancaId,
          tipo: 'deposito',
          valor: 0,
          observacao: '',
          ocorrido_em: toDatetimeLocalInput(new Date()),
        });
        onDone();
        return;
      }

      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (key in values) {
            form.setError(key as keyof EventoFormValues, {
              type: 'server',
              message: messages[0],
            });
          }
        }
      }
      toast.error(result.message);
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {/* Linha 1: só label + controle em cada coluna — mesma altura visual */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:items-start sm:gap-6">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem className="gap-2">
                  <FormLabel className="text-foreground">Tipo</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={TIPOS_EVENTO_UI.map((t) => ({
                        value: t,
                        label: TIPO_LABEL[t],
                      }))}
                    >
                      <SelectTrigger
                        className={cn(
                          fieldControlClass,
                          focusRingClass,
                          'justify-between gap-2 py-0 pr-2 pl-3 font-normal',
                        )}
                      >
                        <SelectValue>
                          {(value: string) =>
                            TIPO_LABEL[value as TipoEventoUI] ?? 'Selecione'
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_EVENTO_UI.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TIPO_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem className="gap-2">
                  <FormLabel className="text-foreground">Valor</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0,00"
                      className={cn(fieldControlClass, focusRingClass, 'font-mono tabular-nums')}
                      value={Number.isFinite(field.value) ? field.value : ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(v === '' ? 0 : Number(v));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Ajuda do tipo em bloco único: não empurra só a coluna da esquerda */}
          <div
            className="border-border/60 bg-muted/40 flex gap-2.5 rounded-lg border px-3 py-2.5 sm:px-3.5 sm:py-3"
            key={tipoAtual}
          >
            <Info
              className="text-muted-foreground mt-0.5 size-4 shrink-0"
              aria-hidden
            />
            <p className="text-muted-foreground text-xs leading-relaxed sm:text-[13px]">
              <span className="text-foreground font-medium">{TIPO_LABEL[tipoAtual]} · </span>
              {TIPO_DESCRIPTION[tipoAtual]}
            </p>
          </div>

          <FormField
            control={form.control}
            name="ocorrido_em"
            render={({ field }) => (
              <FormItem className="gap-2">
                <FormLabel className="text-foreground">Data e hora</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    className={cn(
                      fieldControlClass,
                      focusRingClass,
                      'font-mono text-[13px] tabular-nums sm:text-sm',
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="observacao"
            render={({ field }) => (
              <FormItem className="gap-2">
                <FormLabel className="text-foreground">Observação (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Motivo, referência externa…"
                    className={cn(
                      'min-h-[5.5rem] resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm transition-[color,box-shadow] md:text-sm',
                      focusRingClass,
                    )}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="mx-0 mb-0 mt-auto shrink-0 gap-2 rounded-b-xl border-t border-border/60 bg-muted/40 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onDone}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full gap-2 sm:w-auto"
          >
            {isPending ? (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            ) : null}
            Registrar evento
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
