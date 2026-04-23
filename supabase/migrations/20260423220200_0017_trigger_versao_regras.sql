-- =============================================================================
-- Smart Bet · 0017 · Versionamento de regras das estratégias
-- -----------------------------------------------------------------------------
-- Toda vez que `regras_jsonb` muda, queremos:
--   1) Congelar a versão anterior em `estrategias_regras_versoes` (com
--      `vigente_ate = now()`).
--   2) Incrementar `regras_versao` na linha da estratégia.
--   3) Inserir uma nova linha vigente (vigente_desde = now(), vigente_ate = null).
-- Assim temos histórico auditável e podemos, no futuro, comparar performance
-- por versão ou voltar atrás.
-- Inserts de estratégia também criam a versão 1 inicial.
-- =============================================================================

create table if not exists public.estrategias_regras_versoes (
  id              bigserial primary key,
  estrategia_id   uuid        not null references public.estrategias(id) on delete cascade,
  usuario_id      uuid        not null references public.perfis(id)     on delete cascade,
  versao_num      smallint    not null,
  regras_jsonb    jsonb       not null,
  vigente_desde   timestamptz not null default now(),
  vigente_ate     timestamptz,
  unique (estrategia_id, versao_num)
);

comment on table public.estrategias_regras_versoes is
  'Histórico imutável de versões do `regras_jsonb` de cada estratégia.';

create index if not exists ix_estrategias_regras_versoes_estrategia
  on public.estrategias_regras_versoes(estrategia_id);

create index if not exists ix_estrategias_regras_versoes_usuario
  on public.estrategias_regras_versoes(usuario_id);

alter table public.estrategias_regras_versoes enable  row level security;
alter table public.estrategias_regras_versoes force   row level security;

drop policy if exists estrategias_regras_versoes_select on public.estrategias_regras_versoes;
drop policy if exists estrategias_regras_versoes_insert on public.estrategias_regras_versoes;

create policy estrategias_regras_versoes_select on public.estrategias_regras_versoes
  for select to authenticated
  using ( (select auth.uid()) = usuario_id );

-- Só o trigger (security definer) insere — mas deixamos uma policy permissiva
-- por `authenticated` para não bloquear operações do próprio dono caso algum
-- dia façamos backfill manual via Server Action.
create policy estrategias_regras_versoes_insert on public.estrategias_regras_versoes
  for insert to authenticated
  with check ( (select auth.uid()) = usuario_id );

-- Não expomos policy de update/delete — o histórico é imutável.

-- -----------------------------------------------------------------------------
-- Trigger: gera versão 1 após INSERT de estratégia
-- -----------------------------------------------------------------------------
create or replace function public.fn_trg_estrategias_versao_inicial()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.estrategias_regras_versoes (
    estrategia_id, usuario_id, versao_num, regras_jsonb, vigente_desde
  ) values (
    new.id, new.usuario_id, 1, new.regras_jsonb, now()
  );
  return new;
end;
$$;

revoke all on function public.fn_trg_estrategias_versao_inicial() from public;

drop trigger if exists trg_estrategias_versao_inicial on public.estrategias;

create trigger trg_estrategias_versao_inicial
  after insert on public.estrategias
  for each row
  execute function public.fn_trg_estrategias_versao_inicial();

-- -----------------------------------------------------------------------------
-- Trigger: se `regras_jsonb` muda no UPDATE, incrementa versão e arquiva a anterior.
-- Importante: o trigger modifica NEW.regras_versao ANTES do UPDATE persistir.
-- -----------------------------------------------------------------------------
create or replace function public.fn_trg_estrategias_versao_regras()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_nova_versao smallint;
begin
  if new.regras_jsonb is distinct from old.regras_jsonb then
    v_nova_versao := coalesce(old.regras_versao, 1) + 1;

    -- fecha a versão anterior
    update public.estrategias_regras_versoes
       set vigente_ate = now()
     where estrategia_id = new.id
       and vigente_ate is null;

    -- registra a nova versão
    insert into public.estrategias_regras_versoes (
      estrategia_id, usuario_id, versao_num, regras_jsonb, vigente_desde
    ) values (
      new.id, new.usuario_id, v_nova_versao, new.regras_jsonb, now()
    );

    new.regras_versao := v_nova_versao;
  end if;

  return new;
end;
$$;

revoke all on function public.fn_trg_estrategias_versao_regras() from public;

drop trigger if exists trg_estrategias_versao_regras on public.estrategias;

create trigger trg_estrategias_versao_regras
  before update on public.estrategias
  for each row
  execute function public.fn_trg_estrategias_versao_regras();
