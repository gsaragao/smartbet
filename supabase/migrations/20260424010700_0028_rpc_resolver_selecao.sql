-- =============================================================================
-- Smart Bet · 0028 · RPC fn_resolver_selecao (resolução por seleção em múltipla)
-- =============================================================================
-- Em apostas múltiplas, cada seleção pode ser resolvida individualmente. O
-- trigger fn_trg_apostas_recalcular_status (0026) recalcula o status agregado
-- da aposta pai, atualiza retorno_real/lucro e lança evento_banca quando o
-- estado se fecha.
--
-- Esta RPC é a porta de entrada segura do frontend para resolver uma seleção
-- individual. Para apostas simples, continua sendo usada a fn_resolver_aposta.
-- =============================================================================

create or replace function public.fn_resolver_selecao(
  p_selecao_id uuid,
  p_status     public.status_aposta
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_sel     public.apostas_selecoes%rowtype;
begin
  if v_user_id is null then
    raise exception 'Não autenticado.' using errcode = '28000';
  end if;

  if p_status = 'pendente' then
    raise exception 'Use fn_reabrir_selecao para voltar a pendente.' using errcode = '22023';
  end if;

  select * into v_sel
    from public.apostas_selecoes
   where id = p_selecao_id and usuario_id = v_user_id;

  if not found then
    raise exception 'Seleção não encontrada.' using errcode = '23503';
  end if;

  update public.apostas_selecoes
     set status = p_status
   where id = p_selecao_id;

  return p_selecao_id;
end;
$$;

revoke all on function public.fn_resolver_selecao(uuid, public.status_aposta) from public;
grant execute on function public.fn_resolver_selecao(uuid, public.status_aposta) to authenticated;

comment on function public.fn_resolver_selecao(uuid, public.status_aposta) is
  'Atualiza status de uma seleção individual (útil para apostas múltiplas).';
