-- =============================================================================
-- Smart Bet · 0001 · Base (extensoes, enums e utilitarios)
-- -----------------------------------------------------------------------------
-- Esta migration prepara o terreno para todas as demais:
--   * extensoes necessarias (citext para e-mails/slugs, pgcrypto para gen_random_uuid)
--   * enums de dominio (status, metodos, tipos) que serao reutilizados
--   * funcao utilitaria de atualizado_em (trigger) com search_path travado
-- =============================================================================

create extension if not exists citext;
create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'papel_usuario') then
    create type public.papel_usuario as enum ('admin', 'usuario');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'status_aposta') then
    create type public.status_aposta as enum (
      'pendente',
      'ganha',
      'perdida',
      'anulada',
      'cashout',
      'meio_green',
      'meio_red'
    );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'metodo_stake') then
    create type public.metodo_stake as enum (
      'fixo',
      'percentual',
      'progressao',
      'kelly',
      'livre'
    );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_evento_banca') then
    create type public.tipo_evento_banca as enum (
      'deposito',
      'saque',
      'ajuste',
      'saldo_inicial'
    );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'formato_aposta') then
    create type public.formato_aposta as enum (
      'simples',
      'multipla',
      'sistema'
    );
  end if;
end$$;

create or replace function public.fn_atualizado_em()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

comment on function public.fn_atualizado_em is
  'Trigger helper: preenche automaticamente a coluna atualizado_em antes de UPDATE.';
