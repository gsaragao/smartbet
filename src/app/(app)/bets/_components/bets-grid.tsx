'use client';

import Link from 'next/link';
import * as React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Download,
  Filter,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge, type Status } from '@/components/ui-kit/status-badge';
import {
  excluirAposta,
  obterDetalheAposta,
  reabrirAposta,
} from '@/features/bets/actions';
import { useUser } from '@/components/providers/user-context';
import type {
  BetDetail,
  BetListItem,
  RegistroOptions,
} from '@/features/bets/queries';
import { formatDateTime, formatMoney } from '@/lib/format';

import { BetDialog } from './bet-dialog';
import { BetResolveDialog } from './bet-resolve-dialog';

type Props = {
  apostas: BetListItem[];
  options: RegistroOptions;
};

type StatusFiltro = 'todas' | 'pendentes' | 'resolvidas';

type FormatoFiltro = 'todos' | 'simples' | 'multipla';

export function BetsGrid({ apostas, options }: Props) {
  const [busca, setBusca] = React.useState('');
  const [statusFiltro, setStatusFiltro] = React.useState<StatusFiltro>('todas');
  const [estrategiaFiltro, setEstrategiaFiltro] = React.useState<string>('todas');
  const [bancaFiltro, setBancaFiltro] = React.useState<string>('todas');

  const [formatoFiltro, setFormatoFiltro] = React.useState<FormatoFiltro>('todos');
  const [tipoApostaFiltro, setTipoApostaFiltro] = React.useState<string>('todos');
  const [ligaFiltro, setLigaFiltro] = React.useState<string>('todas');
  const [casaFiltro, setCasaFiltro] = React.useState<string>('todas');
  const [freebetFiltro, setFreebetFiltro] = React.useState<'todas' | 'sim' | 'nao'>(
    'todas',
  );
  const [oddMin, setOddMin] = React.useState<string>('');
  const [oddMax, setOddMax] = React.useState<string>('');
  const [maisFiltrosAbertos, setMaisFiltrosAbertos] = React.useState(false);

  // Casas de aposta únicas derivadas das apostas (para popular o select)
  const casasUnicas = React.useMemo(() => {
    const set = new Set<string>();
    for (const a of apostas) {
      if (a.casa_de_aposta) set.add(a.casa_de_aposta);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [apostas]);

  const [editing, setEditing] = React.useState<BetDetail | null>(null);
  const [resolving, setResolving] = React.useState<BetDetail | null>(null);
  const [carregando, setCarregando] = React.useState(false);
  const [excluindo, setExcluindo] = React.useState<BetListItem | null>(null);
  const [excluindoPending, startExcluir] = React.useTransition();
  const [reabrindoId, setReabrindoId] = React.useState<string | null>(null);
  const [reabrindoPending, startReabrir] = React.useTransition();

  const filtradas = React.useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const oddMinNum = Number(oddMin);
    const oddMaxNum = Number(oddMax);
    return apostas.filter((a) => {
      if (statusFiltro === 'pendentes' && a.status !== 'pendente') return false;
      if (statusFiltro === 'resolvidas' && a.status === 'pendente') return false;
      if (estrategiaFiltro !== 'todas' && a.estrategia?.id !== estrategiaFiltro)
        return false;
      if (bancaFiltro !== 'todas' && a.banca?.id !== bancaFiltro) return false;

      if (formatoFiltro !== 'todos' && a.formato !== formatoFiltro) return false;

      if (tipoApostaFiltro !== 'todos') {
        const tid = a.selecao_resumo?.tipo_aposta_id;
        if (String(tid ?? '') !== tipoApostaFiltro) return false;
      }

      if (ligaFiltro !== 'todas') {
        const lid = a.selecao_resumo?.partida?.liga_id;
        if (String(lid ?? '') !== ligaFiltro) return false;
      }

      if (casaFiltro !== 'todas') {
        if ((a.casa_de_aposta ?? '') !== casaFiltro) return false;
      }

      if (freebetFiltro === 'sim' && !a.eh_freebet) return false;
      if (freebetFiltro === 'nao' && a.eh_freebet) return false;

      if (Number.isFinite(oddMinNum) && oddMin !== '' && a.odd_total < oddMinNum) {
        return false;
      }
      if (Number.isFinite(oddMaxNum) && oddMax !== '' && a.odd_total > oddMaxNum) {
        return false;
      }

      if (termo) {
        const partes = [
          a.descricao,
          a.selecao_resumo?.descricao,
          a.selecao_resumo?.partida?.mandante,
          a.selecao_resumo?.partida?.visitante,
          a.selecao_resumo?.partida?.liga_nome,
          a.casa_de_aposta,
          a.estrategia?.nome,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!partes.includes(termo)) return false;
      }
      return true;
    });
  }, [
    apostas,
    bancaFiltro,
    busca,
    casaFiltro,
    estrategiaFiltro,
    formatoFiltro,
    freebetFiltro,
    ligaFiltro,
    oddMax,
    oddMin,
    statusFiltro,
    tipoApostaFiltro,
  ]);

  const limpar = () => {
    setBusca('');
    setStatusFiltro('todas');
    setEstrategiaFiltro('todas');
    setBancaFiltro('todas');
    setFormatoFiltro('todos');
    setTipoApostaFiltro('todos');
    setLigaFiltro('todas');
    setCasaFiltro('todas');
    setFreebetFiltro('todas');
    setOddMin('');
    setOddMax('');
  };

  const hasFilters =
    busca !== '' ||
    statusFiltro !== 'todas' ||
    estrategiaFiltro !== 'todas' ||
    bancaFiltro !== 'todas' ||
    formatoFiltro !== 'todos' ||
    tipoApostaFiltro !== 'todos' ||
    ligaFiltro !== 'todas' ||
    casaFiltro !== 'todas' ||
    freebetFiltro !== 'todas' ||
    oddMin !== '' ||
    oddMax !== '';

  const advancedFiltersCount =
    (formatoFiltro !== 'todos' ? 1 : 0) +
    (tipoApostaFiltro !== 'todos' ? 1 : 0) +
    (ligaFiltro !== 'todas' ? 1 : 0) +
    (casaFiltro !== 'todas' ? 1 : 0) +
    (freebetFiltro !== 'todas' ? 1 : 0) +
    (oddMin !== '' || oddMax !== '' ? 1 : 0);

  function exportarCSV() {
    const linhas = [
      [
        'id',
        'data',
        'resolvida_em',
        'formato',
        'status',
        'banca',
        'estrategia',
        'casa',
        'jogo',
        'liga',
        'tipo_aposta',
        'linha',
        'descricao_selecao',
        'odd_total',
        'stake',
        'freebet',
        'lucro',
      ].join(';'),
    ];
    for (const a of filtradas) {
      const partida = a.selecao_resumo?.partida;
      const jogo = partida
        ? `${partida.mandante ?? ''} x ${partida.visitante ?? ''}`
        : '';
      const row = [
        a.id,
        a.colocada_em,
        a.resolvida_em ?? '',
        a.formato,
        a.status,
        a.banca?.nome ?? '',
        a.estrategia?.nome ?? '',
        a.casa_de_aposta ?? '',
        jogo,
        partida?.liga_nome ?? '',
        a.selecao_resumo?.tipo_aposta_nome ?? '',
        a.selecao_resumo?.linha ?? '',
        a.selecao_resumo?.descricao ?? '',
        a.odd_total.toString().replace('.', ','),
        a.stake.toString().replace('.', ','),
        a.eh_freebet ? 'sim' : 'nao',
        a.lucro != null ? a.lucro.toString().replace('.', ',') : '',
      ].map((v) => {
        const s = String(v ?? '');
        return s.includes(';') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      });
      linhas.push(row.join(';'));
    }
    const csv = linhas.join('\n');
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    link.href = url;
    link.download = `apostas-${ts}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function abrirEdicao(id: string) {
    setCarregando(true);
    try {
      const detalhe = await obterDetalheAposta(id);
      if (detalhe) setEditing(detalhe);
    } finally {
      setCarregando(false);
    }
  }

  async function abrirResolucao(id: string) {
    setCarregando(true);
    try {
      const detalhe = await obterDetalheAposta(id);
      if (detalhe) setResolving(detalhe);
    } finally {
      setCarregando(false);
    }
  }

  function reabrir(id: string) {
    setReabrindoId(id);
    startReabrir(async () => {
      const r = await reabrirAposta(id);
      if (r.ok) {
        toast.success('Aposta reaberta.');
      } else {
        toast.error(r.message);
      }
      setReabrindoId(null);
    });
  }

  function confirmarExclusao() {
    if (!excluindo) return;
    startExcluir(async () => {
      const r = await excluirAposta(excluindo.id);
      if (r.ok) {
        toast.success('Aposta excluída.');
        setExcluindo(null);
      } else {
        toast.error(r.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border/70 bg-card/50 flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2 sm:p-2">
        <div className="relative w-full sm:min-w-[220px] sm:flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por time, estratégia, casa..."
            className="h-10 pl-8 sm:h-9"
          />
        </div>

        <Select
          value={statusFiltro}
          onValueChange={(v) => v && setStatusFiltro(v as StatusFiltro)}
          items={[
            { value: 'todas', label: 'Todos os status' },
            { value: 'pendentes', label: 'Pendentes' },
            { value: 'resolvidas', label: 'Resolvidas' },
          ]}
        >
          <SelectTrigger className="h-10 w-full justify-between sm:h-9 sm:w-[170px]">
            <SelectValue>
              {(v: string) =>
                v === 'todas'
                  ? 'Todos os status'
                  : v === 'pendentes'
                    ? 'Pendentes'
                    : 'Resolvidas'
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os status</SelectItem>
            <SelectItem value="pendentes">Pendentes</SelectItem>
            <SelectItem value="resolvidas">Resolvidas</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={estrategiaFiltro}
          onValueChange={(v) => v && setEstrategiaFiltro(v)}
          items={[
            { value: 'todas', label: 'Todas as estratégias' },
            ...options.estrategias.map((e) => ({ value: e.id, label: e.nome })),
          ]}
        >
          <SelectTrigger className="h-10 w-full justify-between sm:h-9 sm:w-[180px]">
            <SelectValue>
              {(v: string) =>
                v === 'todas'
                  ? 'Todas as estratégias'
                  : (options.estrategias.find((e) => e.id === v)?.nome ?? 'Estratégia')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as estratégias</SelectItem>
            {options.estrategias.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={bancaFiltro}
          onValueChange={(v) => v && setBancaFiltro(v)}
          items={[
            { value: 'todas', label: 'Todas as bancas' },
            ...options.bancas.map((b) => ({ value: b.id, label: b.nome })),
          ]}
        >
          <SelectTrigger className="h-10 w-full justify-between sm:h-9 sm:w-[170px]">
            <SelectValue>
              {(v: string) =>
                v === 'todas'
                  ? 'Todas as bancas'
                  : (options.bancas.find((b) => b.id === v)?.nome ?? 'Banca')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as bancas</SelectItem>
            {options.bancas.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={maisFiltrosAbertos} onOpenChange={setMaisFiltrosAbertos}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 shrink-0 gap-1.5 sm:h-9"
              >
                <Filter className="size-3.5" />
                Mais filtros
                {advancedFiltersCount > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-0.5 px-1.5 py-0 text-[10px]"
                  >
                    {advancedFiltersCount}
                  </Badge>
                )}
              </Button>
            }
          />
          <PopoverContent align="end" className="w-80 space-y-3 p-3">
            <div className="space-y-1">
              <label className="text-foreground text-xs font-medium">Formato</label>
              <div className="inline-flex w-full rounded-md border border-border/60 bg-muted/40 p-0.5">
                {(['todos', 'simples', 'multipla'] as const).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setFormatoFiltro(op)}
                    className={
                      'flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ' +
                      (formatoFiltro === op
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground')
                    }
                  >
                    {op === 'todos' ? 'Todos' : op === 'simples' ? 'Simples' : 'Múltipla'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-foreground text-xs font-medium">
                Tipo de aposta
              </label>
              <select
                value={tipoApostaFiltro}
                onChange={(e) => setTipoApostaFiltro(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="todos">Todos</option>
                {options.tipos_aposta.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-foreground text-xs font-medium">Liga</label>
              <select
                value={ligaFiltro}
                onChange={(e) => setLigaFiltro(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="todas">Todas</option>
                {options.ligas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-foreground text-xs font-medium">Casa</label>
              <select
                value={casaFiltro}
                onChange={(e) => setCasaFiltro(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="todas">Todas</option>
                {casasUnicas.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-foreground text-xs font-medium">
                  Odd mín.
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={oddMin}
                  onChange={(e) => setOddMin(e.target.value)}
                  placeholder="1.00"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-foreground text-xs font-medium">
                  Odd máx.
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={oddMax}
                  onChange={(e) => setOddMax(e.target.value)}
                  placeholder="—"
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-foreground text-xs font-medium">Freebet</label>
              <div className="inline-flex w-full rounded-md border border-border/60 bg-muted/40 p-0.5">
                {(['todas', 'sim', 'nao'] as const).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setFreebetFiltro(op)}
                    className={
                      'flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ' +
                      (freebetFiltro === op
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground')
                    }
                  >
                    {op === 'todas' ? 'Todas' : op === 'sim' ? 'Freebet' : 'Não freebet'}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={exportarCSV}
          disabled={filtradas.length === 0}
          className="h-10 shrink-0 gap-1.5 sm:h-9"
          title="Exportar apostas filtradas como CSV"
        >
          <Download className="size-3.5" />
          CSV
        </Button>

        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={limpar}
            className="h-10 shrink-0 gap-1.5 sm:h-9"
          >
            <X className="size-3.5" />
            Limpar
          </Button>
        )}
      </div>

      {filtradas.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-2 rounded-xl border py-12 text-center">
          <p className="text-foreground text-sm font-medium">
            Nenhuma aposta encontrada.
          </p>
          <p className="text-muted-foreground text-xs">
            Ajuste os filtros ou registre uma nova aposta.
          </p>
        </div>
      ) : (
        <>
          {/* Tabela em desktop */}
          <div className="border-border/70 hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Jogo</th>
                  <th className="px-3 py-2 text-left font-medium">Seleção</th>
                  <th className="px-3 py-2 text-left font-medium">Estratégia</th>
                  <th className="px-3 py-2 text-right font-medium">Odd</th>
                  <th className="px-3 py-2 text-right font-medium">Stake</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Data</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-border/60 divide-y">
                {filtradas.map((a) => (
                  <BetRow
                    key={a.id}
                    aposta={a}
                    onEdit={abrirEdicao}
                    onResolve={abrirResolucao}
                    onReopen={reabrir}
                    onDelete={() => setExcluindo(a)}
                    reabrindo={reabrindoPending && reabrindoId === a.id}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards em mobile */}
          <div className="grid gap-2 md:hidden">
            {filtradas.map((a) => (
              <BetCard
                key={a.id}
                aposta={a}
                onEdit={abrirEdicao}
                onResolve={abrirResolucao}
                onReopen={reabrir}
                onDelete={() => setExcluindo(a)}
                reabrindo={reabrindoPending && reabrindoId === a.id}
              />
            ))}
          </div>
        </>
      )}

      {carregando && (
        <div className="text-muted-foreground text-center text-xs">
          Carregando detalhes...
        </div>
      )}

      {editing && (
        <BetDialog
          options={options}
          aposta={editing}
          open={Boolean(editing)}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          trigger={null}
        />
      )}

      {resolving && (
        <BetResolveDialog
          aposta={resolving}
          open={Boolean(resolving)}
          onOpenChange={(open) => {
            if (!open) setResolving(null);
          }}
        />
      )}

      <Dialog
        open={Boolean(excluindo)}
        onOpenChange={(open) => !open && setExcluindo(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-500" />
              Excluir aposta?
            </DialogTitle>
            <DialogDescription className="text-pretty">
              Esta ação remove a aposta pendente e todas as seleções associadas.
              Não é reversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExcluindo(null)}
              disabled={excluindoPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarExclusao}
              disabled={excluindoPending}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Linha da tabela
// ---------------------------------------------------------------------------

function mapStatus(s: BetListItem['status']): Status {
  switch (s) {
    case 'ganha':
    case 'meio_green':
      return 'win';
    case 'perdida':
    case 'meio_red':
      return 'loss';
    case 'anulada':
      return 'void';
    case 'cashout':
      return 'cashout';
    case 'pendente':
    default:
      return 'pending';
  }
}

function statusLabel(s: BetListItem['status']) {
  const LABELS: Record<BetListItem['status'], string> = {
    pendente: 'Pendente',
    ganha: 'Green',
    perdida: 'Red',
    anulada: 'Anulada',
    cashout: 'Cashout',
    meio_green: 'Meio green',
    meio_red: 'Meio red',
  };
  return LABELS[s];
}

function BetRow({
  aposta,
  onEdit,
  onResolve,
  onReopen,
  onDelete,
  reabrindo,
}: {
  aposta: BetListItem;
  onEdit: (id: string) => void;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: () => void;
  reabrindo: boolean;
}) {
  const partida = aposta.selecao_resumo?.partida;
  const estrategiaCor = aposta.estrategia?.cor ?? null;

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {estrategiaCor && (
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: estrategiaCor }}
              aria-hidden
            />
          )}
          <div className="min-w-0">
            <div className="text-foreground truncate text-sm font-medium">
              {partida
                ? `${partida.mandante ?? '—'} × ${partida.visitante ?? '—'}`
                : '—'}
            </div>
            <div className="text-muted-foreground truncate text-xs">
              {partida?.liga_nome ?? '—'}
              {partida?.inicio ? ` · ${formatDateTime(partida.inicio)}` : ''}
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="text-foreground text-sm">
          {aposta.selecao_resumo?.descricao ?? '—'}
        </div>
        <div className="text-muted-foreground text-xs">
          {aposta.selecao_resumo?.tipo_aposta_nome ?? ''}
          {aposta.selecao_resumo?.linha
            ? ` · ${aposta.selecao_resumo.linha}`
            : ''}
        </div>
      </td>
      <td className="px-3 py-3 text-sm">
        {aposta.estrategia ? (
          <span className="inline-flex items-center gap-1.5">
            {aposta.estrategia_override && (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-700 dark:text-amber-300"
                title="Registrada fora do escopo (override)"
              >
                <Sparkles className="mr-0.5 size-3" />
                override
              </Badge>
            )}
            <span className="text-foreground truncate">{aposta.estrategia.nome}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">
        {aposta.odd_total.toFixed(2)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">
        {formatMoney(aposta.stake, aposta.banca?.moeda ?? 'BRL')}
        {aposta.eh_freebet && (
          <Badge variant="outline" className="ml-1.5 px-1 py-0 text-[10px]">
            freebet
          </Badge>
        )}
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={mapStatus(aposta.status)} label={statusLabel(aposta.status)} />
      </td>
      <td className="text-muted-foreground px-3 py-3 text-right text-xs whitespace-nowrap">
        {formatDateTime(aposta.colocada_em)}
      </td>
      <td className="px-2 py-3 text-right">
        <RowActions
          aposta={aposta}
          onEdit={onEdit}
          onResolve={onResolve}
          onReopen={onReopen}
          onDelete={onDelete}
          reabrindo={reabrindo}
        />
      </td>
    </tr>
  );
}

function BetCard({
  aposta,
  onEdit,
  onResolve,
  onReopen,
  onDelete,
  reabrindo,
}: {
  aposta: BetListItem;
  onEdit: (id: string) => void;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: () => void;
  reabrindo: boolean;
}) {
  const partida = aposta.selecao_resumo?.partida;
  return (
    <div className="border-border/70 bg-card space-y-2 rounded-xl border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-foreground truncate text-sm font-medium">
            {partida
              ? `${partida.mandante ?? '—'} × ${partida.visitante ?? '—'}`
              : '—'}
          </div>
          <div className="text-muted-foreground truncate text-xs">
            {aposta.selecao_resumo?.descricao ?? '—'}
          </div>
        </div>
        <StatusBadge
          status={mapStatus(aposta.status)}
          label={statusLabel(aposta.status)}
        />
      </div>
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="font-mono tabular-nums">
          Odd {aposta.odd_total.toFixed(2)}
        </span>
        <span>•</span>
        <span className="font-mono tabular-nums">
          {formatMoney(aposta.stake, aposta.banca?.moeda ?? 'BRL')}
        </span>
        {aposta.estrategia && (
          <>
            <span>•</span>
            <span className="text-foreground truncate">
              {aposta.estrategia.nome}
            </span>
          </>
        )}
      </div>
      <div className="border-border/60 flex items-center justify-between border-t pt-2">
        <span className="text-muted-foreground text-[11px]">
          {formatDateTime(aposta.colocada_em)}
        </span>
        <RowActions
          aposta={aposta}
          onEdit={onEdit}
          onResolve={onResolve}
          onReopen={onReopen}
          onDelete={onDelete}
          reabrindo={reabrindo}
        />
      </div>
    </div>
  );
}

function RowActions({
  aposta,
  onEdit,
  onResolve,
  onReopen,
  onDelete,
  reabrindo,
}: {
  aposta: BetListItem;
  onEdit: (id: string) => void;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: () => void;
  reabrindo: boolean;
}) {
  const { canWrite } = useUser();
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button size="icon-sm" variant="ghost" className="text-muted-foreground">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Ações</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-44 p-1">
        <Link
          href={`/bets/${aposta.id}`}
          className="hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
          onClick={() => setOpen(false)}
        >
          <ArrowUpRight className="size-4" />
          Abrir detalhe
        </Link>
        {aposta.status === 'pendente' ? (
          canWrite && (
          <>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onResolve(aposta.id);
              }}
              className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
            >
              <Target className="size-4" />
              Resolver
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit(aposta.id);
              }}
              className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
            >
              <Pencil className="size-4" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="hover:bg-destructive/10 text-destructive flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
            >
              <Trash2 className="size-4" />
              Excluir
            </button>
          </>
          )
        ) : (
          canWrite && (
          <button
            type="button"
            disabled={reabrindo}
            onClick={() => {
              setOpen(false);
              onReopen(aposta.id);
            }}
            className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm disabled:opacity-60"
          >
            <RotateCcw className="size-4" />
            {reabrindo ? 'Reabrindo…' : 'Reabrir'}
          </button>
          )
        )}
      </PopoverContent>
    </Popover>
  );
}
