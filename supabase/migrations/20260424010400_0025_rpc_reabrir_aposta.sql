-- =============================================================================
-- Smart Bet · 0025 · RPC fn_reabrir_aposta
-- =============================================================================
-- Contexto:
--   Permite voltar uma aposta resolvida para 'pendente'. Usamos isso quando
--   o usuário registrou o status errado, ou quando a casa reverteu a aposta.
--
--   Implementação:
--     1. Apaga o(s) evento(s) de banca do tipo 'aposta' associados a essa
--        aposta (identificados pela observação com o UUID da aposta). O
--        trigger em 0011 recalcula o saldo da banca automaticamente.
--     2. Zera `status`, `lucro`, `retorno_real`, `resolvida_em` em apostas
--        e selecoes.
--     3. Recalcula `estrategias_progresso` se houver estratégia vinculada.
--
--   Alternativa considerada: lançar um evento compensatório negativo em vez
--   de deletar. Descartada porque polui o extrato do usuário com ruído que
--   não existe conceitualmente ("o evento nunca deveria ter existido").
-- =============================================================================

create or replace function public.fn_reabrir_aposta(p_aposta_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id     uuid := auth.uid();
  v_aposta      public.apostas%rowtype;
begin
  if v_user_id is null then
    raise exception 'Não autenticado.' using errcode = '28000';
  end if;

  select * into v_aposta
    from public.apostas
   where id = p_aposta_id and usuario_id = v_user_id
   for update;

  if not found then
    raise exception 'Aposta não encontrada.' using errcode = '23503';
  end if;

  if v_aposta.status = 'pendente' then
    raise exception 'Aposta já está pendente.' using errcode = '22023';
  end if;

  -- Remove evento(s) de banca gerados por esta aposta.
  delete from public.eventos_banca
   where usuario_id = v_user_id
     and tipo = 'aposta'
     and observacao like '%' || p_aposta_id::text || '%';

  update public.apostas
     set status       = 'pendente',
         retorno_real = null,
         lucro        = null,
         resolvida_em = null
   where id = p_aposta_id;

  update public.apostas_selecoes
     set status = 'pendente'
   where aposta_id = p_aposta_id;

  if v_aposta.estrategia_id is not null then
    perform public.fn_recalcular_progresso_estrategia(v_aposta.estrategia_id);
  end if;

  return p_aposta_id;
end;
$$;

revoke all on function public.fn_reabrir_aposta(uuid) from public;
grant execute on function public.fn_reabrir_aposta(uuid) to authenticated;

comment on function public.fn_reabrir_aposta(uuid) is
  'Reverte uma aposta resolvida para pendente: apaga evento de banca e recalcula progresso.';
