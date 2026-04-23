import type { Database } from '@/types/supabase';

export type StatusResolucao = Extract<
  Database['public']['Enums']['status_aposta'],
  'ganha' | 'perdida' | 'anulada' | 'cashout' | 'meio_green' | 'meio_red'
>;

export const OPCOES_RESOLUCAO: Array<{
  value: StatusResolucao;
  label: string;
  descricao: string;
  tone: 'pos' | 'neg' | 'neutral' | 'half';
}> = [
  {
    value: 'ganha',
    label: 'Green',
    descricao: 'Aposta vencedora — recebe odd × stake.',
    tone: 'pos',
  },
  {
    value: 'meio_green',
    label: 'Meio Green',
    descricao: 'Parcial: metade verde, metade devolvida.',
    tone: 'half',
  },
  {
    value: 'perdida',
    label: 'Red',
    descricao: 'Perdida — stake é zerada (freebet não afeta o caixa).',
    tone: 'neg',
  },
  {
    value: 'meio_red',
    label: 'Meio Red',
    descricao: 'Parcial: metade do stake devolvida.',
    tone: 'half',
  },
  {
    value: 'cashout',
    label: 'Cashout',
    descricao: 'Encerrada antes — informe o retorno realmente recebido.',
    tone: 'neutral',
  },
  {
    value: 'anulada',
    label: 'Anulada',
    descricao: 'Void — stake devolvida, sem lucro nem prejuízo.',
    tone: 'neutral',
  },
];

export type ResolucaoSimulacao = {
  /** Valor recebido de volta pela casa. */
  retornoReal: number;
  /** Variação de saldo na banca (positivo → green). */
  lucro: number;
  /** Se o usuário deve editar manualmente o retorno (cashout). */
  editavel: boolean;
};

/**
 * Calcula retorno_real e lucro para um status de resolução, espelhando
 * a lógica de `fn_resolver_aposta`. Mantém as duas em sincronia via testes
 * manuais — ver supabase/migrations/...0023_rpc_resolver_aposta.sql.
 */
export function simularResolucao(params: {
  status: StatusResolucao;
  stake: number;
  odd: number;
  ehFreebet: boolean;
  retornoReal?: number | null;
}): ResolucaoSimulacao {
  const { status, stake, odd, ehFreebet, retornoReal } = params;

  const round2 = (n: number) => Math.round(n * 100) / 100;

  switch (status) {
    case 'ganha': {
      const retorno = round2(stake * odd);
      const lucro = ehFreebet ? round2(retorno - stake) : round2(retorno - stake);
      return { retornoReal: retorno, lucro, editavel: false };
    }

    case 'perdida': {
      return {
        retornoReal: 0,
        lucro: ehFreebet ? 0 : -stake,
        editavel: false,
      };
    }

    case 'meio_green': {
      const retorno = round2(stake + (stake * (odd - 1)) / 2);
      return { retornoReal: retorno, lucro: round2(retorno - stake), editavel: false };
    }

    case 'meio_red': {
      const retorno = round2(stake / 2);
      return { retornoReal: retorno, lucro: round2(retorno - stake), editavel: false };
    }

    case 'anulada':
      return { retornoReal: stake, lucro: 0, editavel: false };

    case 'cashout': {
      const r =
        typeof retornoReal === 'number' && Number.isFinite(retornoReal)
          ? retornoReal
          : stake;
      return { retornoReal: r, lucro: round2(r - stake), editavel: true };
    }
  }
}
