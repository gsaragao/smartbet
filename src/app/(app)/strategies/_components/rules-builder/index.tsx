'use client';

import type { RuleGroup } from '@/features/strategies/schema';

import { GroupNode } from './group-node';

type Props = {
  value: RuleGroup;
  onChange: (next: RuleGroup) => void;
  ligas: { id: number; nome: string }[];
};

/**
 * Builder de regras. É apenas uma raiz `GroupNode` mas deixamos este arquivo
 * como ponto de extensão (validações visuais, preview etc. virão aqui).
 */
export function RulesBuilder({ value, onChange, ligas }: Props) {
  return <GroupNode group={value} onChange={onChange} ligas={ligas} />;
}

/**
 * Visualização somente-leitura do AST — usada na aba "Regras".
 */
export function RulesReadOnly({
  value,
  depth = 0,
  ligasMap,
}: {
  value: RuleGroup;
  depth?: number;
  ligasMap?: Map<number, string>;
}) {
  if (value.filhos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic">
        Nenhuma condição definida.
      </p>
    );
  }

  return (
    <div
      className={
        depth === 0
          ? 'flex flex-col gap-2'
          : 'border-border/60 ml-4 flex flex-col gap-2 border-l pl-4'
      }
    >
      {value.filhos.map((child, idx) => {
        if (child.tipo === 'grupo') {
          return (
            <div key={idx} className="flex flex-col gap-1">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                {child.operador === 'AND' ? 'Todas abaixo' : 'Qualquer abaixo'}
              </span>
              <RulesReadOnly
                value={child}
                depth={depth + 1}
                ligasMap={ligasMap}
              />
            </div>
          );
        }

        const valor = formatValue(child.valor, child.campo, ligasMap);
        return (
          <div
            key={idx}
            className="bg-muted/30 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm"
          >
            <span className="text-foreground font-medium">{fieldLabel(child.campo)}</span>
            <span className="text-muted-foreground">{opLabel(child.operador)}</span>
            <span className="text-foreground font-mono text-xs">{valor}</span>
            <span className="text-muted-foreground/60 text-[10px] uppercase">
              {value.operador === 'AND' && idx < value.filhos.length - 1 ? 'e' : ''}
              {value.operador === 'OR' && idx < value.filhos.length - 1 ? 'ou' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function fieldLabel(id: string): string {
  const map: Record<string, string> = {
    odd: 'Odd',
    minuto: 'Minuto',
    placar_ht: 'Placar HT',
    placar_atual: 'Placar atual',
    finalizacoes_pct: 'Finalizações no alvo (%)',
    xg: 'xG',
    posse: 'Posse (%)',
    cartoes: 'Cartões',
    escanteios: 'Escanteios',
    btts_historico: 'BTTS histórico (%)',
    media_gols_time: 'Média gols/time',
    mandante: 'Mandante',
    liga: 'Liga',
  };
  return map[id] ?? id;
}

function opLabel(id: string): string {
  const map: Record<string, string> = {
    eq: '=',
    neq: '≠',
    gt: '>',
    gte: '≥',
    lt: '<',
    lte: '≤',
    in: '∈',
    not_in: '∉',
    between: '⟷',
  };
  return map[id] ?? id;
}

function formatValue(
  v: unknown,
  campo: string,
  ligasMap?: Map<number, string>,
): string {
  if (v == null) return '—';
  if (Array.isArray(v)) {
    if (campo === 'liga' && ligasMap) {
      return v.map((x) => ligasMap.get(Number(x)) ?? x).join(', ');
    }
    return v.join(', ');
  }
  if (campo === 'liga' && ligasMap) {
    return ligasMap.get(Number(v)) ?? String(v);
  }
  if (typeof v === 'boolean') return v ? 'sim' : 'não';
  return String(v);
}
