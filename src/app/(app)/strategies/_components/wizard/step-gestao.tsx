'use client';

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
import { RadioGroup, RadioItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StrategyInput } from '@/features/strategies/schema';
import { cn } from '@/lib/utils';

import { wizardControlCn } from './wizard-field-classes';

type MetodoStake = StrategyInput['gestao']['metodo_stake'];

const METODOS: Array<{
  value: MetodoStake;
  label: string;
  desc: string;
}> = [
  { value: 'livre', label: 'Livre', desc: 'Você decide o valor a cada aposta.' },
  { value: 'fixo', label: 'Fixo', desc: 'Valor em R$ igual em toda aposta.' },
  { value: 'percentual', label: 'Percentual', desc: '% do saldo de referência.' },
  { value: 'kelly', label: 'Kelly', desc: 'Critério de Kelly fracionado.' },
  { value: 'progressao', label: 'Progressão', desc: 'Martingale, Fibonacci ou customizado.' },
];

export function StepGestao({
  form,
}: {
  form: UseFormReturn<StrategyInput>;
}) {
  const metodo = form.watch('gestao.metodo_stake');

  // Quando o método muda, reescrevemos stake_config com o shape correspondente.
  const setMetodo = (m: MetodoStake) => {
    form.setValue('gestao.metodo_stake', m);
    const base: Record<MetodoStake, StrategyInput['gestao']['stake_config']> = {
      livre: { metodo: 'livre' },
      fixo: { metodo: 'fixo', valor: 10 },
      percentual: { metodo: 'percentual', percentual: 2 },
      kelly: { metodo: 'kelly', fracao: 0.25 },
      progressao: {
        metodo: 'progressao',
        tipo: 'martingale',
        valor_inicial: 10,
        multiplicador: 2,
        degraus: [],
      },
    };
    form.setValue('gestao.stake_config', base[m]);
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Painel 1: seleção de método */}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-medium">Método de stake</h3>
          <p className="text-muted-foreground text-xs">
            Como o valor de cada aposta será calculado.
          </p>
        </div>
        <RadioGroup
          value={metodo}
          onValueChange={(v) => v && setMetodo(v as MetodoStake)}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {METODOS.map((m) => (
            <label
              key={m.value}
              className="bg-card hover:bg-accent/50 data-[checked=true]:border-primary data-[checked=true]:bg-primary/5 relative flex min-h-[4.5rem] cursor-pointer flex-col gap-1.5 rounded-lg border p-3.5 transition-colors"
              data-checked={metodo === m.value}
            >
              <div className="flex items-center gap-2">
                <RadioItem value={m.value} />
                <span className="text-sm font-medium">{m.label}</span>
              </div>
              <span className="text-muted-foreground text-xs leading-snug">
                {m.desc}
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Painel 2: parâmetros do método escolhido */}
      <div className="bg-muted/30 border-border/70 flex flex-col gap-4 rounded-xl border p-4 sm:p-5">
        <h4 className="text-sm font-medium">Parâmetros</h4>
        {metodo === 'livre' && (
          <p className="text-muted-foreground text-sm">
            Sem parâmetros — você decide o valor a cada aposta.
          </p>
        )}
        {metodo === 'fixo' && (
          <FormField
            control={form.control}
            name="gestao.stake_config.valor"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Valor fixo (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0.01}
                    className={wizardControlCn('font-mono tabular-nums')}
                    value={typeof field.value === 'number' ? field.value : ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? 0 : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {metodo === 'percentual' && (
          <FormField
            control={form.control}
            name="gestao.stake_config.percentual"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Percentual (% do saldo)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min={0.1}
                    max={10}
                    value={typeof field.value === 'number' ? field.value : ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? 0 : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormDescription>Entre 0,1% e 10%.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {metodo === 'kelly' && (
          <FormField
            control={form.control}
            name="gestao.stake_config.fracao"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Fração de Kelly</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.05"
                    min={0.1}
                    max={1}
                    value={typeof field.value === 'number' ? field.value : ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? 0 : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  0.25 (quarter-Kelly) é o padrão conservador.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {metodo === 'progressao' && <ProgressaoFields form={form} />}
      </div>

      {/* Painel 3: banca de referência */}
      <FormField
        control={form.control}
        name="gestao.banca_referencia"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Banca de referência</FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
                items={[
                  { value: 'saldo_atual', label: 'Saldo atual' },
                  { value: 'saldo_inicial', label: 'Saldo inicial' },
                  { value: 'media_7d', label: 'Média dos últimos 7 dias' },
                ]}
              >
                <SelectTrigger
                  className={cn(
                    wizardControlCn('max-w-sm justify-between gap-2 py-0 pr-2 pl-3'),
                  )}
                >
                  <SelectValue>
                    {(v: string) =>
                      v === 'saldo_atual'
                        ? 'Saldo atual'
                        : v === 'saldo_inicial'
                          ? 'Saldo inicial'
                          : v === 'media_7d'
                            ? 'Média dos últimos 7 dias'
                            : 'Selecione'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saldo_atual">Saldo atual</SelectItem>
                  <SelectItem value="saldo_inicial">Saldo inicial</SelectItem>
                  <SelectItem value="media_7d">
                    Média dos últimos 7 dias
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              Base sobre a qual os cálculos percentuais serão feitos.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Painel 4: edge mínimo */}
      <FormField
        control={form.control}
        name="gestao.edge_minimo"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Edge mínimo (%)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                min={0}
                max={100}
                placeholder="Opcional"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </FormControl>
            <FormDescription>
              Diferença mínima entre odd real e odd estimada para aceitar a
              aposta.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Painel 5: stop-loss */}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-medium">Stop-loss</h3>
          <p className="text-muted-foreground text-xs">
            Interrompe a estratégia quando os limites abaixo forem atingidos.
            Deixe em branco para desabilitar.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="gestao.stop_loss_reds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reds consecutivos</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={30}
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
            name="gestao.stop_loss_banca_pct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Perda máxima da banca (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    min={0.5}
                    max={100}
                    placeholder="Ex.: 10"
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
      </div>
    </div>
  );
}

function ProgressaoFields({ form }: { form: UseFormReturn<StrategyInput> }) {
  const tipo = form.watch('gestao.stake_config.tipo' as never) as unknown as
    | 'martingale'
    | 'customizado'
    | 'fibonacci'
    | undefined;

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name={'gestao.stake_config.tipo' as never}
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Tipo de progressão</FormLabel>
            <FormControl>
              <Select
                value={(field.value as string) ?? ''}
                onValueChange={(v) => v && field.onChange(v)}
                items={[
                  { value: 'martingale', label: 'Martingale' },
                  { value: 'fibonacci', label: 'Fibonacci' },
                  { value: 'customizado', label: 'Customizado' },
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione">
                    {(v: string) =>
                      v === 'martingale'
                        ? 'Martingale'
                        : v === 'fibonacci'
                          ? 'Fibonacci'
                          : v === 'customizado'
                            ? 'Customizado'
                            : 'Selecione'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="martingale">Martingale</SelectItem>
                  <SelectItem value="fibonacci">Fibonacci</SelectItem>
                  <SelectItem value="customizado">Customizado</SelectItem>
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
          name={'gestao.stake_config.valor_inicial' as never}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor inicial (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={0.01}
                  value={typeof field.value === 'number' ? field.value : ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === '' ? 0 : Number(e.target.value),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {tipo !== 'fibonacci' && (
          <FormField
            control={form.control}
            name={'gestao.stake_config.multiplicador' as never}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Multiplicador</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min={1}
                    max={10}
                    placeholder={tipo === 'martingale' ? '2' : 'Opcional'}
                    value={
                      typeof field.value === 'number'
                        ? field.value
                        : (field.value ?? '')
                    }
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
        )}
      </div>
    </div>
  );
}
