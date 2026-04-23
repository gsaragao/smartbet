-- =============================================================================
-- Smart Bet · 0011 · Trigger para manter bancas.saldo_atual sincronizado
-- =============================================================================
-- Contexto:
--   A tabela `eventos_banca` registra depósitos, saques, ajustes e o valor
--   inicial. Queremos que `bancas.saldo_atual` reflita SEMPRE:
--       saldo_atual = saldo_inicial + soma(valor) dos eventos financeiros
--   onde `saldo_inicial` (tipo de evento) é ignorado no somatório, pois o
--   saldo inicial já vive em `bancas.saldo_inicial`.
--
-- Convenções:
--   • deposito : valor > 0
--   • saque    : valor < 0
--   • ajuste   : valor <> 0 (pode ser positivo ou negativo)
--
-- Aplicamos CHECK constraints para impedir inserções inconsistentes pelo
-- cliente. A Server Action normaliza o sinal do saque, mas o banco é a
-- última linha de defesa.
-- =============================================================================

alter table public.eventos_banca
  drop constraint if exists chk_eventos_banca_sinal_por_tipo;

alter table public.eventos_banca
  add constraint chk_eventos_banca_sinal_por_tipo
  check (
    (tipo = 'deposito'      and valor > 0)
    or (tipo = 'saque'      and valor < 0)
    or (tipo = 'ajuste'     and valor <> 0)
    or (tipo = 'saldo_inicial' and valor >= 0)
  );

-- ---------------------------------------------------------------------------
-- Recalcula o saldo_atual de uma banca a partir da soma dos eventos
-- financeiros (ignorando o evento `saldo_inicial`).
-- ---------------------------------------------------------------------------
create or replace function public.fn_recalcular_saldo_banca(p_banca_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_saldo_inicial numeric(14,2);
  v_total_eventos numeric(14,2);
begin
  select saldo_inicial
    into v_saldo_inicial
    from public.bancas
   where id = p_banca_id;

  if v_saldo_inicial is null then
    return;
  end if;

  select coalesce(sum(valor), 0)
    into v_total_eventos
    from public.eventos_banca
   where banca_id = p_banca_id
     and tipo <> 'saldo_inicial';

  update public.bancas
     set saldo_atual    = v_saldo_inicial + v_total_eventos,
         atualizado_em  = now()
   where id = p_banca_id;
end;
$$;

revoke all on function public.fn_recalcular_saldo_banca(uuid) from public;

-- ---------------------------------------------------------------------------
-- Trigger function: reage a INSERT/UPDATE/DELETE em eventos_banca.
-- Em UPDATE que muda banca_id, recalcula as duas bancas envolvidas.
-- ---------------------------------------------------------------------------
create or replace function public.fn_trg_eventos_banca_recalc()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.fn_recalcular_saldo_banca(new.banca_id);
    return new;
  elsif (tg_op = 'UPDATE') then
    if (old.banca_id is distinct from new.banca_id) then
      perform public.fn_recalcular_saldo_banca(old.banca_id);
    end if;
    perform public.fn_recalcular_saldo_banca(new.banca_id);
    return new;
  elsif (tg_op = 'DELETE') then
    perform public.fn_recalcular_saldo_banca(old.banca_id);
    return old;
  end if;
  return null;
end;
$$;

revoke all on function public.fn_trg_eventos_banca_recalc() from public;

drop trigger if exists trg_eventos_banca_recalc on public.eventos_banca;
create trigger trg_eventos_banca_recalc
  after insert or update or delete on public.eventos_banca
  for each row
  execute function public.fn_trg_eventos_banca_recalc();

-- ---------------------------------------------------------------------------
-- Também recalcula quando `bancas.saldo_inicial` muda (edição admin).
-- ---------------------------------------------------------------------------
create or replace function public.fn_trg_bancas_recalc_saldo_inicial()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if (old.saldo_inicial is distinct from new.saldo_inicial) then
    perform public.fn_recalcular_saldo_banca(new.id);
  end if;
  return new;
end;
$$;

revoke all on function public.fn_trg_bancas_recalc_saldo_inicial() from public;

drop trigger if exists trg_bancas_recalc_saldo_inicial on public.bancas;
create trigger trg_bancas_recalc_saldo_inicial
  after update on public.bancas
  for each row
  execute function public.fn_trg_bancas_recalc_saldo_inicial();
