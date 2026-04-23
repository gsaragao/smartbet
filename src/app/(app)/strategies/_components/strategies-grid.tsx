'use client';

import { Search, X } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StrategyDetail, WizardOptions } from '@/features/strategies/queries';
import type { StrategyListItem } from '@/features/strategies/queries';
import { cn } from '@/lib/utils';

import { StrategyCard } from './strategy-card';
import { StrategyDialog } from './strategy-dialog';

type Props = {
  estrategias: StrategyListItem[];
  options: WizardOptions;
  /** Obter o detalhe da estratégia para editar via wizard. */
  carregarDetalhe: (id: string) => Promise<StrategyDetail | null>;
};

type StatusFiltro = 'todas' | 'ativa' | 'pausada' | 'arquivada';

export function StrategiesGrid({
  estrategias,
  options,
  carregarDetalhe,
}: Props) {
  const [busca, setBusca] = React.useState('');
  const [statusFiltro, setStatusFiltro] = React.useState<StatusFiltro>('todas');
  const [esporteFiltro, setEsporteFiltro] = React.useState<string>('todos');
  const [tagFiltro, setTagFiltro] = React.useState<string | null>(null);

  const [editDetail, setEditDetail] = React.useState<StrategyDetail | null>(
    null,
  );
  const [loadingEdit, setLoadingEdit] = React.useState(false);

  const tagsDisponiveis = React.useMemo(() => {
    const set = new Set<string>();
    for (const e of estrategias) for (const t of e.tags) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [estrategias]);

  const filtradas = React.useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return estrategias.filter((e) => {
      if (statusFiltro !== 'todas' && e.status !== statusFiltro) return false;
      if (esporteFiltro !== 'todos' && String(e.esporte.id) !== esporteFiltro)
        return false;
      if (tagFiltro && !e.tags.includes(tagFiltro)) return false;
      if (termo) {
        const hay = `${e.nome} ${e.descricao ?? ''}`.toLowerCase();
        if (!hay.includes(termo)) return false;
      }
      return true;
    });
  }, [busca, estrategias, esporteFiltro, statusFiltro, tagFiltro]);

  const limparFiltros = () => {
    setBusca('');
    setStatusFiltro('todas');
    setEsporteFiltro('todos');
    setTagFiltro(null);
  };

  const hasFilters =
    busca !== '' ||
    statusFiltro !== 'todas' ||
    esporteFiltro !== 'todos' ||
    tagFiltro !== null;

  async function abrirEdicao(id: string) {
    setLoadingEdit(true);
    const detalhe = await carregarDetalhe(id);
    setLoadingEdit(false);
    if (detalhe) setEditDetail(detalhe);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border/70 bg-card/50 flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2 sm:p-2">
        <div className="relative min-h-0 w-full sm:min-w-[200px] sm:flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="h-10 pl-8 sm:h-9"
          />
        </div>

        <Select
          value={statusFiltro}
          onValueChange={(v) => v && setStatusFiltro(v as StatusFiltro)}
          items={[
            { value: 'todas', label: 'Todos os status' },
            { value: 'ativa', label: 'Ativas' },
            { value: 'pausada', label: 'Pausadas' },
            { value: 'arquivada', label: 'Arquivadas' },
          ]}
        >
          <SelectTrigger className="h-10 w-full justify-between sm:h-9 sm:w-[150px]">
            <SelectValue>
              {(v: string) =>
                v === 'todas'
                  ? 'Todos'
                  : v === 'ativa'
                    ? 'Ativas'
                    : v === 'pausada'
                      ? 'Pausadas'
                      : v === 'arquivada'
                        ? 'Arquivadas'
                        : 'Status'
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os status</SelectItem>
            <SelectItem value="ativa">Ativas</SelectItem>
            <SelectItem value="pausada">Pausadas</SelectItem>
            <SelectItem value="arquivada">Arquivadas</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={esporteFiltro}
          onValueChange={(v) => v && setEsporteFiltro(v)}
          items={[
            { value: 'todos', label: 'Todos os esportes' },
            ...options.esportes.map((e) => ({
              value: String(e.id),
              label: e.nome,
            })),
          ]}
        >
          <SelectTrigger className="h-10 w-full justify-between sm:h-9 sm:w-[160px]">
            <SelectValue>
              {(v: string) =>
                v === 'todos'
                  ? 'Todos os esportes'
                  : (options.esportes.find((e) => String(e.id) === v)?.nome ??
                    'Esporte')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os esportes</SelectItem>
            {options.esportes.map((e) => (
              <SelectItem key={e.id} value={String(e.id)}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={limparFiltros}
            className="h-10 shrink-0 gap-1.5 sm:h-9"
          >
            <X className="size-3.5" />
            Limpar
          </Button>
        )}
      </div>

      {tagsDisponiveis.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Tags:
          </span>
          {tagsDisponiveis.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTagFiltro((prev) => (prev === t ? null : t))}
              className="focus:outline-none"
            >
              <Badge
                variant={tagFiltro === t ? 'default' : 'secondary'}
                className={cn(
                  'cursor-pointer px-2 py-0 text-[11px] font-normal',
                  'hover:border-primary/30',
                )}
              >
                {t}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {filtradas.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-2 rounded-xl border py-12 text-center">
          <p className="text-foreground text-sm font-medium">
            Nenhuma estratégia encontrada.
          </p>
          <p className="text-muted-foreground text-xs">
            Ajuste os filtros ou crie uma nova estratégia.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((e) => (
            <StrategyCard
              key={e.id}
              estrategia={e}
              onEdit={abrirEdicao}
            />
          ))}
        </div>
      )}

      {loadingEdit && (
        <div className="text-muted-foreground text-center text-xs">
          Carregando detalhes...
        </div>
      )}

      {editDetail && (
        <StrategyDialog
          mode="edit"
          options={options}
          estrategia={editDetail}
          open={Boolean(editDetail)}
          onOpenChange={(open) => {
            if (!open) setEditDetail(null);
          }}
        />
      )}
    </div>
  );
}
