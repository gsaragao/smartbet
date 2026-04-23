'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  atualizarLiga,
  criarLiga,
  type ActionResult,
} from '@/features/admin/ligas/actions';
import type {
  EsporteOpcao,
  LigaListItem,
  PaisOpcao,
} from '@/features/admin/ligas/queries';
import { ligaSchema, type LigaInput } from '@/features/admin/ligas/schema';
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
import { slugify } from '@/lib/slug';

import { Bandeira } from '../../paises/_components/bandeira';

const PAIS_INTERNACIONAL_VALUE = '__internacional__';

type CreateProps = {
  mode: 'create';
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type EditProps = {
  mode: 'edit';
  liga: LigaListItem;
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Props = CreateProps | EditProps;

export function LigaDialog(props: Props) {
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
              Nova liga
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar liga' : 'Nova liga'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados da liga. O slug é único por esporte.'
              : 'Cadastre uma nova competição. Escolha “Internacional” quando a liga não tiver país de sede (UEFA, Conmebol, etc.).'}
          </DialogDescription>
        </DialogHeader>

        <LigaForm
          esportes={props.esportes}
          paises={props.paises}
          initial={isEdit ? props.liga : undefined}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function LigaForm({
  esportes,
  paises,
  initial,
  onDone,
}: {
  esportes: EsporteOpcao[];
  paises: PaisOpcao[];
  initial?: LigaListItem;
  onDone: () => void;
}) {
  const defaultEsporteId = React.useMemo(() => {
    if (initial) return initial.esporte.id;
    // Pré-seleciona futebol quando existir — cobre ~95% dos casos.
    const futebol = esportes.find((e) => e.slug === 'futebol');
    return futebol?.id ?? esportes[0]?.id ?? 0;
  }, [esportes, initial]);

  const form = useForm<LigaInput>({
    resolver: zodResolver(ligaSchema),
    defaultValues: initial
      ? {
          nome: initial.nome,
          slug: initial.slug,
          esporte_id: initial.esporte.id,
          pais_id: initial.pais?.id ?? null,
          temporada: initial.temporada ?? '',
          ativo: initial.ativo,
        }
      : {
          nome: '',
          slug: '',
          esporte_id: defaultEsporteId,
          pais_id: null,
          temporada: '',
          ativo: true,
        },
  });

  const [isPending, startTransition] = React.useTransition();
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial));

  const nome = useWatch({ control: form.control, name: 'nome' });
  const slug = useWatch({ control: form.control, name: 'slug' });
  const paisId = useWatch({ control: form.control, name: 'pais_id' });

  // Auto-slug enquanto o usuário digita o nome, até que ele edite o slug.
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

  const onSubmit = (values: LigaInput) => {
    startTransition(async () => {
      const result: ActionResult = initial
        ? await atualizarLiga({ id: initial.id, ...values })
        : await criarLiga(values);

      if (result.ok) {
        toast.success(initial ? 'Liga atualizada.' : 'Liga criada.');
        form.reset();
        onDone();
        return;
      }

      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (key in values) {
            form.setError(key as keyof LigaInput, {
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
                <Input placeholder="Ex.: Brasileirão Série A" autoFocus={!initial} {...field} />
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
                  placeholder="brasileirao-serie-a"
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

        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <FormField
            control={form.control}
            name="pais_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                  <Select
                    value={
                      field.value == null ? PAIS_INTERNACIONAL_VALUE : String(field.value)
                    }
                    onValueChange={(v) =>
                      field.onChange(v === PAIS_INTERNACIONAL_VALUE ? null : Number(v))
                    }
                    items={[
                      { value: PAIS_INTERNACIONAL_VALUE, label: 'Internacional' },
                      ...paises.map((p) => ({
                        value: String(p.id),
                        label: p.nome,
                      })),
                    ]}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um país">
                        {(value: string) => {
                          if (value === PAIS_INTERNACIONAL_VALUE) return 'Internacional';
                          return (
                            paises.find((p) => String(p.id) === value)?.nome ??
                            'Selecione um país'
                          );
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PAIS_INTERNACIONAL_VALUE}>
                        Internacional
                      </SelectItem>
                      {paises.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  Deixe como “Internacional” para UEFA, Conmebol, FIFA etc.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="temporada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temporada</FormLabel>
                <FormControl>
                  <Input
                    placeholder="2025-26"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription>Opcional.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-muted/40 flex items-center gap-3 rounded-md border p-3">
          {paisSelecionado ? (
            <Bandeira codigoIso={paisSelecionado.codigo_iso} className="text-3xl" />
          ) : (
            <span className="bg-background text-muted-foreground inline-flex h-7 w-10 items-center justify-center rounded-sm border text-[10px] font-semibold tracking-wider uppercase">
              INT
            </span>
          )}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Pré-visualização
            </span>
            <span className="text-foreground text-sm font-medium">
              {nome?.trim() || '—'}
            </span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
              <div className="space-y-0.5">
                <FormLabel>Liga ativa</FormLabel>
                <FormDescription>
                  Desative para ocultar a liga dos formulários de apostas sem excluí-la.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Ativar liga"
                />
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
            {initial ? 'Salvar alterações' : 'Criar liga'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
