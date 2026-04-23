'use client';

import { Trash2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RULE_FIELDS,
  RULE_OPERATORS,
  getRuleField,
  getRuleOperator,
  operatorsForField,
  type RuleFieldId,
  type RuleOperatorId,
} from '@/features/strategies/rules-catalog';
import type { RuleCondition } from '@/features/strategies/schema';

import { ValueInput } from './value-input';

type Props = {
  condition: RuleCondition;
  onChange: (next: RuleCondition) => void;
  onRemove: () => void;
  ligas: { id: number; nome: string }[];
};

export function ConditionRow({ condition, onChange, onRemove, ligas }: Props) {
  const field = getRuleField(condition.campo);
  const op = getRuleOperator(condition.operador);
  const allowedOps = field ? operatorsForField(field.id as RuleFieldId) : [];

  function updateField(fieldId: string) {
    const f = getRuleField(fieldId);
    const ops = f ? operatorsForField(f.id as RuleFieldId) : [];
    const nextOp: RuleOperatorId = ops.includes(op?.id as RuleOperatorId)
      ? (op!.id as RuleOperatorId)
      : (ops[0] ?? 'eq');
    onChange({
      tipo: 'condicao',
      campo: fieldId as RuleCondition['campo'],
      operador: nextOp as RuleCondition['operador'],
      valor: null,
    });
  }

  function updateOp(opId: string) {
    onChange({ ...condition, operador: opId as RuleCondition['operador'], valor: null });
  }

  return (
    <div className="bg-card flex flex-wrap items-center gap-2 rounded-md border p-2">
      <Select
        value={condition.campo}
        onValueChange={(v) => v && updateField(v)}
        items={RULE_FIELDS.map((f) => ({ value: f.id, label: f.label }))}
      >
        <SelectTrigger className="h-8 w-44 text-sm">
          <SelectValue placeholder="Campo">
            {(v: string) => getRuleField(v)?.label ?? 'Campo'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {RULE_FIELDS.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operador}
        onValueChange={(v) => v && updateOp(v)}
        items={allowedOps.map((id) => {
          const o = getRuleOperator(id);
          return { value: id, label: o?.label ?? id };
        })}
      >
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="Operador">
            {(v: string) => getRuleOperator(v)?.label ?? 'Operador'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allowedOps.map((id) => {
            const o = RULE_OPERATORS.find((x) => x.id === id);
            return (
              <SelectItem key={id} value={id}>
                {o?.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {field && (
        <ValueInput
          kind={field.kind}
          operator={condition.operador}
          value={condition.valor}
          onChange={(v) => onChange({ ...condition, valor: v })}
          ligas={ligas}
          min={field.min}
          max={field.max}
        />
      )}

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="ml-auto gap-1.5 text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" />
        Remover
      </Button>
    </div>
  );
}
