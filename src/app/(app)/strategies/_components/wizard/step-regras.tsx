'use client';

import { ChevronDown, ShieldAlert } from 'lucide-react';
import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { StrategyInput } from '@/features/strategies/schema';

import { RulesBuilder } from '../rules-builder';

export function StepRegras({
  form,
  ligas,
}: {
  form: UseFormReturn<StrategyInput>;
  ligas: { id: number; nome: string }[];
}) {
  const [guardrailsOpen, setGuardrailsOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={form.control}
        name="regras"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Condições da estratégia</FormLabel>
            <FormDescription>
              Combine campos com operadores lógicos (E / OU) para definir
              quando uma aposta entra nesta estratégia.
            </FormDescription>
            <FormControl>
              <RulesBuilder
                value={field.value}
                onChange={field.onChange}
                ligas={ligas}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="rounded-lg border">
        <button
          type="button"
          onClick={() => setGuardrailsOpen((v) => !v)}
          className="hover:bg-muted/50 flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-muted-foreground size-4" />
            <div>
              <p className="text-sm font-medium">Guardrails e revisão</p>
              <p className="text-muted-foreground text-xs">
                Alertas de drawdown, reds, yield e lembretes de revisão.
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'text-muted-foreground size-4 transition-transform',
              guardrailsOpen && 'rotate-180',
            )}
          />
        </button>

        {guardrailsOpen && (
          <div className="border-t p-4">
            <GuardrailsFields form={form} />
          </div>
        )}
      </div>
    </div>
  );
}

function GuardrailsFields({ form }: { form: UseFormReturn<StrategyInput> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="guardrails.drawdown_alerta_pct"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Alerta de drawdown (%)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.5"
                min={0}
                max={100}
                placeholder="Ex.: 15"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="guardrails.reds_consec_alerta"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Alerta de reds consecutivos</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                max={30}
                placeholder="Ex.: 3"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="guardrails.yield_minimo_alerta"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Yield mínimo (%)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                min={-100}
                max={100}
                placeholder="Ex.: 5"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="guardrails.revisao_apos_apostas"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Revisão após N apostas</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                max={10000}
                placeholder="Ex.: 50"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="guardrails.revisao_apos_dias"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Revisão após N dias</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                max={365}
                placeholder="Ex.: 30"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
