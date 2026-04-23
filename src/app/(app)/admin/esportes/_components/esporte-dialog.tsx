'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  atualizarEsporte,
  criarEsporte,
  type ActionResult,
} from '@/features/admin/esportes/actions';
import type { EsporteListItem } from '@/features/admin/esportes/queries';
import { esporteSchema, type EsporteInput } from '@/features/admin/esportes/schema';
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
import { Switch } from '@/components/ui/switch';

type BaseProps = {
  /** Renderiza apenas o trigger default do "novo". */
  renderTrigger?: boolean;
};

type CreateProps = BaseProps & {
  mode: 'create';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type EditProps = BaseProps & {
  mode: 'edit';
  esporte: EsporteListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Props = CreateProps | EditProps;

/**
 * Dialog único para criar e editar esportes. Funciona tanto no modo
 * "standalone" (gera seu próprio botão de trigger) quanto no modo
 * controlado (usado pelo menu de ações de cada card).
 */
export function EsporteDialog(props: Props) {
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
              Novo esporte
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar esporte' : 'Novo esporte'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados desta modalidade. Alterações no slug podem afetar URLs existentes.'
              : 'Cadastre uma nova modalidade esportiva. O slug é usado em URLs e integrações.'}
          </DialogDescription>
        </DialogHeader>

        <EsporteForm
          initial={isEdit ? props.esporte : undefined}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function EsporteForm({
  initial,
  onDone,
}: {
  initial?: EsporteListItem;
  onDone: () => void;
}) {
  const form = useForm<EsporteInput>({
    resolver: zodResolver(esporteSchema),
    defaultValues: initial
      ? {
          nome: initial.nome,
          slug: initial.slug,
          ativo: initial.ativo,
        }
      : {
          nome: '',
          slug: '',
          ativo: true,
        },
  });

  const [isPending, startTransition] = React.useTransition();

  const onSubmit = (values: EsporteInput) => {
    startTransition(async () => {
      const result: ActionResult = initial
        ? await atualizarEsporte({ id: initial.id, ...values })
        : await criarEsporte(values);

      if (result.ok) {
        toast.success(initial ? 'Esporte atualizado.' : 'Esporte criado.');
        form.reset();
        onDone();
        return;
      }

      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (key in values) {
            form.setError(key as keyof EsporteInput, {
              type: 'server',
              message: messages[0],
            });
          }
        }
      }
      toast.error(result.message);
    });
  };

  // Auto-deriva o slug a partir do nome enquanto o usuário não o tocar.
  const slugTouched = form.formState.dirtyFields.slug;
  const nome = useWatch({ control: form.control, name: 'nome' });
  React.useEffect(() => {
    if (initial) return;
    if (slugTouched) return;
    form.setValue('slug', slugify(nome ?? ''), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nome, slugTouched, initial]);

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
                <Input placeholder="Ex.: Futebol" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="futebol" {...field} />
              </FormControl>
              <FormDescription>
                Identificador único e URL-safe. Use apenas letras minúsculas, números e hífens.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">Ativo</FormLabel>
                <FormDescription className="text-xs">
                  Quando desativado, o esporte não aparece em seleções de novas apostas e
                  estratégias.
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
            {initial ? 'Salvar alterações' : 'Criar esporte'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}
