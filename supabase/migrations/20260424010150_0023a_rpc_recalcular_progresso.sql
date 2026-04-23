-- =============================================================================
-- Smart Bet · 0024 · RPC fn_recalcular_progresso_estrategia
-- =============================================================================
-- Contexto:
--   `estrategias_progresso` guarda um snapshot do estado dinâmico da
--   estratégia (passo atual, streaks, totais, lucro acumulado, última
--   aposta em). Em vez de fazer updates incrementais a cada resolução
--   (frágil em caso de reabrir/excluir), recalculamos TUDO a partir das
--   apostas resolvidas em ordem cronológica.
--
--   `passo_atual`:
--     - Se estrategia.metodo_stake = 'progressao':
--         * zera no green
--         * +1 a cada red
--     - Caso contrário: 0 (não aplicável).
--
--   Streaks:
--     - greens_consecutivos: greens seguidos até a última aposta.
--     - reds_consecutivos: reds seguidos até a última aposta.
--
--   Obs.: meio_green conta como green; meio_red conta como red; anulada e
--   cashout não alteram a contagem de streak mas entram no total (cashout
--   participa do lucro).
-- =============================================================================

create or replace function public.fn_recalcular_progresso_estrategia(p_estrategia_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id             uuid;
  v_metodo              public.metodo_stake;
  v_total               int := 0;
  v_greens              int := 0;
  v_reds                int := 0;
  v_lucro               numeric(14,2) := 0;
  v_greens_consec       int := 0;
  v_reds_consec         int := 0;
  v_passo               int := 0;
  v_ultima              timestamptz;
  r                     record;
begin
  select usuario_id, metodo_stake
    into v_user_id, v_metodo
    from public.estrategias
   where id = p_estrategia_id;

  if v_user_id is null then
    return;
  end if;

  -- Zera o contador de streak cada vez que troca o "tipo" da resolução.
  for r in
    select status, lucro, resolvida_em
      from public.apostas
     where estrategia_id = p_estrategia_id
       and status <> 'pendente'
     order by resolvida_em asc
  loop
    v_total := v_total + 1;
    v_ultima := r.resolvida_em;
    if r.lucro is not null then
      v_lucro := v_lucro + r.lucro;
    end if;

    if r.status in ('ganha', 'meio_green') then
      v_greens := v_greens + 1;
      v_greens_consec := v_greens_consec + 1;
      v_reds_consec := 0;
      if v_metodo = 'progressao' then
        v_passo := 0;
      end if;
    elsif r.status in ('perdida', 'meio_red') then
      v_reds := v_reds + 1;
      v_reds_consec := v_reds_consec + 1;
      v_greens_consec := 0;
      if v_metodo = 'progressao' then
        v_passo := v_passo + 1;
      end if;
    else
      -- anulada / cashout: não altera streaks nem passo.
      null;
    end if;
  end loop;

  insert into public.estrategias_progresso (
    estrategia_id,
    usuario_id,
    passo_atual,
    reds_consecutivos,
    greens_consecutivos,
    total_apostas,
    total_greens,
    total_reds,
    lucro_acumulado,
    ultima_aposta_em
  )
  values (
    p_estrategia_id,
    v_user_id,
    v_passo,
    v_reds_consec,
    v_greens_consec,
    v_total,
    v_greens,
    v_reds,
    v_lucro,
    v_ultima
  )
  on conflict (estrategia_id) do update
    set passo_atual          = excluded.passo_atual,
        reds_consecutivos    = excluded.reds_consecutivos,
        greens_consecutivos  = excluded.greens_consecutivos,
        total_apostas        = excluded.total_apostas,
        total_greens         = excluded.total_greens,
        total_reds           = excluded.total_reds,
        lucro_acumulado      = excluded.lucro_acumulado,
        ultima_aposta_em     = excluded.ultima_aposta_em;
end;
$$;

revoke all on function public.fn_recalcular_progresso_estrategia(uuid) from public;

comment on function public.fn_recalcular_progresso_estrategia(uuid) is
  'Recalcula (do zero) o snapshot em estrategias_progresso a partir das apostas resolvidas em ordem cronológica.';
