-- =============================================================================
-- Smart Bet · 0003 · Catalogos globais (esportes, paises, ligas, times, tipos_aposta)
-- =============================================================================

create table if not exists public.esportes (
  id            smallserial primary key,
  slug          citext not null unique,
  nome          text not null,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);
comment on table public.esportes is 'Catalogo global de esportes suportados (Fase 1: futebol).';

create table if not exists public.paises (
  id            smallserial primary key,
  codigo_iso    char(2) not null unique,
  nome          text not null,
  criado_em     timestamptz not null default now()
);
comment on table public.paises is 'Paises / federacoes (codigo ISO-3166 alpha-2).';

create table if not exists public.ligas (
  id            bigserial primary key,
  esporte_id    smallint not null references public.esportes(id) on delete restrict,
  pais_id       smallint references public.paises(id) on delete set null,
  nome          text not null,
  slug          citext not null,
  temporada     text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  unique (esporte_id, slug)
);
create index if not exists ix_ligas_esporte on public.ligas(esporte_id);
create index if not exists ix_ligas_pais    on public.ligas(pais_id);
comment on table public.ligas is 'Competicoes (Brasileirao, Premier League, Libertadores, etc.).';

create table if not exists public.times (
  id            bigserial primary key,
  esporte_id    smallint not null references public.esportes(id) on delete restrict,
  pais_id       smallint references public.paises(id) on delete set null,
  nome          text not null,
  slug          citext not null,
  escudo_url    text,
  criado_em     timestamptz not null default now(),
  unique (esporte_id, slug)
);
create index if not exists ix_times_esporte on public.times(esporte_id);
create index if not exists ix_times_pais    on public.times(pais_id);
comment on table public.times is 'Times / clubes.';

create table if not exists public.tipos_aposta (
  id            smallserial primary key,
  esporte_id    smallint not null references public.esportes(id) on delete restrict,
  categoria     text not null,
  nome          text not null,
  slug          citext not null,
  descricao     text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  unique (esporte_id, slug)
);
create index if not exists ix_tipos_aposta_categoria on public.tipos_aposta(esporte_id, categoria);
comment on table public.tipos_aposta is
  'Mercados de apostas suportados (1X2, Over/Under, Ambas marcam, Handicap, etc.).';

do $$
declare
  t text;
begin
  foreach t in array array['esportes','paises','ligas','times','tipos_aposta']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force  row level security', t);

    execute format('drop policy if exists %I_select_auth  on public.%I', t, t);
    execute format('drop policy if exists %I_insert_admin on public.%I', t, t);
    execute format('drop policy if exists %I_update_admin on public.%I', t, t);
    execute format('drop policy if exists %I_delete_admin on public.%I', t, t);

    execute format($p$
      create policy %I_select_auth on public.%I
        for select to authenticated
        using (true)
    $p$, t, t);

    execute format($p$
      create policy %I_insert_admin on public.%I
        for insert to authenticated
        with check ( public.fn_eh_admin() )
    $p$, t, t);

    execute format($p$
      create policy %I_update_admin on public.%I
        for update to authenticated
        using ( public.fn_eh_admin() )
        with check ( public.fn_eh_admin() )
    $p$, t, t);

    execute format($p$
      create policy %I_delete_admin on public.%I
        for delete to authenticated
        using ( public.fn_eh_admin() )
    $p$, t, t);
  end loop;
end$$;
