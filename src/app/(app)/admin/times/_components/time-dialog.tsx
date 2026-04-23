'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  atualizarTime,
  criarTime,
  type ActionResult,
} from '@/features/admin/times/actions';
import type {
  EsporteOpcao,
  PaisOpcao,
  TimeListItem,
} from '@/features/admin/times/queries';
import { timeSchema, type TimeInput } from '@/features/admin/times/schema';
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
import { slugify } from '@/lib/slug';

import { Bandeira } from '../../paises/_components/bandeira';
import { Escudo } from './escudo';

const PAIS_SEM_VINCULO_VALUE = '__sem_pais__';

type CreateProps = {
  mode: 'create';
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type EditProps = {
  mode: 'edit';
  time: TimeListItem;
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Props = CreateProps | EditProps;

export function TimeDialog(props: Props) {
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
              Novo time
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar time' : 'Novo time'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados do time. O slug é único por esporte.'
              : 'Cadastre um novo clube ou seleção. O escudo é opcional — se informado, uma URL pública é baixada direto do host.'}
          </DialogDescription>
        </DialogHeader>

        <TimeForm
          esportes={props.esportes}
          paises={props.paises}
          initial={isEdit ? props.time : undefined}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function TimeForm({
  esportes,
  paises,
  initial,
  onDone,
}: {
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
  initial?: TimeListItem;
  onDone: () => void;
}) {
  const defaultEsporteId = React.useMemo(() => {
    if (initial) return initial.esporte.id;
    const futebol = esportes.find((e) => e.slug === 'futebol');
    return futebol?.id ?? esportes[0]?.id ?? 0;
  }, [esportes, initial]);

  const form = useForm<TimeInput>({
    resolver: zodResolver(timeSchema),
    defaultValues: initial
      ? {
          nome: initial.nome,
          slug: initial.slug,
          esporte_id: initial.esporte.id,
          pais_id: initial.pais?.id ?? null,
          escudo_url: initial.escudo_url ?? '',
        }
      : {
          nome: '',
          slug: '',
          esporte_id: defaultEsporteId,
          pais_id: null,
          escudo_url: '',
        },
  });

  const [isPending, startTransition] = React.useTransition();
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial));

  const nome = useWatch({ control: form.control, name: 'nome' });
  const slug = useWatch({ control: form.control, name: 'slug' });
  const paisId = useWatch({ control: form.control, name: 'pais_id' });
  const escudoUrl = useWatch({ control: form.control, name: 'escudo_url' });

  React.useEffect(() => {
    if (initial) return;
    if (slugTouched) return;
    const next = slugify(nome ?? '');
    if (next !== slug) {
      form.setValue('slug', next, { shouldValidate: false });
    }
  }, [nome, slug, slugTouched, initial, form]);

  const paisSelecionado = React.useMemo(
    () => paises.find((p) => p.id === paisId) ?? null,
    [paises, paisId],
  );

  const onSubmit = (values: TimeInput) => {
    startTransition(async () => {
      const result: ActionResult = initial
        ? await atualizarTime({ id: initial.id, ...values })
        : await criarTime(values);

      if (result.ok) {
        toast.success(initial ? 'Time atualizado.' : 'Time criado.');
        form.reset();
        onDone();
        return;
      }

      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (key in values) {
            form.setError(key as keyof TimeInput, {
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
          name="esporte_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Esporte</FormLabel>
              <FormControl>
                <Select
                  value={String(field.value ?? '')}
                  onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                  items={esportes.map((e) => ({
                    value: String(e.id),
                    label: e.nome,
                  }))}
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

        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Flamengo" autoFocus={!initial} {...field} />
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
                <Input
                  placeholder="flamengo"
                  {...field}
                  onChange={(e) => {
                    setSlugTouched(true);
                    field.onChange(e);
                  }}
                  className="font-mono text-sm lowercase"
                />
              </FormControl>
              <FormDescription>
                Identificador único dentro do esporte. Gerado automaticamente a partir do
                nome enquanto você não editar manualmente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pais_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <FormControl>
                <Select
                  value={
                    field.value == null ? PAIS_SEM_VINCULO_VALUE : String(field.value)
                  }
                  onValueChange={(v) =>
                    field.onChange(v === PAIS_SEM_VINCULO_VALUE ? null : Number(v))
                  }
                  items={[
                    { value: PAIS_SEM_VINCULO_VALUE, label: 'Sem país' },
                    ...paises.map((p) => ({
                      value: String(p.id),
                      label: p.nome,
                    })),
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um país">
                      {(value: string) => {
                        if (value === PAIS_SEM_VINCULO_VALUE) return 'Sem país';
                        return (
                          paises.find((p) => String(p.id) === value)?.nome ??
                          'Selecione um país'
                        );
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PAIS_SEM_VINCULO_VALUE}>Sem país</SelectItem>
                    {paises.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Opcional. Útil para seleções regionais ou times amadores sem vínculo
                nacional.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="escudo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do escudo</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://.../escudo.png"
                  inputMode="url"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Opcional. Pode usar Wikipedia, logoa.ai, CDN do clube, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-muted/40 flex items-center gap-3 rounded-md border p-3">
          <Escudo url={(escudoUrl ?? '').trim() || null} alt="" size={36} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Pré-visualização
            </span>
            <span className="text-foreground truncate text-sm font-medium">
              {nome?.trim() || '—'}
            </span>
          </div>
          {paisSelecionado && (
            <div className="flex items-center gap-1.5">
              <Bandeira codigoIso={paisSelecionado.codigo_iso} className="text-xl" />
              <span className="text-muted-foreground text-xs">
                {paisSelecionado.codigo_iso}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {initial ? 'Salvar alterações' : 'Criar time'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
