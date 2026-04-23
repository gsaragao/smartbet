'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { criarEstrategiaDeTemplate } from '@/features/strategies/actions';
import type { WizardOptions } from '@/features/strategies/queries';
import {
  STRATEGY_TEMPLATES,
  type StrategyTemplate,
} from '@/features/strategies/templates';
import { cn } from '@/lib/utils';

type Props = {
  options: WizardOptions;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
};

export function TemplatePicker({ options, open, onOpenChange, trigger }: Props) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled
    ? (onOpenChange ?? (() => undefined))
    : setInternalOpen;

  const [applyingId, setApplyingId] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  const futebol = options.esportes.find((e) => e.slug === 'futebol');

  function aplicar(template: StrategyTemplate) {
    if (!futebol) {
      toast.error('Cadastre o esporte "Futebol" antes de usar templates.');
      return;
    }
    const tiposDisponiveis = options.tipos_aposta.filter(
      (t) => t.esporte_id === futebol.id,
    );
    const tiposIds = template.tipos_aposta_slugs
      .map((slug) => tiposDisponiveis.find((t) => t.slug === slug)?.id)
      .filter((id): id is number => typeof id === 'number');

    if (tiposIds.length === 0) {
      toast.error(
        `Nenhum tipo de aposta correspondente (${template.tipos_aposta_slugs.join(', ')}) está cadastrado.`,
      );
      return;
    }

    setApplyingId(template.id);
    startTransition(async () => {
      const result = await criarEstrategiaDeTemplate({
        templateId: template.id,
        esporte_id: futebol.id,
        tipos_aposta_ids: tiposIds,
      });
      setApplyingId(null);
      if (result.ok) {
        toast.success(`Template "${template.nome}" aplicado.`);
        setOpen(false);
        router.push(`/strategies/${result.data.id}`);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary size-5" />
            Escolha um template
          </DialogTitle>
          <DialogDescription>
            Comece com uma estratégia pronta e ajuste o que precisar. Você pode
            editar tudo depois.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          {STRATEGY_TEMPLATES.map((t) => {
            const busy = applyingId === t.id && isPending;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => aplicar(t)}
                disabled={isPending}
                className={cn(
                  'bg-card group relative flex flex-col gap-3 overflow-hidden rounded-xl border p-4 text-left transition-all',
                  'hover:border-primary/40 hover:shadow-md',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                )}
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: t.cor }}
                />
                <div
                  className="flex size-10 items-center justify-center rounded-lg text-xl"
                  style={{
                    backgroundColor: `${t.cor}1a`,
                    color: t.cor,
                  }}
                >
                  {t.icone}
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-foreground text-sm font-semibold">
                    {t.nome}
                  </h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {t.descricao}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-1.5 pt-1">
                  {busy ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span className="text-muted-foreground text-xs">
                        Aplicando...
                      </span>
                    </>
                  ) : (
                    <span className="text-primary text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
                      Usar este template →
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-muted-foreground text-center text-xs">
          Prefere começar do zero?{' '}
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
