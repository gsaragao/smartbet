-- =============================================================================
-- Smart Bet · 0023 · RPC fn_resolver_aposta (resolve aposta em 1 transação)
-- =============================================================================
-- Contexto:
--   Ao clicar em "Resolver" no BetDialog, precisamos em UMA transação:
--     1. Atualizar `apostas` (status, lucro, retorno_real, resolvida_em).
--     2. Atualizar `apostas_selecoes.status` (em S1 = simples, são 1:1 com
--        o status da aposta). Em S3 múltiplas precisarão de outra lógica.
--     3. Inserir 1 `eventos_banca` do tipo 'aposta' com `valor = lucro`
--        (exceto `anulada`, que não lança evento).
--     4. Recalcular `estrategias_progresso` (delegado à fn_recalcular_progresso).
--   O trigger `trg_eventos_banca_recalc` (migration 0011) atualiza
--   `bancas.saldo_atual` automaticamente após o insert em eventos_banca.
--
--   Convenções:
--     * `retorno_real` é o retorno BRUTO da aposta (em freebet, exclui o
--       stake). Caller passa explicitamente ou null — a função calcula o
--       default baseado no status se vier null.
--     * `lucro = retorno_real - stake` (com ajuste para freebet).
--     * `anulada`: lucro = 0, retorno_real = stake (aposta pagou o stake de
--       volta), mas não lançamos evento porque o líquido é zero.
-- =============================================================================

create or replace function public.fn_resolver_aposta(
  p_aposta_id uuid,
  p_status    public.status_aposta,
  p_retorno_real numeric default null,
  p_observacao text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id       uuid := auth.uid();
  v_aposta        public.apostas%rowtype;
  v_retorno_real  numeric(14,2);
  v_lucro         numeric(14,2);
  v_evento_id     uuid;
begin
  if v_user_id is null then
    raise exception 'Não autenticado.' using errcode = '28000';
  end if;

  if p_status = 'pendente' then
    raise exception 'Use fn_reabrir_aposta para reabrir (não resolva para pendente).'
      using errcode = '22023';
  end if;

  select * into v_aposta
    from public.apostas
   where id = p_aposta_id and usuario_id = v_user_id
   for update;

  if not found then
    raise exception 'Aposta não encontrada.' using errcode = '23503';
  end if;

  if v_aposta.status <> 'pendente' then
    raise exception 'Aposta já está resolvida (status = %).', v_aposta.status
      using errcode = '22023';
  end if;

  -- Cálculo do retorno/lucro baseado no status.
  if p_status = 'ganha' then
    v_retorno_real := coalesce(p_retorno_real, round(v_aposta.stake * v_aposta.odd_total, 2));
    if v_aposta.eh_freebet then
      -- Freebet: o stake NÃO volta, só o lucro bruto (retorno - stake).
      v_lucro := round(v_retorno_real - v_aposta.stake, 2);
    else
      v_lucro := round(v_retorno_real - v_aposta.stake, 2);
    end if;

  elsif p_status = 'perdida' then
    v_retorno_real := 0;
    if v_aposta.eh_freebet then
      -- Freebet perdida não custa nada ao caixa.
      v_lucro := 0;
    else
      v_lucro := -v_aposta.stake;
    end if;

  elsif p_status = 'meio_green' then
    -- Reembolso parcial positivo: ex.: Asian 0.5 meio vitória.
    v_retorno_real := coalesce(
      p_retorno_real,
      round(v_aposta.stake + (v_aposta.stake * (v_aposta.odd_total - 1) / 2), 2)
    );
    v_lucro := round(v_retorno_real - v_aposta.stake, 2);

  elsif p_status = 'meio_red' then
    -- Reembolso parcial: metade do stake volta.
    v_retorno_real := coalesce(p_retorno_real, round(v_aposta.stake / 2, 2));
    v_lucro := round(v_retorno_real - v_aposta.stake, 2);

  elsif p_status = 'anulada' then
    -- Stake retorna integralmente; lucro zero, sem evento de banca.
    v_retorno_real := v_aposta.stake;
    v_lucro := 0;

  elsif p_status = 'cashout' then
    if p_retorno_real is null then
      raise exception 'Cashout exige retorno_real explícito.' using errcode = '22023';
    end if;
    v_retorno_real := p_retorno_real;
    v_lucro := round(v_retorno_real - v_aposta.stake, 2);

  else
    raise exception 'Status inválido: %', p_status using errcode = '22023';
  end if;

  update public.apostas
     set status       = p_status,
         retorno_real = v_retorno_real,
         lucro        = v_lucro,
         resolvida_em = now(),
         observacao   = coalesce(p_observacao, observacao)
   where id = p_aposta_id;

  update public.apostas_selecoes
     set status = p_status
   where aposta_id = p_aposta_id;

  -- Lança evento de banca (exceto quando lucro = 0 → anulada ou freebet perdida).
  if v_lucro <> 0 then
    insert into public.eventos_banca (
      banca_id,
      usuario_id,
      tipo,
      valor,
      observacao,
      ocorrido_em
    )
    values (
      v_aposta.banca_id,
      v_user_id,
      'aposta',
      v_lucro,
      concat('Resolução aposta ', p_aposta_id::text, ' (', p_status::text, ')'),
      now()
    )
    returning id into v_evento_id;
  end if;

  if v_aposta.estrategia_id is not null then
    perform public.fn_recalcular_progresso_estrategia(v_aposta.estrategia_id);
  end if;

  return p_aposta_id;
end;
$$;

revoke all on function public.fn_resolver_aposta(uuid, public.status_aposta, numeric, text) from public;
grant execute on function public.fn_resolver_aposta(uuid, public.status_aposta, numeric, text) to authenticated;

comment on function public.fn_resolver_aposta(uuid, public.status_aposta, numeric, text) is
  'Resolve uma aposta pendente: atualiza apostas, seleções, lança evento_banca e recalcula progresso.';
