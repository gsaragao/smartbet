'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  atualizarPais,
  criarPais,
  type ActionResult,
} from '@/features/admin/paises/actions';
import type { PaisListItem } from '@/features/admin/paises/queries';
import { paisSchema, type PaisInput } from '@/features/admin/paises/schema';
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

import { Bandeira } from './bandeira';

type CreateProps = {
  mode: 'create';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type EditProps = {
  mode: 'edit';
  pais: PaisListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Props = CreateProps | EditProps;

/**
 * Dialog compartilhado para criar ou editar países. O padrão segue
 * o mesmo esquema utilizado em Esportes e Tipos de aposta: standalone
 * (trigger próprio) ou controlado pelo caller.
 */
export function PaisDialog(props: Props) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = props.open !== undefined;
  const open = isControlled ? (props.open as boolean) : internalOpen;
  const setOpen = isControlled
    ? (props.onOpenChange as (v: boolean) => void)
    : setInternalOpen;

  const isEdit = props.mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && !isEdit && (
        <DialogTrigger
          render={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Novo país
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar país' : 'Novo país'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados do país. Alterar o código ISO pode impactar integrações externas.'
              : 'Cadastre um novo país usando o código ISO-3166 alpha-2 (ex.: BR, US, ES).'}
          </DialogDescription>
        </DialogHeader>

        <PaisForm initial={isEdit ? props.pais : undefined} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function PaisForm({
  initial,
  onDone,
}: {
  initial?: PaisListItem;
  onDone: () => void;
}) {
  const form = useForm<PaisInput>({
    resolver: zodResolver(paisSchema),
    defaultValues: initial
      ? { codigo_iso: initial.codigo_iso, nome: initial.nome }
      : { codigo_iso: '', nome: '' },
  });

  const [isPending, startTransition] = React.useTransition();

  const onSubmit = (values: PaisInput) => {
    startTransition(async () => {
      const result: ActionResult = initial
        ? await atualizarPais({ id: initial.id, ...values })
        : await criarPais(values);

      if (result.ok) {
        toast.success(initial ? 'País atualizado.' : 'País criado.');
        form.reset();
        onDone();
        return;
      }

      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (key in values) {
            form.setError(key as keyof PaisInput, {
              type: 'server',
              message: messages[0],
            });
          }
        }
      }
      toast.error(result.message);
    });
  };

  // Preview ao vivo da bandeira/nome enquanto o usuário digita.
  const codigoIsoInput = useWatch({ control: form.control, name: 'codigo_iso' });
  const nomeInput = useWatch({ control: form.control, name: 'nome' });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <FormField
            control={form.control}
            name="codigo_iso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código ISO</FormLabel>
                <FormControl>
                  <Input
                    placeholder="BR"
                    maxLength={2}
                    autoCapitalize="characters"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    className="font-mono tracking-widest uppercase"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Brasil" autoFocus={!initial} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-muted/40 flex items-center gap-3 rounded-md border p-3">
          <Bandeira codigoIso={codigoIsoInput ?? ''} className="text-3xl" />
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Pré-visualização
            </span>
            <span className="text-foreground text-sm font-medium">
              {nomeInput?.trim() || '—'}
            </span>
          </div>
        </div>

        <FormDescription className="text-muted-foreground -mt-2 text-xs">
          O código deve seguir o padrão ISO-3166 alpha-2 e ter exatamente duas letras.
        </FormDescription>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {initial ? 'Salvar alterações' : 'Criar país'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
