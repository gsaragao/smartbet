'use client';

import { FolderTree, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { RuleGroup, RuleNode } from '@/features/strategies/schema';

import { ConditionRow } from './condition-row';

type Props = {
  group: RuleGroup;
  onChange: (next: RuleGroup) => void;
  onRemove?: () => void;
  depth?: number;
  ligas: { id: number; nome: string }[];
};

export function GroupNode({
  group,
  onChange,
  onRemove,
  depth = 0,
  ligas,
}: Props) {
  function updateChild(index: number, next: RuleNode) {
    const filhos = group.filhos.slice();
    filhos[index] = next;
    onChange({ ...group, filhos });
  }

  function removeChild(index: number) {
    const filhos = group.filhos.slice();
    filhos.splice(index, 1);
    onChange({ ...group, filhos });
  }

  function addCondicao() {
    onChange({
      ...group,
      filhos: [
        ...group.filhos,
        { tipo: 'condicao', campo: 'odd', operador: 'gte', valor: null },
      ],
    });
  }

  function addGrupo() {
    onChange({
      ...group,
      filhos: [
        ...group.filhos,
        { tipo: 'grupo', operador: 'AND', filhos: [] },
      ],
    });
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3',
        depth === 0 ? 'bg-muted/30' : 'bg-card',
      )}
    >
      <div className="flex items-center gap-2">
        <FolderTree
          className="text-muted-foreground size-4 shrink-0"
          aria-hidden
        />
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Grupo
        </span>
        <Select
          value={group.operador}
          onValueChange={(v) =>
            onChange({ ...group, operador: v as 'AND' | 'OR' })
          }
          items={[
            { value: 'AND', label: 'Todas (E)' },
            { value: 'OR', label: 'Qualquer (OU)' },
          ]}
        >
          <SelectTrigger className="h-7 w-36 text-xs">
            <SelectValue>
              {(v: string) =>
                v === 'AND' ? 'Todas (E)' : v === 'OR' ? 'Qualquer (OU)' : '—'
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">Todas (E)</SelectItem>
            <SelectItem value="OR">Qualquer (OU)</SelectItem>
          </SelectContent>
        </Select>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive ml-auto gap-1.5"
          >
            <Trash2 className="size-3.5" />
            Remover grupo
          </Button>
        )}
      </div>

      {group.filhos.length === 0 ? (
        <p className="text-muted-foreground px-2 py-3 text-sm">
          Nenhuma condição ainda. Adicione a primeira condição ou um sub-grupo.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {group.filhos.map((child, idx) =>
            child.tipo === 'grupo' ? (
              <GroupNode
                key={idx}
                group={child}
                depth={depth + 1}
                onChange={(next) => updateChild(idx, next)}
                onRemove={() => removeChild(idx)}
                ligas={ligas}
              />
            ) : (
              <ConditionRow
                key={idx}
                condition={child}
                onChange={(next) => updateChild(idx, next)}
                onRemove={() => removeChild(idx)}
                ligas={ligas}
              />
            ),
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCondicao}
          className="gap-1.5"
        >
          <Plus className="size-3.5" />
          Condição
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addGrupo}
          className="gap-1.5"
        >
          <Plus className="size-3.5" />
          Sub-grupo
        </Button>
      </div>
    </div>
  );
}
