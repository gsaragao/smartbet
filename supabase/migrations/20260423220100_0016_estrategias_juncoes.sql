-- =============================================================================
-- Smart Bet · 0016 · Junções N:N para estratégias (tipos de aposta e ligas)
-- -----------------------------------------------------------------------------
-- Uma estratégia:
--   • tem 1 esporte (FK direta na tabela mãe)
--   • pode se aplicar a N tipos de aposta
--   • pode se aplicar a N ligas (opcional — vazio = todas as ligas do esporte)
--
-- `usuario_id` é desnormalizado em cada junção para simplificar as policies
-- de RLS (padrão adotado em `eventos_banca`) e permitir filtros diretos sem
-- joins caros na tabela mãe.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. estrategias_tipos_aposta
-- -----------------------------------------------------------------------------
create table if not exists public.estrategias_tipos_aposta (
  estrategia_id   uuid     not null references public.estrategias(id)    on delete cascade,
  tipo_aposta_id  smallint not null references public.tipos_aposta(id)   on delete restrict,
  usuario_id      uuid     not null references public.perfis(id)         on delete cascade,
  criado_em       timestamptz not null default now(),
  primary key (estrategia_id, tipo_aposta_id)
);

comment on table public.estrategias_tipos_aposta is
  'Associação N:N entre estratégias e tipos de aposta permitidos.';

create index if not exists ix_estrategias_tipos_aposta_usuario
  on public.estrategias_tipos_aposta(usuario_id);

create index if not exists ix_estrategias_tipos_aposta_tipo
  on public.estrategias_tipos_aposta(tipo_aposta_id);

alter table public.estrategias_tipos_aposta enable  row level security;
alter table public.estrategias_tipos_aposta force   row level security;

drop policy if exists estrategias_tipos_aposta_select on public.estrategias_tipos_aposta;
drop policy if exists estrategias_tipos_aposta_insert on public.estrategias_tipos_aposta;
drop policy if exists estrategias_tipos_aposta_update on public.estrategias_tipos_aposta;
drop policy if exists estrategias_tipos_aposta_delete on public.estrategias_tipos_aposta;

create policy estrategias_tipos_aposta_select on public.estrategias_tipos_aposta
  for select to authenticated
  using ( (select auth.uid()) = usuario_id );

create policy estrategias_tipos_aposta_insert on public.estrategias_tipos_aposta
  for insert to authenticated
  with check ( (select auth.uid()) = usuario_id );

create policy estrategias_tipos_aposta_update on public.estrategias_tipos_aposta
  for update to authenticated
  using      ( (select auth.uid()) = usuario_id )
  with check ( (select auth.uid()) = usuario_id );

create policy estrategias_tipos_aposta_delete on public.estrategias_tipos_aposta
  for delete to authenticated
  using ( (select auth.uid()) = usuario_id );

-- -----------------------------------------------------------------------------
-- 2. estrategias_ligas
-- -----------------------------------------------------------------------------
create table if not exists public.estrategias_ligas (
  estrategia_id  uuid   not null references public.estrategias(id) on delete cascade,
  liga_id        bigint not null references public.ligas(id)       on delete restrict,
  usuario_id     uuid   not null references public.perfis(id)      on delete cascade,
  criado_em      timestamptz not null default now(),
  primary key (estrategia_id, liga_id)
);

comment on table public.estrategias_ligas is
  'Associação N:N entre estratégias e ligas permitidas. Vazio = todas as ligas do esporte.';

create index if not exists ix_estrategias_ligas_usuario
  on public.estrategias_ligas(usuario_id);

create index if not exists ix_estrategias_ligas_liga
  on public.estrategias_ligas(liga_id);

alter table public.estrategias_ligas enable  row level security;
alter table public.estrategias_ligas force   row level security;

drop policy if exists estrategias_ligas_select on public.estrategias_ligas;
drop policy if exists estrategias_ligas_insert on public.estrategias_ligas;
drop policy if exists estrategias_ligas_update on public.estrategias_ligas;
drop policy if exists estrategias_ligas_delete on public.estrategias_ligas;

create policy estrategias_ligas_select on public.estrategias_ligas
  for select to authenticated
  using ( (select auth.uid()) = usuario_id );

create policy estrategias_ligas_insert on public.estrategias_ligas
  for insert to authenticated
  with check ( (select auth.uid()) = usuario_id );

create policy estrategias_ligas_update on public.estrategias_ligas
  for update to authenticated
  using      ( (select auth.uid()) = usuario_id )
  with check ( (select auth.uid()) = usuario_id );

create policy estrategias_ligas_delete on public.estrategias_ligas
  for delete to authenticated
  using ( (select auth.uid()) = usuario_id );
