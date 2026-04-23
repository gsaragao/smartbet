'use client';

import * as React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Minus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
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
import { Textarea } from '@/components/ui/textarea';
import {
  obterContextoResolucaoAction,
  resolverAposta,
} from '@/features/bets/actions';
import type { BetDetail, BetResolutionContext } from '@/features/bets/queries';
import {
  OPCOES_RESOLUCAO,
  simularResolucao,
  type StatusResolucao,
} from '@/features/bets/resolver';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

type Props = {
  aposta: BetDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved?: () => void;
};

const TONES: Record<StatusResolucao, string> = {
  ganha: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 data-[selected=true]:ring-2 data-[selected=true]:ring-emerald-500/50',
  meio_green:
    'border-emerald-500/30 bg-emerald-500/5 text-emerald-700/90 dark:text-emerald-300 data-[selected=true]:ring-2 data-[selected=true]:ring-emerald-500/40',
  perdida: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 data-[selected=true]:ring-2 data-[selected=true]:ring-rose-500/50',
  meio_red: 'border-rose-500/30 bg-rose-500/5 text-rose-700/90 dark:text-rose-300 data-[selected=true]:ring-2 data-[selected=true]:ring-rose-500/40',
  cashout: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300 data-[selected=true]:ring-2 data-[selected=true]:ring-sky-500/50',
  anulada: 'border-muted-foreground/30 bg-muted/40 text-foreground data-[selected=true]:ring-2 data-[selected=true]:ring-muted-foreground/40',
};

const ICONS: Record<StatusResolucao, React.ComponentType<{ className?: string }>> = {
  ganha: TrendingUp,
  meio_green: Sparkles,
  perdida: TrendingDown,
  meio_red: Minus,
  cashout: ArrowRight,
  anulada: XCircle,
};

export function BetResolveDialog({ aposta, open, onOpenChange, onResolved }: Props) {
  if (!open) return null;
  return (
    <BetResolveDialogInner
      aposta={aposta}
      open={open}
      onOpenChange={onOpenChange}
      onResolved={onResolved}
    />
  );
}

function BetResolveDialogInner({
  aposta,
  open,
  onOpenChange,
  onResolved,
}: Props) {
  const [status, setStatus] = React.useState<StatusResolucao>('ganha');
  const [retornoManual, setRetornoManual] = React.useState<string>('');
  const [observacao, setObservacao] = React.useState<string>('');
  const [contexto, setContexto] = React.useState<BetResolutionContext | null>(null);
  const [loadingCtx, setLoadingCtx] = React.useState(true);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    let cancelled = false;
    obterContextoResolucaoAction(aposta.id)
      .then((ctx) => {
        if (!cancelled) setContexto(ctx);
      })
      .finally(() => {
        if (!cancelled) setLoadingCtx(false);
      });
    return () => {
      cancelled = true;
    };
  }, [aposta.id]);

  const simulacao = React.useMemo(() => {
    const retornoReal =
      retornoManual.trim() !== '' && !Number.isNaN(Number(retornoManual))
        ? Number(retornoManual)
        : null;
    return simularResolucao({
      status,
      stake: aposta.stake,
      odd: aposta.odd_total,
      ehFreebet: aposta.eh_freebet,
      retornoReal,
    });
  }, [aposta.eh_freebet, aposta.odd_total, aposta.stake, retornoManual, status]);

  const moeda = contexto?.moeda ?? aposta.banca?.moeda ?? 'BRL';
  const novoSaldo =
    contexto != null ? contexto.saldo_atual_banca + simulacao.lucro : null;

  const onSubmit = () => {
    if (simulacao.editavel && retornoManual.trim() === '') {
      toast.error('Informe o retorno real do cashout.');
      return;
    }

    startTransition(async () => {
      const result = await resolverAposta({
        id: aposta.id,
        status,
        retorno_real: simulacao.editavel
          ? simulacao.retornoReal
          : simulacao.retornoReal,
        observacao,
      });
      if (result.ok) {
        toast.success('Aposta resolvida.');
        onResolved?.();
        onOpenChange(false);
        return;
      }
      toast.error(result.message);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,52rem)] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl sm:w-full">
        <div className="border-border/60 shrink-0 space-y-2 border-b px-5 pb-4 pt-5 pr-12 sm:px-6 sm:pr-14">
          <DialogHeader className="gap-2 space-y-0">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Resolver aposta
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed text-pretty">
              Escolha o resultado final. O saldo da banca e o progresso da estratégia
              são atualizados automaticamente em uma única transação.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {/* Resumo da aposta */}
          <div className="border-border/60 bg-muted/30 rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-foreground font-medium">
                {aposta.selecao_resumo?.descricao ?? '—'}
              </span>
              <Badge variant="outline" className="font-mono tabular-nums">
                Odd {aposta.odd_total.toFixed(2)}
              </Badge>
              <Badge variant="outline" className="font-mono tabular-nums">
                {formatMoney(aposta.stake, moeda)}
              </Badge>
              {aposta.eh_freebet && (
                <Badge variant="outline">
                  <Sparkles className="mr-1 size-3" />
                  Freebet
                </Badge>
              )}
            </div>
          </div>

          {/* Seletor de status */}
          <div>
            <label className="text-foreground mb-2 block text-xs font-medium uppercase tracking-wider">
              Resultado
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {OPCOES_RESOLUCAO.map((opt) => {
                const Icon = ICONS[opt.value];
                const selected = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-selected={selected}
                    onClick={() => setStatus(opt.value)}
                    className={cn(
                      'group flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                      'hover:border-current/60',
                      TONES[opt.value],
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <Icon className="size-4" />
                      {opt.label}
                    </div>
                    <p className="text-[11px] opacity-80">{opt.descricao}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Retorno real (editável quando cashout) */}
          {simulacao.editavel && (
            <div>
              <label className="text-foreground mb-2 block text-xs font-medium uppercase tracking-wider">
                Retorno real do cashout
              </label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={retornoManual}
                onChange={(e) => setRetornoManual(e.target.value)}
                placeholder="Ex: 85.50"
                className="font-mono tabular-nums"
              />
              <p className="text-muted-foreground mt-1 text-[11px]">
                Informe o valor bruto recebido da casa (inclui stake).
              </p>
            </div>
          )}

          {/* Preview de impacto */}
          <PreviewImpacto
            simulacao={{
              retornoReal: simulacao.retornoReal,
              lucro: simulacao.lucro,
            }}
            contexto={contexto}
            loadingCtx={loadingCtx}
            moeda={moeda}
            novoSaldo={novoSaldo}
            status={status}
          />

          {/* Observação */}
          <div>
            <label className="text-foreground mb-2 block text-xs font-medium uppercase tracking-wider">
              Observação <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: casa pagou cashout por atraso."
              className="min-h-[3.5rem] resize-y rounded-lg"
            />
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 mt-auto shrink-0 gap-2 rounded-b-xl border-t border-border/60 bg-muted/40 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Confirmar resolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewImpacto({
  simulacao,
  contexto,
  loadingCtx,
  moeda,
  novoSaldo,
  status,
}: {
  simulacao: { retornoReal: number; lucro: number };
  contexto: BetResolutionContext | null;
  loadingCtx: boolean;
  moeda: string;
  novoSaldo: number | null;
  status: StatusResolucao;
}) {
  const positivo = simulacao.lucro > 0;
  const negativo = simulacao.lucro < 0;

  return (
    <div className="border-border/60 bg-card rounded-lg border">
      <div className="border-border/60 flex items-center gap-2 border-b px-3 py-2">
        <AlertTriangle className="text-muted-foreground size-3.5" />
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Preview do impacto
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3">
        <ImpactoCell
          icon={Wallet}
          label="Retorno real"
          value={formatMoney(simulacao.retornoReal, moeda)}
        />
        <ImpactoCell
          icon={positivo ? TrendingUp : negativo ? TrendingDown : Minus}
          label="Lucro"
          value={formatMoney(simulacao.lucro, moeda)}
          tone={positivo ? 'pos' : negativo ? 'neg' : 'neutral'}
        />
        <ImpactoCell
          icon={Wallet}
          label="Novo saldo da banca"
          value={
            loadingCtx
              ? '...'
              : novoSaldo != null
                ? formatMoney(novoSaldo, moeda)
                : '—'
          }
          tone={
            novoSaldo != null && contexto != null
              ? novoSaldo > contexto.saldo_atual_banca
                ? 'pos'
                : novoSaldo < contexto.saldo_atual_banca
                  ? 'neg'
                  : 'neutral'
              : 'neutral'
          }
          hint={
            contexto != null
              ? `atual ${formatMoney(contexto.saldo_atual_banca, moeda)}`
              : undefined
          }
        />
      </div>

      {contexto?.progresso && (
        <div className="border-border/60 grid grid-cols-1 gap-3 border-t px-3 py-3 sm:grid-cols-3">
          <ImpactoCell
            icon={Target}
            label="Passo (antes → depois)"
            value={`${contexto.progresso.passo_atual} → ${proximoPasso(status, contexto.progresso.passo_atual)}`}
            mono
          />
          <ImpactoCell
            icon={TrendingUp}
            label="Greens consec"
            value={`${contexto.progresso.greens_consecutivos} → ${proximosGreens(status, contexto.progresso.greens_consecutivos)}`}
            mono
          />
          <ImpactoCell
            icon={TrendingDown}
            label="Reds consec"
            value={`${contexto.progresso.reds_consecutivos} → ${proximosReds(status, contexto.progresso.reds_consecutivos)}`}
            mono
          />
        </div>
      )}
    </div>
  );
}

function proximoPasso(status: StatusResolucao, atual: number) {
  // Projeção leve só como UX: o recálculo real ocorre na RPC.
  if (status === 'ganha' || status === 'meio_green') return 1;
  if (status === 'perdida' || status === 'meio_red') return atual + 1;
  return atual;
}

function proximosGreens(status: StatusResolucao, atual: number) {
  if (status === 'ganha' || status === 'meio_green') return atual + 1;
  if (status === 'perdida' || status === 'meio_red') return 0;
  return atual;
}

function proximosReds(status: StatusResolucao, atual: number) {
  if (status === 'perdida' || status === 'meio_red') return atual + 1;
  if (status === 'ganha' || status === 'meio_green') return 0;
  return atual;
}

function ImpactoCell({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
  mono,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: 'pos' | 'neg' | 'neutral';
  mono?: boolean;
  hint?: string;
}) {
  const toneClass =
    tone === 'pos'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'neg'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-foreground';
  return (
    <div className="flex flex-col gap-1">
      <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider">
        <Icon className="size-3" />
        {label}
      </div>
      <div
        className={cn(
          'text-sm font-semibold',
          mono && 'font-mono tabular-nums',
          toneClass,
        )}
      >
        {value}
      </div>
      {hint && <div className="text-muted-foreground text-[10px]">{hint}</div>}
    </div>
  );
}
