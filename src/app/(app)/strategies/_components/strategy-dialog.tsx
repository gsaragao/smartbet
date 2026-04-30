'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
} from 'lucide-react';
import * as React from 'react';
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
import { Form } from '@/components/ui/form';
import {
  atualizarEstrategia,
  criarEstrategia,
  type ActionResult,
} from '@/features/strategies/actions';
import { useUser } from '@/components/providers/user-context';
import type { StrategyDetail, WizardOptions } from '@/features/strategies/queries';
import {
  defaultStrategyInput,
  strategyInputSchema,
  type StrategyInput,
} from '@/features/strategies/schema';
import { cn } from '@/lib/utils';

import { StepEscopo } from './wizard/step-escopo';
import { StepGestao } from './wizard/step-gestao';
import { StepIdentidade } from './wizard/step-identidade';
import { StepRegras } from './wizard/step-regras';

type CreateProps = {
  mode: 'create';
  options: WizardOptions;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialInput?: StrategyInput;
  showTrigger?: boolean;
  triggerClassName?: string;
};

type EditProps = {
  mode: 'edit';
  options: WizardOptions;
  estrategia: StrategyDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Props = CreateProps | EditProps;

const STEPS = [
  { id: 'identidade', label: 'Identidade' },
  { id: 'escopo', label: 'Escopo' },
  { id: 'gestao', label: 'Gestão' },
  { id: 'regras', label: 'Regras' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

const STEP_FIELDS: Record<StepId, (keyof StrategyInput)[]> = {
  identidade: ['identidade'],
  escopo: ['escopo'],
  gestao: ['gestao'],
  regras: ['regras', 'guardrails'],
};

export function StrategyDialog(props: Props) {
  const { canWrite } = useUser();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = props.open !== undefined;
  const open = isControlled ? (props.open as boolean) : internalOpen;
  const setOpen = isControlled
    ? (props.onOpenChange as (v: boolean) => void)
    : setInternalOpen;

  const showTrigger = props.mode === 'create' && props.showTrigger !== false;
  const triggerClassName =
    props.mode === 'create' ? props.triggerClassName : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && !isControlled && canWrite && (
        <DialogTrigger
          render={
            <Button
              size="sm"
              className={cn('gap-1.5', triggerClassName)}
            >
              <Plus className="size-4" />
              Nova estratégia
            </Button>
          }
        />
      )}

      <DialogContent
        className={cn(
          /* Popovers aninhados (MultiSelect) usam Portal no `body` + z-index
             no Positioner, então aqui podemos manter overflow-hidden sem
             cortar a UI. */
          'flex max-h-[min(92dvh,44rem)] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0',
          'sm:max-h-[min(90dvh,720px)] sm:max-w-2xl lg:max-w-3xl',
        )}
      >
        <WizardContent
          {...props}
          onClose={() => setOpen(false)}
          key={open ? 'open' : 'closed'}
        />
      </DialogContent>
    </Dialog>
  );
}

function WizardContent(
  props: Props & { onClose: () => void },
) {
  const { options, onClose } = props;
  const isEdit = props.mode === 'edit';

  const defaults = React.useMemo<StrategyInput>(() => {
    if (isEdit) {
      const e = (props as EditProps).estrategia;
      return {
        identidade: {
          nome: e.nome,
          descricao: e.descricao ?? '',
          cor: e.cor ?? '#6366f1',
          tags: e.tags ?? [],
          status: e.status,
        },
        escopo: e.escopo,
        gestao: e.gestao,
        regras: e.regras,
        guardrails: e.guardrails,
      };
    }
    if (props.mode === 'create' && props.initialInput) {
      return props.initialInput;
    }
    const base = defaultStrategyInput();
    const futebol = options.esportes.find((e) => e.slug === 'futebol');
    if (futebol) base.escopo.esporte_id = futebol.id;
    return base;
  }, [isEdit, options.esportes, props]);

  const form = useForm<StrategyInput>({
    resolver: zodResolver(strategyInputSchema) as unknown as Resolver<StrategyInput>,
    defaultValues: defaults,
    mode: 'onTouched',
  });

  const [stepIndex, setStepIndex] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();

  const currentStep = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const isFirst = stepIndex === 0;

  async function goNext() {
    const fields = STEP_FIELDS[currentStep.id];
    const valid = await form.trigger(fields as never);
    if (!valid) return;
    if (isLast) {
      await handleSubmit();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function goBack() {
    if (isFirst) return;
    setStepIndex((i) => i - 1);
  }

  async function handleSubmit() {
    const values = form.getValues();
    startTransition(async () => {
      const payload = isEdit
        ? { id: (props as EditProps).estrategia.id, ...values }
        : values;

      const result: ActionResult | ActionResult<{ id: string }> = isEdit
        ? await atualizarEstrategia(payload)
        : await criarEstrategia(payload);

      if (result.ok) {
        toast.success(isEdit ? 'Estratégia atualizada.' : 'Estratégia criada.');
        form.reset();
        onClose();
        return;
      }

      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          form.setError(key as never, {
            type: 'server',
            message: messages[0],
          });
        }
      }
      toast.error(result.message);
    });
  }

  const esporteIdAtual = useWatch({
    control: form.control,
    name: 'escopo.esporte_id',
  });
  const ligasParaRegras = React.useMemo(
    () =>
      options.ligas
        .filter((l) => l.esporte_id === esporteIdAtual)
        .map((l) => ({ id: l.id, nome: l.nome })),
    [esporteIdAtual, options.ligas],
  );

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goNext();
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="border-border/60 shrink-0 space-y-2 border-b px-5 pb-4 pt-5 pr-12 sm:px-6 sm:pr-14">
          <DialogHeader className="gap-2 space-y-0 text-left">
            <DialogTitle className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
              {isEdit ? 'Editar estratégia' : 'Nova estratégia'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed text-pretty">
              {isEdit
                ? 'Ajuste os parâmetros da sua estratégia. Alterações em regras criam uma nova versão.'
                : 'Um fluxo guiado em 4 passos para montar uma estratégia consistente.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <ProgressIndicator
          steps={STEPS as unknown as { id: string; label: string }[]}
          current={stepIndex}
          onStepClick={(i) => {
            if (i < stepIndex) setStepIndex(i);
          }}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <div className="mx-auto max-w-3xl">
            {currentStep.id === 'identidade' && <StepIdentidade form={form} />}
            {currentStep.id === 'escopo' && (
              <StepEscopo form={form} options={options} />
            )}
            {currentStep.id === 'gestao' && <StepGestao form={form} />}
            {currentStep.id === 'regras' && (
              <StepRegras form={form} ligas={ligasParaRegras} />
            )}
          </div>
        </div>

        <DialogFooter
          className={cn(
            'border-border/60 bg-muted/40 shrink-0 gap-2 border-t px-4 py-4 sm:px-6',
            'mx-0 mb-0 flex flex-col rounded-b-xl sm:flex-row sm:items-center sm:justify-between',
          )}
        >
          <Button
            type="button"
            variant="outline"
            className="order-2 w-full sm:order-1 sm:w-auto"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <div className="order-1 flex w-full flex-col gap-2 sm:order-2 sm:w-auto sm:flex-row sm:justify-end">
            {!isFirst && (
              <Button
                type="button"
                variant="secondary"
                onClick={goBack}
                disabled={isPending}
                className="w-full gap-1.5 sm:w-auto"
              >
                <ArrowLeft className="size-4 shrink-0" />
                Voltar
              </Button>
            )}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full gap-2 sm:min-w-[9.5rem] sm:w-auto"
            >
              {isPending ? (
                <Loader2 className="size-4 shrink-0 animate-spin" />
              ) : isLast ? (
                <>
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{isEdit ? 'Salvar alterações' : 'Criar estratégia'}</span>
                </>
              ) : (
                <>
                  <span>Avançar</span>
                  <ArrowRight className="size-4 shrink-0" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}

function ProgressIndicator({
  steps,
  current,
  onStepClick,
}: {
  steps: { id: string; label: string }[];
  current: number;
  onStepClick: (i: number) => void;
}) {
  const pct = ((current + 1) / steps.length) * 100;

  return (
    <>
      {/* Mobile / estreito: título do passo + barra + pontos */}
      <div className="border-border/60 bg-muted/20 md:hidden">
        <div className="px-4 py-3.5 sm:px-5">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Passo {current + 1} de {steps.length}
          </p>
          <p className="text-foreground font-heading mt-1 text-lg font-semibold tracking-tight">
            {steps[current].label}
          </p>
          <div
            className="bg-muted mt-3 h-2 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={current + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
          >
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 flex justify-center gap-2.5">
            {steps.map((_, i) => {
              const done = i < current;
              const active = i === current;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={i > current}
                  onClick={() => onStepClick(i)}
                  className={cn(
                    'h-2.5 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    active && 'bg-primary w-7',
                    done && !active && 'w-2.5 bg-primary/70 hover:bg-primary',
                    i > current && 'w-2.5 cursor-not-allowed bg-muted-foreground/25',
                  )}
                  aria-label={
                    i < current
                      ? `Voltar para ${steps[i].label}`
                      : active
                        ? `Passo atual: ${steps[i].label}`
                        : `Passo ${i + 1} bloqueado`
                  }
                  aria-current={active ? 'step' : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop: passos em linha com conectores */}
      <div className="border-border/60 bg-muted/20 hidden border-b md:block">
        <nav
          className="px-6 py-4"
          aria-label="Progresso do assistente"
        >
          <ol className="flex items-center gap-2">
            {steps.map((s, i) => {
              const done = i < current;
              const active = i === current;
              return (
                <React.Fragment key={s.id}>
                  <li className="flex min-w-0 shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => onStepClick(i)}
                      disabled={i > current}
                      className={cn(
                        'flex max-w-[7.5rem] items-center gap-2.5 rounded-lg py-1 pr-1 text-left transition-colors',
                        'focus-visible:ring-ring rounded-md focus-visible:ring-2 focus-visible:outline-none',
                        i > current && 'cursor-not-allowed opacity-45',
                        i < current && 'hover:bg-background/60',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
                          active &&
                            'border-primary bg-primary text-primary-foreground shadow-sm',
                          done &&
                            !active &&
                            'border-primary/50 bg-primary/12 text-primary',
                          !active &&
                            !done &&
                            'border-input bg-background text-muted-foreground',
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="size-4" aria-hidden />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span
                        className={cn(
                          'truncate text-xs font-medium leading-tight',
                          active ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {s.label}
                      </span>
                    </button>
                  </li>
                  {i < steps.length - 1 && (
                    <li
                      className={cn(
                        'mx-0.5 h-0.5 min-w-[0.75rem] flex-1 rounded-full',
                        i < current ? 'bg-primary/45' : 'bg-border',
                      )}
                      aria-hidden
                    />
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </nav>
      </div>
    </>
  );
}
