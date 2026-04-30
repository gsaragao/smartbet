'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  Calculator,
  CircleDashed,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react';
import { type Resolver, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  atualizarAposta,
  criarAposta,
  type ActionResult,
} from '@/features/bets/actions';
import { useUser } from '@/components/providers/user-context';
import type { BetDetail, RegistroOptions } from '@/features/bets/queries';
import { avaliarApostaVsEstrategia } from '@/features/bets/rules-evaluator';
import {
  betInputSchema,
  calcularEdge,
  calcularOddTotalMultipla,
  calcularValorEsperado,
  defaultBetInput,
  type BetInput,
} from '@/features/bets/schema';
import { cn } from '@/lib/utils';

import { PartidaPicker } from './partida-picker';
import { SelectionList } from './selection-list';

type BetFormValues = BetInput;

type Props = {
  options: RegistroOptions;
  /** Aposta existente para modo edição. */
  aposta?: BetDetail;
  triggerClassName?: string;
  /** Modo "sem trigger" — controlado externamente (ex.: abrir do grid). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

const fieldControlClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-none transition-[color,box-shadow] md:text-sm';
const focusRingClass =
  'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25';

export function BetDialog({
  options,
  aposta,
  triggerClassName,
  open: openProp,
  onOpenChange,
  trigger,
}: Props) {
  const { canWrite } = useUser();
  const isControlled = typeof openProp === 'boolean';
  const [openInternal, setOpenInternal] = React.useState(false);
  const open = isControlled ? openProp : openInternal;
  const setOpen = (v: boolean) => {
    if (!isControlled) setOpenInternal(v);
    onOpenChange?.(v);
  };

  const isEdit = Boolean(aposta);

  const resolvedTrigger =
    trigger ??
    (isEdit ? (
      <Button variant="ghost" size="sm" className={cn('gap-1.5', triggerClassName)}>
        <Pencil className="size-4" />
        Editar
      </Button>
    ) : (
      <Button size="sm" className={cn('gap-1.5', triggerClassName)}>
        <Plus className="size-4" />
        Nova aposta
      </Button>
    ));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && canWrite && resolvedTrigger ? (
        <DialogTrigger render={resolvedTrigger as React.ReactElement} />
      ) : null}
      <DialogContent
        className={cn(
          'flex max-h-[min(92dvh,56rem)] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl',
          'sm:w-full',
        )}
      >
        <div className="border-border/60 shrink-0 space-y-2 border-b px-5 pb-4 pt-5 pr-12 sm:px-6 sm:pr-14">
          <DialogHeader className="gap-2 space-y-0">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {isEdit ? 'Editar aposta' : 'Nova aposta'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed text-pretty">
              {isEdit
                ? 'Ajuste os dados da aposta pendente. Depois de resolvida só é possível reabrir.'
                : 'Registre a aposta e valide contra sua estratégia antes de enviar para a casa.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <BetForm
          options={options}
          aposta={aposta}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

function BetForm({
  options,
  aposta,
  onDone,
}: {
  options: RegistroOptions;
  aposta?: BetDetail;
  onDone: () => void;
}) {
  const defaults = React.useMemo<BetFormValues>(() => {
    if (!aposta) {
      const principalBanca = options.bancas.find((b) => b.e_principal) ?? options.bancas[0];
      return defaultBetInput({
        banca_id: principalBanca?.id,
        esporte_id: options.esportes[0]?.id ?? 0,
      });
    }

    const s0 = aposta.selecoes[0];
    const partidaId = s0?.partida?.id;
    return {
      banca_id: aposta.banca?.id ?? '',
      estrategia_id: aposta.estrategia?.id ?? null,
      formato: (aposta.formato === 'multipla' ? 'multipla' : 'simples') as
        | 'simples'
        | 'multipla',
      stake: aposta.stake,
      eh_freebet: aposta.eh_freebet,
      casa_de_aposta: aposta.casa_de_aposta ?? '',
      descricao: aposta.descricao ?? '',
      observacao: aposta.observacao ?? '',
      selecao: {
        partida: partidaId
          ? { kind: 'existing' as const, partida_id: partidaId }
          : {
              kind: 'new' as const,
              esporte_id: options.esportes[0]?.id ?? 0,
              liga_id: null,
              time_mandante_id: null,
              time_visitante_id: null,
              mandante_nome: '',
              visitante_nome: '',
              inicio: '',
            },
        tipo_aposta_id: s0?.tipo_aposta?.id ?? 0,
        linha: s0?.linha ?? '',
        odd: s0?.odd ?? aposta.odd_total,
        descricao: s0?.descricao ?? '',
      },
      selecoes: aposta.selecoes.map((s) => ({
        partida: s.partida?.id
          ? { kind: 'existing' as const, partida_id: s.partida.id }
          : {
              kind: 'new' as const,
              esporte_id: options.esportes[0]?.id ?? 0,
              liga_id: null,
              time_mandante_id: null,
              time_visitante_id: null,
              mandante_nome: '',
              visitante_nome: '',
              inicio: '',
            },
        tipo_aposta_id: s.tipo_aposta?.id ?? 0,
        linha: s.linha ?? '',
        odd: s.odd,
        descricao: s.descricao,
      })),
      estrategia_override: aposta.estrategia_override,
      motivo_override: aposta.motivo_override ?? '',
      edge: aposta.edge,
      valor_esperado: aposta.valor_esperado,
    };
  }, [aposta, options.bancas, options.esportes]);

  const form = useForm<BetFormValues>({
    resolver: zodResolver(betInputSchema) as unknown as Resolver<BetFormValues>,
    defaultValues: defaults,
  });

  const estrategiaId = useWatch({ control: form.control, name: 'estrategia_id' });
  const formato = useWatch({ control: form.control, name: 'formato' });
  const selecao = useWatch({ control: form.control, name: 'selecao' });
  const selecoes = useWatch({ control: form.control, name: 'selecoes' });
  const override = useWatch({ control: form.control, name: 'estrategia_override' });
  const stake = useWatch({ control: form.control, name: 'stake' });
  const ehFreebet = useWatch({ control: form.control, name: 'eh_freebet' });
  const edge = useWatch({ control: form.control, name: 'edge' });
  const valorEsperado = useWatch({ control: form.control, name: 'valor_esperado' });

  const isMultipla = formato === 'multipla';
  const oddEfetiva = isMultipla
    ? calcularOddTotalMultipla(selecoes ?? [])
    : (selecao?.odd ?? 0);

  const estrategia = estrategiaId
    ? options.estrategias.find((e) => e.id === estrategiaId)
    : null;

  const esporteId =
    estrategia?.escopo.esporte_id ?? options.esportes[0]?.id ?? 0;

  const tiposDisponiveis = options.tipos_aposta.filter(
    (t) => t.esporte_id === esporteId,
  );

  const preview = React.useMemo(() => {
    if (!estrategia) return null;

    if (isMultipla) {
      const allViolacoes: string[] = [];
      (selecoes ?? []).forEach((s, i) => {
        const partida = s?.partida;
        const ligaId = partida && partida.kind === 'new' ? partida.liga_id : null;
        const res = avaliarApostaVsEstrategia({
          regras: estrategia.regras,
          escopo: estrategia.escopo,
          contexto: {
            odd: s?.odd,
            tipo_aposta_id: s?.tipo_aposta_id,
            liga: ligaId,
          },
        });
        if (!res.ok) {
          for (const v of res.violacoes) allViolacoes.push(`Seleção ${i + 1}: ${v}`);
        }
      });
      return { ok: allViolacoes.length === 0, violacoes: allViolacoes };
    }

    const partida = selecao?.partida;
    const ligaId = partida && partida.kind === 'new' ? partida.liga_id : null;
    return avaliarApostaVsEstrategia({
      regras: estrategia.regras,
      escopo: estrategia.escopo,
      contexto: {
        odd: selecao?.odd,
        tipo_aposta_id: selecao?.tipo_aposta_id,
        liga: ligaId,
      },
    });
  }, [estrategia, isMultipla, selecao, selecoes]);

  const [isPending, startTransition] = React.useTransition();
  const isEdit = Boolean(aposta);

  const onSubmit = (values: BetFormValues) => {
    startTransition(async () => {
      const result: ActionResult<{ id: string } | undefined> = isEdit
        ? await atualizarAposta({ ...values, id: aposta!.id })
        : await criarAposta(values);

      if (result.ok) {
        toast.success(isEdit ? 'Aposta atualizada.' : 'Aposta registrada.');
        form.reset(defaults);
        onDone();
        return;
      }

      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          form.setError(key as keyof BetFormValues, {
            type: 'server',
            message: messages[0],
          });
        }
      }
      if (result.violacoes && result.violacoes.length > 0) {
        toast.error(result.message, {
          description: result.violacoes.slice(0, 3).join(' · '),
        });
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
          {/* Toggle Simples/Múltipla */}
          <FormField
            control={form.control}
            name="formato"
            render={({ field }) => (
              <FormItem className="gap-2">
                <div className="inline-flex rounded-lg border border-border/60 bg-muted/40 p-1">
                  {(['simples', 'multipla'] as const).map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => {
                        field.onChange(op);
                        if (op === 'multipla' && (!selecoes || selecoes.length < 2)) {
                          const base = {
                            partida: {
                              kind: 'new' as const,
                              esporte_id: esporteId,
                              liga_id: null,
                              time_mandante_id: null,
                              time_visitante_id: null,
                              mandante_nome: '',
                              visitante_nome: '',
                              inicio: '',
                            },
                            tipo_aposta_id: 0,
                            linha: '',
                            odd: 1.5,
                            descricao: '',
                          };
                          form.setValue('selecoes', [base, { ...base }], {
                            shouldDirty: true,
                          });
                        }
                      }}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        field.value === op
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {op === 'simples' ? 'Simples' : 'Múltipla'}
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />

          {/* Seção 1: Banca + Estratégia */}
          <Secao icon={Wallet} title="Banca e estratégia">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="banca_id"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel>Banca</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={cn(fieldControlClass, focusRingClass)}
                      >
                        <option value="">Selecione…</option>
                        {options.bancas.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.nome} {b.e_principal ? '· principal' : ''}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estrategia_id"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel>
                      Estratégia{' '}
                      <span className="text-muted-foreground">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <select
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value || null)
                        }
                        className={cn(fieldControlClass, focusRingClass)}
                      >
                        <option value="">— sem estratégia —</option>
                        {options.estrategias.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.nome}
                            {e.status !== 'ativa' ? ` · ${e.status}` : ''}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Secao>

          {/* Seções 2/3: Simples → Jogo + Seleção; Múltipla → SelectionList */}
          {isMultipla ? (
            <Secao icon={CircleDashed} title="Seleções da múltipla">
              <SelectionList
                control={form.control}
                options={options}
                esporteId={esporteId}
                selecoes={selecoes}
                errors={form.formState.errors.selecoes}
              />
            </Secao>
          ) : null}

          {/* Seções 2 e 3: apenas simples */}
          {!isMultipla ? (
          <>
          <Secao icon={Target} title="Jogo">
            <FormField
              control={form.control}
              name="selecao.partida"
              render={({ field }) => {
                const partidaErrors = form.formState.errors.selecao?.partida as
                  | {
                      mandante_nome?: { message?: string };
                      visitante_nome?: { message?: string };
                      inicio?: { message?: string };
                    }
                  | undefined;
                return (
                  <FormItem className="gap-2">
                    <FormControl>
                      <PartidaPicker
                        value={
                          field.value ?? {
                            kind: 'new',
                            esporte_id: esporteId,
                            liga_id: null,
                            time_mandante_id: null,
                            time_visitante_id: null,
                            mandante_nome: '',
                            visitante_nome: '',
                            inicio: '',
                          }
                        }
                        onChange={field.onChange}
                        esporte_id={esporteId}
                        ligas={options.ligas}
                        errors={{
                          mandante_nome: partidaErrors?.mandante_nome?.message,
                          visitante_nome: partidaErrors?.visitante_nome?.message,
                          inicio: partidaErrors?.inicio?.message,
                        }}
                      />
                    </FormControl>
                  </FormItem>
                );
              }}
            />
          </Secao>

          {/* Seção 3: Seleção */}
          <Secao icon={CircleDashed} title="Seleção">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="selecao.tipo_aposta_id"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel>Tipo de aposta</FormLabel>
                    <FormControl>
                      <select
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                        className={cn(fieldControlClass, focusRingClass)}
                      >
                        <option value="">Selecione…</option>
                        {tiposDisponiveis.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="selecao.linha"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel>
                      Linha{' '}
                      <span className="text-muted-foreground">(ex: 2.5)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={cn(fieldControlClass, focusRingClass)}
                        placeholder="—"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="selecao.odd"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel>Odd</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={Number.isFinite(field.value) ? field.value : ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className={cn(
                          fieldControlClass,
                          focusRingClass,
                          'font-mono tabular-nums',
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="selecao.descricao"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel>Descrição da seleção</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex.: Over 2.5 gols"
                        className={cn(fieldControlClass, focusRingClass)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Secao>
          </>
          ) : null}

          {/* Seção 4: Stake */}
          <Secao icon={Wallet} title="Stake e casa">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="stake"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel>Stake</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={Number.isFinite(field.value) ? field.value : ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className={cn(
                          fieldControlClass,
                          focusRingClass,
                          'font-mono tabular-nums',
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="casa_de_aposta"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel>Casa de aposta</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Bet365, Betano…"
                        className={cn(fieldControlClass, focusRingClass)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eh_freebet"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel>Freebet?</FormLabel>
                    <FormControl>
                      <div className="flex h-10 items-center">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-muted-foreground ml-2 text-xs">
                          {field.value ? 'Sim, stake não conta para ROI' : 'Não'}
                        </span>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Secao>

          {/* Seção 5: Análise */}
          <Secao icon={Calculator} title="Análise (opcional)">
            <EdgeCalculator
              stake={stake}
              odd={oddEfetiva}
              edge={edge}
              valorEsperado={valorEsperado}
              onChange={(newEdge, newEv) => {
                form.setValue('edge', newEdge, { shouldDirty: true });
                form.setValue('valor_esperado', newEv, { shouldDirty: true });
              }}
            />
            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem className="gap-2">
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Notas livres sobre a entrada…"
                      className={cn(
                        'min-h-[4.5rem] resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm md:text-sm',
                        focusRingClass,
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Secao>

          {/* Preview/Banner da validação */}
          {preview && (
            <div
              className={cn(
                'rounded-lg border p-3 text-sm',
                preview.ok
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200',
              )}
            >
              <div className="flex items-center gap-2 font-medium">
                {preview.ok ? (
                  <Sparkles className="size-4" />
                ) : (
                  <AlertTriangle className="size-4" />
                )}
                {preview.ok
                  ? 'Tudo certo com as regras da estratégia.'
                  : `Fora do escopo: ${preview.violacoes.length} ${
                      preview.violacoes.length === 1 ? 'violação' : 'violações'
                    }.`}
              </div>
              {!preview.ok && (
                <ul className="mt-2 space-y-1 text-xs opacity-90">
                  {preview.violacoes.map((v, i) => (
                    <li key={i}>• {v}</li>
                  ))}
                </ul>
              )}
              {!preview.ok && (
                <div className="mt-3 border-t border-current/20 pt-3">
                  <FormField
                    control={form.control}
                    name="estrategia_override"
                    render={({ field }) => (
                      <FormItem className="gap-2">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(v) => field.onChange(Boolean(v))}
                          />
                          <div>
                            <FormLabel className="text-sm">
                              Registrar fora do escopo (override)
                            </FormLabel>
                            <p className="text-xs opacity-80">
                              Permite salvar mesmo fora das regras. Exige motivo.
                            </p>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                  {override && (
                    <FormField
                      control={form.control}
                      name="motivo_override"
                      render={({ field }) => (
                        <FormItem className="mt-2 gap-2">
                          <FormLabel className="text-sm">
                            Motivo do override
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              rows={2}
                              placeholder="Ex.: Teste controlado em jogo fora da estratégia."
                              className={cn(
                                'min-h-[3.5rem] resize-y rounded-lg border border-amber-500/40 bg-background px-3 py-2 text-sm text-foreground',
                                focusRingClass,
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 mt-auto shrink-0 gap-2 rounded-b-xl border-t border-border/60 bg-muted/40 px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
          <ResumoFooter
            stake={stake}
            odd={oddEfetiva}
            ehFreebet={ehFreebet}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onDone}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Salvar alterações' : 'Registrar aposta'}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

function Secao({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
        <Icon className="text-muted-foreground size-4" />
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function EdgeCalculator({
  stake,
  odd,
  edge,
  valorEsperado,
  onChange,
}: {
  stake: number;
  odd: number;
  edge: number | null;
  valorEsperado: number | null;
  onChange: (edge: number | null, ev: number | null) => void;
}) {
  const [oddJusta, setOddJusta] = React.useState<string>(
    edge != null && odd > 1.01
      ? (1 / (1 / odd + edge / 100)).toFixed(2)
      : '',
  );

  const computar = (val: string) => {
    setOddJusta(val);
    const n = Number(val);
    if (!Number.isFinite(n) || n < 1.01 || !Number.isFinite(odd) || odd < 1.01) {
      onChange(null, null);
      return;
    }
    const edgeDec = calcularEdge(odd, n);
    const ev = calcularValorEsperado(stake, odd, n);
    onChange(Number((edgeDec * 100).toFixed(2)), Number(ev.toFixed(2)));
  };

  return (
    <div className="border-border/60 bg-muted/40 grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-foreground text-xs font-medium">
          Odd justa estimada
        </label>
        <Input
          type="number"
          step="0.01"
          inputMode="decimal"
          value={oddJusta}
          onChange={(e) => computar(e.target.value)}
          placeholder="Ex: 1.70"
          className="h-9 font-mono text-[13px] tabular-nums"
        />
      </div>
      <Stat
        label="Edge"
        value={edge != null ? `${edge.toFixed(2)}%` : '—'}
        tone={edge != null && edge > 0 ? 'pos' : edge != null && edge < 0 ? 'neg' : 'neutral'}
      />
      <Stat
        label="EV por unidade"
        value={
          valorEsperado != null
            ? valorEsperado.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 2,
              })
            : '—'
        }
        tone={
          valorEsperado != null && valorEsperado > 0
            ? 'pos'
            : valorEsperado != null && valorEsperado < 0
              ? 'neg'
              : 'neutral'
        }
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'pos' | 'neg' | 'neutral';
}) {
  const toneClass =
    tone === 'pos'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'neg'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-foreground';
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn('font-mono text-sm font-semibold tabular-nums', toneClass)}>
        {value}
      </span>
    </div>
  );
}

function ResumoFooter({
  stake,
  odd,
  ehFreebet,
}: {
  stake: number;
  odd: number;
  ehFreebet: boolean;
}) {
  const retornoPotencial = Number.isFinite(stake * odd) ? stake * odd : 0;
  const lucroPotencial = ehFreebet ? stake * (odd - 1) : retornoPotencial - stake;

  return (
    <div className="hidden flex-col text-xs sm:flex">
      <span className="text-muted-foreground">Retorno potencial</span>
      <span className="font-mono text-sm font-semibold tabular-nums">
        {retornoPotencial.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}{' '}
        <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px]">
          lucro{' '}
          {lucroPotencial.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </Badge>
      </span>
    </div>
  );
}
