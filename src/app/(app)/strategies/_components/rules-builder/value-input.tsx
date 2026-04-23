'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MultiSelect,
  type MultiSelectOption,
} from '@/components/ui-kit/multi-select';
import type { FieldKind } from '@/features/strategies/rules-catalog';

type Props = {
  kind: FieldKind;
  operator: string;
  value: unknown;
  onChange: (value: unknown) => void;
  ligas?: { id: number; nome: string }[];
  min?: number;
  max?: number;
  disabled?: boolean;
};

/**
 * Renderiza o input correto para o valor de uma condição, considerando
 * o tipo do campo e o operador selecionado (between usa dois campos).
 */
export function ValueInput({
  kind,
  operator,
  value,
  onChange,
  ligas = [],
  min,
  max,
  disabled,
}: Props) {
  if (operator === 'between') {
    const [a, b] = (Array.isArray(value) ? value : [null, null]) as [
      unknown,
      unknown,
    ];
    return (
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          value={typeof a === 'number' ? a : ''}
          onChange={(e) =>
            onChange([
              e.target.value === '' ? null : Number(e.target.value),
              b ?? null,
            ])
          }
          placeholder="mín"
          min={min}
          max={max}
          className="h-8 w-20 text-sm"
          disabled={disabled}
        />
        <span className="text-muted-foreground text-xs">até</span>
        <Input
          type="number"
          value={typeof b === 'number' ? b : ''}
          onChange={(e) =>
            onChange([
              a ?? null,
              e.target.value === '' ? null : Number(e.target.value),
            ])
          }
          placeholder="máx"
          min={min}
          max={max}
          className="h-8 w-20 text-sm"
          disabled={disabled}
        />
      </div>
    );
  }

  if (kind === 'league-id') {
    if (operator === 'in' || operator === 'not_in') {
      const options: MultiSelectOption[] = ligas.map((l) => ({
        value: String(l.id),
        label: l.nome,
      }));
      const current = Array.isArray(value) ? value.map(String) : [];
      return (
        <MultiSelect
          options={options}
          value={current}
          onChange={(v) => onChange(v.map(Number))}
          placeholder="Selecione ligas"
          className="h-8 min-h-8"
        />
      );
    }
    return (
      <Select
        value={String(value ?? '')}
        onValueChange={(v) => onChange(v ? Number(v) : null)}
        items={ligas.map((l) => ({ value: String(l.id), label: l.nome }))}
      >
        <SelectTrigger className="h-8 w-48 text-sm">
          <SelectValue placeholder="Liga">
            {(v: string) => ligas.find((l) => String(l.id) === v)?.nome ?? 'Liga'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ligas.map((l) => (
            <SelectItem key={l.id} value={String(l.id)}>
              {l.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (kind === 'boolean') {
    return (
      <Select
        value={value === true ? 'true' : value === false ? 'false' : ''}
        onValueChange={(v) => onChange(v === 'true')}
        items={[
          { value: 'true', label: 'Sim' },
          { value: 'false', label: 'Não' },
        ]}
      >
        <SelectTrigger className="h-8 w-24 text-sm">
          <SelectValue placeholder="—">
            {(v: string) => (v === 'true' ? 'Sim' : v === 'false' ? 'Não' : '—')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Sim</SelectItem>
          <SelectItem value="false">Não</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (kind === 'score') {
    return (
      <Input
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="Ex.: 0x0"
        className="h-8 w-24 font-mono text-sm"
        disabled={disabled}
      />
    );
  }

  // number, integer, percent, string (fallback)
  const isNumeric =
    kind === 'number' || kind === 'integer' || kind === 'percent';

  return (
    <Input
      type={isNumeric ? 'number' : 'text'}
      value={
        typeof value === 'string' || typeof value === 'number'
          ? (value as string | number)
          : ''
      }
      onChange={(e) =>
        onChange(
          isNumeric
            ? e.target.value === ''
              ? null
              : Number(e.target.value)
            : e.target.value,
        )
      }
      placeholder={kind === 'percent' ? '%' : ''}
      min={min}
      max={max}
      step={kind === 'integer' ? 1 : 'any'}
      className="h-8 w-28 text-sm"
      disabled={disabled}
    />
  );
}
