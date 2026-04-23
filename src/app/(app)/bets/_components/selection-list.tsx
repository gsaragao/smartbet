'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, type Control, type FieldErrors } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { RegistroOptions } from '@/features/bets/queries';
import {
  calcularOddTotalMultipla,
  type BetInput,
} from '@/features/bets/schema';
import { cn } from '@/lib/utils';

import { PartidaPicker } from './partida-picker';

const fieldControlClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-none transition-[color,box-shadow] md:text-sm';
const focusRingClass =
  'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25';

type Props = {
  control: Control<BetInput>;
  options: RegistroOptions;
  esporteId: number;
  selecoes: BetInput['selecoes'];
  errors?: FieldErrors<BetInput>['selecoes'];
};

export function SelectionList({ control, options, esporteId, selecoes }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'selecoes',
  });

  const tiposDisponiveis = options.tipos_aposta.filter(
    (t) => t.esporte_id === esporteId,
  );

  const oddTotal = calcularOddTotalMultipla(selecoes ?? []);

  const addSelecao = () => {
    append({
      partida: {
        kind: 'new',
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
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs">Odd total da múltipla</span>
          <span className="font-mono text-base font-semibold tabular-nums">
            {oddTotal > 0 ? oddTotal.toFixed(3) : '—'}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addSelecao}
          className="gap-1.5"
        >
          <Plus className="size-4" />
          Adicionar seleção
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
          Nenhuma seleção ainda. Adicione ao menos 2 seleções.
        </div>
      ) : null}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="relative rounded-lg border border-border/60 bg-background p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Seleção {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Remover
              </Button>
            </div>

            <FormField
              control={control}
              name={`selecoes.${index}.partida` as const}
              render={({ field: partidaField, fieldState }) => {
                const errs = fieldState.error as
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
                        value={partidaField.value}
                        onChange={partidaField.onChange}
                        esporte_id={esporteId}
                        ligas={options.ligas}
                        errors={{
                          mandante_nome: errs?.mandante_nome?.message,
                          visitante_nome: errs?.visitante_nome?.message,
                          inicio: errs?.inicio?.message,
                        }}
                      />
                    </FormControl>
                  </FormItem>
                );
              }}
            />

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={control}
                name={`selecoes.${index}.tipo_aposta_id` as const}
                render={({ field: f }) => (
                  <FormItem className="gap-2">
                    <FormLabel>Tipo de aposta</FormLabel>
                    <FormControl>
                      <select
                        value={f.value || ''}
                        onChange={(e) => f.onChange(Number(e.target.value) || 0)}
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
                control={control}
                name={`selecoes.${index}.linha` as const}
                render={({ field: f }) => (
                  <FormItem className="gap-2">
                    <FormLabel>
                      Linha{' '}
                      <span className="text-muted-foreground">(ex: 2.5)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...f}
                        className={cn(fieldControlClass, focusRingClass)}
                        placeholder="—"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`selecoes.${index}.odd` as const}
                render={({ field: f }) => (
                  <FormItem className="gap-2">
                    <FormLabel>Odd</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={Number.isFinite(f.value) ? f.value : ''}
                        onChange={(e) => f.onChange(Number(e.target.value))}
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
                control={control}
                name={`selecoes.${index}.descricao` as const}
                render={({ field: f }) => (
                  <FormItem className="gap-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input
                        {...f}
                        placeholder="Ex.: Over 2.5 gols"
                        className={cn(fieldControlClass, focusRingClass)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
