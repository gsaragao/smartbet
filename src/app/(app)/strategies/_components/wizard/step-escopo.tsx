'use client';

import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import {
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
import { MultiSelect } from '@/components/ui-kit/multi-select';
import type { WizardOptions } from '@/features/strategies/queries';
import type { StrategyInput } from '@/features/strategies/schema';
import { cn } from '@/lib/utils';

import { wizardControlCn } from './wizard-field-classes';

export function StepEscopo({
  form,
  options,
}: {
  form: UseFormReturn<StrategyInput>;
  options: WizardOptions;
}) {
  const esporteId = form.watch('escopo.esporte_id');
  const contextos = form.watch('escopo.contextos') ?? [];
  const aoVivo = contextos.includes('ao_vivo');

  const tiposFiltrados = React.useMemo(
    () => options.tipos_aposta.filter((t) => t.esporte_id === esporteId),
    [options.tipos_aposta, esporteId],
  );

  const ligasFiltradas = React.useMemo(
    () => options.ligas.filter((l) => l.esporte_id === esporteId),
    [options.ligas, esporteId],
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <FormField
        control={form.control}
        name="escopo.esporte_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Esporte</FormLabel>
            <FormControl>
              <Select
                value={field.value ? String(field.value) : ''}
                onValueChange={(v) => {
                  if (!v) return;
                  field.onChange(Number(v));
                  form.setValue('escopo.tipos_aposta_ids', []);
                  form.setValue('escopo.ligas_ids', []);
                }}
                items={options.esportes.map((e) => ({
                  value: String(e.id),
                  label: e.nome,
                }))}
              >
                <SelectTrigger
                  className={cn(
                    wizardControlCn('w-full justify-between gap-2 py-0 pr-2 pl-3'),
                  )}
                >
                  <SelectValue placeholder="Selecione um esporte">
                    {(v: string) =>
                      options.esportes.find((e) => String(e.id) === v)?.nome ??
                      'Selecione um esporte'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.esportes.map((e) => (
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
        name="escopo.tipos_aposta_ids"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipos de aposta</FormLabel>
            <FormControl>
              <MultiSelect
                options={tiposFiltrados.map((t) => ({
                  value: String(t.id),
                  label: t.nome,
                }))}
                value={(field.value ?? []).map(String)}
                onChange={(v) => field.onChange(v.map(Number))}
                placeholder={
                  esporteId
                    ? 'Selecione um ou mais tipos'
                    : 'Escolha o esporte primeiro'
                }
                disabled={!esporteId}
              />
            </FormControl>
            <FormDescription>
              A estratégia se aplicará a qualquer uma dessas modalidades.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="escopo.ligas_ids"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ligas</FormLabel>
            <FormControl>
              <MultiSelect
                options={ligasFiltradas.map((l) => ({
                  value: String(l.id),
                  label: l.nome,
                }))}
                value={(field.value ?? []).map(String)}
                onChange={(v) => field.onChange(v.map(Number))}
                placeholder={
                  esporteId
                    ? 'Deixe vazio para todas as ligas'
                    : 'Escolha o esporte primeiro'
                }
                disabled={!esporteId}
              />
            </FormControl>
            <FormDescription>
              Nenhuma selecionada = vale para todas as ligas do esporte.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="escopo.contextos"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contextos</FormLabel>
            <FormControl>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                {(['pre_live', 'ao_vivo'] as const).map((ctx) => {
                  const checked = (field.value ?? []).includes(ctx);
                  return (
                    <label
                      key={ctx}
                      className="bg-card hover:bg-accent/50 border-border/80 flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors sm:flex-1"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const next = new Set(field.value ?? []);
                          if (v) next.add(ctx);
                          else next.delete(ctx);
                          field.onChange(Array.from(next));
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {ctx === 'pre_live' ? 'Pré-jogo' : 'Ao vivo'}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {ctx === 'pre_live'
                            ? 'Apostas feitas antes do início da partida.'
                            : 'Apostas feitas durante a partida em tempo real.'}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          control={form.control}
          name="escopo.odd_minima"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Odd mínima</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={1.01}
                  max={100}
                  placeholder="Ex.: 1.60"
                  className={wizardControlCn('font-mono tabular-nums')}
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
          name="escopo.odd_maxima"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Odd máxima</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={1.01}
                  max={100}
                  placeholder="Ex.: 2.20"
                  className={wizardControlCn('font-mono tabular-nums')}
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
        {aoVivo && (
          <FormField
            control={form.control}
            name="escopo.minuto_minimo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minuto mínimo</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    placeholder="Ex.: 50"
                    className={wizardControlCn('font-mono tabular-nums')}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? null : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormDescription>Aplica-se ao contexto ao vivo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}
