-- =============================================================================
-- Smart Bet · 0006 · Apostas, selecoes e view de resumo
-- =============================================================================

create table if not exists public.apostas (
  id                    uuid primary key default gen_random_uuid(),
  usuario_id            uuid not null references public.perfis(id) on delete cascade,
  banca_id              uuid not null references public.bancas(id) on delete restrict,
  estrategia_id         uuid references public.estrategias(id) on delete set null,
  formato               public.formato_aposta not null default 'simples',
  descricao             text,
  stake                 numeric(14,2) not null,
  odd_total             numeric(10,3) not null,
  retorno_potencial     numeric(14,2)
                          generated always as (round(stake * odd_total, 2)) stored,
  retorno_real          numeric(14,2),
  lucro                 numeric(14,2),
  status                public.status_aposta not null default 'pendente',
  eh_freebet            boolean not null default false,
  casa_de_aposta        text,
  observacao            text,
  colocada_em           timestamptz not null default now(),
  resolvida_em          timestamptz,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now(),
  constraint chk_apostas_stake_positiva check (stake > 0),
  constraint chk_apostas_odd_maior_que_um check (odd_total >= 1),
  constraint chk_apostas_retorno_real_nao_negativo
    check (retorno_real is null or retorno_real >= 0),
  constraint chk_apostas_resolvida_em_coerente
    check ( (status = 'pendente' and resolvida_em is null)
         or (status <> 'pendente') )
);

create index if not exists ix_apostas_usuario_colocada
  on public.apostas(usuario_id, colocada_em desc);
create index if not exists ix_apostas_usuario_status
  on public.apostas(usuario_id, status);
create index if not exists ix_apostas_estrategia
  on public.apostas(estrategia_id) where estrategia_id is not null;
create index if not exists ix_apostas_banca on public.apostas(banca_id);

drop trigger if exists trg_apostas_atualizado_em on public.apostas;
create trigger trg_apostas_atualizado_em
  before update on public.apostas
  for each row execute function public.fn_atualizado_em();

create table if not exists public.apostas_selecoes (
  id                    uuid primary key default gen_random_uuid(),
  aposta_id             uuid not null references public.apostas(id) on delete cascade,
  usuario_id            uuid not null references public.perfis(id) on delete cascade,
  partida_id            uuid references public.partidas(id) on delete set null,
  tipo_aposta_id        smallint references public.tipos_aposta(id) on delete set null,
  descricao             text not null,
  linha                 text,
  odd                   numeric(10,3) not null,
  status                public.status_aposta not null default 'pendente',
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now(),
  constraint chk_selecoes_odd_maior_que_um check (odd >= 1)
);

create index if not exists ix_selecoes_aposta  on public.apostas_selecoes(aposta_id);
create index if not exists ix_selecoes_usuario on public.apostas_selecoes(usuario_id);

drop trigger if exists trg_selecoes_atualizado_em on public.apostas_selecoes;
create trigger trg_selecoes_atualizado_em
  before update on public.apostas_selecoes
  for each row execute function public.fn_atualizado_em();

do $$
declare
  t text;
begin
  foreach t in array array['apostas','apostas_selecoes']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force  row level security', t);

    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('drop policy if exists %I_delete on public.%I', t, t);

    execute format($p$
      create policy %I_select on public.%I
        for select to authenticated
        using ( (select auth.uid()) = usuario_id )
    $p$, t, t);

    execute format($p$
      create policy %I_insert on public.%I
        for insert to authenticated
        with check ( (select auth.uid()) = usuario_id )
    $p$, t, t);

    execute format($p$
      create policy %I_update on public.%I
        for update to authenticated
        using      ( (select auth.uid()) = usuario_id )
        with check ( (select auth.uid()) = usuario_id )
    $p$, t, t);

    execute format($p$
      create policy %I_delete on public.%I
        for delete to authenticated
        using ( (select auth.uid()) = usuario_id )
    $p$, t, t);
  end loop;
end$$;

create or replace view public.vw_apostas_resumo
  with (security_invoker = on)
as
select
  a.id,
  a.usuario_id,
  a.banca_id,
  a.estrategia_id,
  a.formato,
  a.status,
  a.stake,
  a.odd_total,
  a.retorno_real,
  a.lucro,
  a.eh_freebet,
  a.colocada_em,
  a.resolvida_em,
  (a.status <> 'pendente') as resolvida,
  (select count(*) from public.apostas_selecoes s where s.aposta_id = a.id) as qtd_selecoes
from public.apostas a;
