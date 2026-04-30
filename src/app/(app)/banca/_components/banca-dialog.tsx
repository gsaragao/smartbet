'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { Switch } from '@/components/ui/switch';
import { atualizarBanca, criarBanca, type ActionResult } from '@/features/banca/actions';
import type { BancaListItem } from '@/features/banca/queries';
import { bancaSchema, MOEDAS, type BancaInput } from '@/features/banca/schema';
import { useUser } from '@/components/providers/user-context';

type BancaFormValues = BancaInput;

type CreateProps = {
  mode: 'create';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type EditProps = {
  mode: 'edit';
  banca: BancaListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Props = CreateProps | EditProps;

export function BancaDialog(props: Props) {
  const { canWrite } = useUser();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = props.open !== undefined;
  const open = isControlled ? (props.open as boolean) : internalOpen;
  const setOpen = isControlled ? (props.onOpenChange as (v: boolean) => void) : setInternalOpen;

  const isEdit = props.mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && !isEdit && canWrite && (
        <DialogTrigger
          render={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Nova banca
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar banca' : 'Nova banca'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Ajuste os dados da banca. Alterar o saldo inicial recalcula automaticamente o saldo atual.'
              : 'Crie uma banca para organizar o controle de saldo por conta ou casa de aposta.'}
          </DialogDescription>
        </DialogHeader>

        <BancaForm initial={isEdit ? props.banca : undefined} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function BancaForm({ initial, onDone }: { initial?: BancaListItem; onDone: () => void }) {
  const form = useForm<BancaFormValues>({
    resolver: zodResolver(bancaSchema),
    defaultValues: initial
      ? {
          nome: initial.nome,
          casa_de_aposta: initial.casa_de_aposta ?? '',
          moeda: initial.moeda as BancaFormValues['moeda'],
          saldo_inicial: Number(initial.saldo_inicial),
          e_principal: initial.e_principal,
        }
      : {
          nome: '',
          casa_de_aposta: '',
          moeda: 'BRL',
          saldo_inicial: 0,
          e_principal: false,
        },
  });

  const [isPending, startTransition] = React.useTransition();

  const onSubmit = (values: BancaFormValues) => {
    startTransition(async () => {
      const result: ActionResult = initial
        ? await atualizarBanca({ id: initial.id, ...values })
        : await criarBanca(values);

      if (result.ok) {
        toast.success(initial ? 'Banca atualizada.' : 'Banca criada.');
        form.reset();
        onDone();
        return;
      }

      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (key in values) {
            form.setError(key as keyof BancaFormValues, {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Conta principal Bet365" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="casa_de_aposta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Casa de aposta (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Bet365, Betano..." {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="moeda"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moeda</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="saldo_inicial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo inicial</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  placeholder="0,00"
                  value={Number.isFinite(field.value) ? field.value : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v === '' ? 0 : Number(v));
                  }}
                />
              </FormControl>
              <FormDescription>
                Registrado como evento &ldquo;Saldo inicial&rdquo; para histórico.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="e_principal"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">Banca principal</FormLabel>
                <FormDescription className="text-xs">
                  Apenas uma banca pode ser principal — ela vira o padrão em telas de operação.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {initial ? 'Salvar alterações' : 'Criar banca'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
