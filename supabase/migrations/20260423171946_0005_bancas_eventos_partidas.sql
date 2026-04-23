-- =============================================================================
-- Smart Bet · 0005 · Bancas, eventos_banca e partidas
-- =============================================================================

create table if not exists public.bancas (
  id                  uuid primary key default gen_random_uuid(),
  usuario_id          uuid not null references public.perfis(id) on delete cascade,
  nome                text not null,
  casa_de_aposta      text,
  moeda               char(3) not null default 'BRL',
  saldo_inicial       numeric(14,2) not null default 0,
  saldo_atual         numeric(14,2) not null default 0,
  e_principal         boolean not null default false,
  ativa               boolean not null default true,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  constraint chk_bancas_saldo_inicial_nao_negativo check (saldo_inicial >= 0)
);

create unique index if not exists ux_bancas_principal_por_usuario
  on public.bancas(usuario_id) where e_principal;

create index if not exists ix_bancas_usuario on public.bancas(usuario_id);

drop trigger if exists trg_bancas_atualizado_em on public.bancas;
create trigger trg_bancas_atualizado_em
  before update on public.bancas
  for each row execute function public.fn_atualizado_em();

create table if not exists public.eventos_banca (
  id                  uuid primary key default gen_random_uuid(),
  banca_id            uuid not null references public.bancas(id) on delete cascade,
  usuario_id          uuid not null references public.perfis(id) on delete cascade,
  tipo                public.tipo_evento_banca not null,
  valor               numeric(14,2) not null,
  observacao          text,
  ocorrido_em         timestamptz not null default now(),
  criado_em           timestamptz not null default now(),
  constraint chk_eventos_banca_valor_nao_zero check (valor <> 0)
);

create index if not exists ix_eventos_banca_banca   on public.eventos_banca(banca_id);
create index if not exists ix_eventos_banca_usuario on public.eventos_banca(usuario_id, ocorrido_em desc);

create table if not exists public.partidas (
  id                  uuid primary key default gen_random_uuid(),
  usuario_id          uuid not null references public.perfis(id) on delete cascade,
  esporte_id          smallint not null references public.esportes(id) on delete restrict,
  liga_id             bigint references public.ligas(id) on delete set null,
  time_mandante_id    bigint references public.times(id) on delete set null,
  time_visitante_id   bigint references public.times(id) on delete set null,
  mandante_nome       text,
  visitante_nome      text,
  inicio              timestamptz not null,
  placar_mandante     integer,
  placar_visitante    integer,
  encerrada           boolean not null default false,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  constraint chk_partidas_times_ou_nomes
    check (
      (time_mandante_id is not null and time_visitante_id is not null)
      or (mandante_nome is not null and visitante_nome is not null)
    ),
  constraint chk_partidas_times_distintos
    check (time_mandante_id is null or time_visitante_id is null or time_mandante_id <> time_visitante_id),
  constraint chk_partidas_placar_nao_negativo
    check (
      (placar_mandante is null or placar_mandante >= 0)
      and (placar_visitante is null or placar_visitante >= 0)
    )
);

create index if not exists ix_partidas_usuario_inicio
  on public.partidas(usuario_id, inicio desc);
create index if not exists ix_partidas_liga on public.partidas(liga_id);

drop trigger if exists trg_partidas_atualizado_em on public.partidas;
create trigger trg_partidas_atualizado_em
  before update on public.partidas
  for each row execute function public.fn_atualizado_em();

do $$
declare
  t text;
begin
  foreach t in array array['bancas','eventos_banca','partidas']
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
