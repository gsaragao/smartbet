'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  atualizarTipoAposta,
  criarTipoAposta,
  type ActionResult,
} from '@/features/admin/tipos-aposta/actions';
import type {
  EsporteOption,
  TipoApostaListItem,
} from '@/features/admin/tipos-aposta/queries';
import { tipoApostaSchema, type TipoApostaInput } from '@/features/admin/tipos-aposta/schema';

type TipoApostaFormValues = TipoApostaInput;
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

// ---------------------------------------------------------------------------
// Public surface: `TipoApostaDialog`
//
// Two supported uses:
//  1. Uncontrolled "create" (page action). Renders its own trigger button.
//  2. Controlled (edit flow). Caller passes `open`/`onOpenChange` and no
//     trigger — the dialog only mounts its content.
// ---------------------------------------------------------------------------

type BaseProps = {
  esportes: EsporteOption[];
};

type CreateProps = BaseProps & {
  mode: 'create';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type EditProps = BaseProps & {
  mode: 'edit';
  tipo: TipoApostaListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Props = CreateProps | EditProps;

export function TipoApostaDialog(props: Props) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = props.open !== undefined;
  const open = isControlled ? (props.open as boolean) : internalOpen;
  const setOpen = isControlled ? (props.onOpenChange as (v: boolean) => void) : setInternalOpen;

  const isEdit = props.mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && !isEdit && (
        <DialogTrigger
          render={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Novo tipo
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar tipo de aposta' : 'Novo tipo de aposta'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados do mercado. As alterações afetam imediatamente estratégias e apostas que o utilizam.'
              : 'Cadastre um novo mercado. Utilize categorias consistentes (ex.: "Resultado", "Gols", "Handicap").'}
          </DialogDescription>
        </DialogHeader>

        <TipoApostaForm
          esportes={props.esportes}
          initial={isEdit ? props.tipo : undefined}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Internal form component (RHF + Zod + Server Actions).
// ---------------------------------------------------------------------------

function TipoApostaForm({
  esportes,
  initial,
  onDone,
}: {
  esportes: EsporteOption[];
  initial?: TipoApostaListItem;
  onDone: () => void;
}) {
  const form = useForm<TipoApostaFormValues>({
    resolver: zodResolver(tipoApostaSchema),
    defaultValues: initial
      ? {
          esporte_id: initial.esporte_id,
          categoria: initial.categoria,
          nome: initial.nome,
          slug: initial.slug,
          descricao: initial.descricao ?? '',
          ativo: initial.ativo,
        }
      : {
          // Prefer the sport that already has bet types (seed currently
          // covers "Futebol" only); falls back to the first active sport.
          esporte_id:
            esportes.find((e) => e.slug === 'futebol')?.id ?? esportes[0]?.id ?? 0,
          categoria: '',
          nome: '',
          slug: '',
          descricao: '',
          ativo: true,
        },
  });

  const [isPending, startTransition] = React.useTransition();

  const onSubmit = (values: TipoApostaFormValues) => {
    startTransition(async () => {
      const result: ActionResult = initial
        ? await atualizarTipoAposta({ id: initial.id, ...values })
        : await criarTipoAposta(values);

      if (result.ok) {
        toast.success(initial ? 'Tipo atualizado.' : 'Tipo criado.');
        form.reset();
        onDone();
        return;
      }

      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (key in values) {
            form.setError(key as keyof TipoApostaFormValues, {
              type: 'server',
              message: messages[0],
            });
          }
        }
      }
      toast.error(result.message);
    });
  };

  // When creating, auto-derive `slug` from `nome` until the user touches
  // `slug` manually. This keeps the form friendly without forcing the user
  // to type the same thing twice.
  const slugTouched = form.formState.dirtyFields.slug;
  const nome = useWatch({ control: form.control, name: 'nome' });
  React.useEffect(() => {
    if (initial) return; // never rewrite slug while editing
    if (slugTouched) return;
    form.setValue('slug', slugify(nome ?? ''), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nome, slugTouched, initial]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="esporte_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Esporte</FormLabel>
              <FormControl>
                <Select
                  value={String(field.value ?? '')}
                  onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                  items={esportes.map((e) => ({ value: String(e.id), label: e.nome }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um esporte">
                      {(value: string) =>
                        esportes.find((e) => String(e.id) === value)?.nome ??
                        'Selecione um esporte'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {esportes.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <Input placeholder="Resultado, Gols, Handicap..." {...field} />
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
                  <Input placeholder="Ex: Ambas marcam" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="ambas-marcam" {...field} />
              </FormControl>
              <FormDescription>
                Identificador único dentro do esporte. Use letras minúsculas, números e hífens.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Explica brevemente esse mercado"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
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
                  Quando desativado, o tipo não aparece para seleção em novas apostas.
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
            {initial ? 'Salvar alterações' : 'Criar tipo'}
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
    .slice(0, 48);
}
