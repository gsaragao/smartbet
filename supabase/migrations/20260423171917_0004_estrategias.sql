-- =============================================================================
-- Smart Bet · 0004 · Estrategias + progresso
-- =============================================================================

create table if not exists public.estrategias (
  id                  uuid primary key default gen_random_uuid(),
  usuario_id          uuid not null references public.perfis(id) on delete cascade,
  nome                text not null,
  descricao           text,
  esporte_id          smallint references public.esportes(id) on delete set null,
  tipo_aposta_id      smallint references public.tipos_aposta(id) on delete set null,
  metodo_stake        public.metodo_stake not null default 'livre',
  stake_config        jsonb not null default '{}'::jsonb,
  odd_minima          numeric(8,3),
  odd_maxima          numeric(8,3),
  stake_base          numeric(14,2),
  meta_banca          numeric(14,2),
  cor                 text default '#22c55e',
  ativa               boolean not null default true,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  constraint chk_estrategias_odd_range
    check (odd_minima is null or odd_maxima is null or odd_minima <= odd_maxima),
  constraint chk_estrategias_stake_base_positiva
    check (stake_base is null or stake_base > 0)
);
comment on table public.estrategias is
  'Estrategias definidas pelo usuario. Cada aposta pode ser vinculada a uma estrategia para analise agrupada.';
comment on column public.estrategias.stake_config is
  'Configuracao flexivel do metodo_stake (ex.: {"percentual":2.5} ou {"passos":[10,20,40,80]}).';

create index if not exists ix_estrategias_usuario     on public.estrategias(usuario_id);
create index if not exists ix_estrategias_usuario_ativa
  on public.estrategias(usuario_id) where ativa;

drop trigger if exists trg_estrategias_atualizado_em on public.estrategias;
create trigger trg_estrategias_atualizado_em
  before update on public.estrategias
  for each row execute function public.fn_atualizado_em();

create table if not exists public.estrategias_progresso (
  estrategia_id         uuid primary key references public.estrategias(id) on delete cascade,
  usuario_id            uuid not null references public.perfis(id) on delete cascade,
  passo_atual           integer not null default 0,
  reds_consecutivos     integer not null default 0,
  greens_consecutivos   integer not null default 0,
  total_apostas         integer not null default 0,
  total_greens          integer not null default 0,
  total_reds            integer not null default 0,
  lucro_acumulado       numeric(14,2) not null default 0,
  ultima_aposta_em      timestamptz,
  atualizado_em         timestamptz not null default now()
);
comment on table public.estrategias_progresso is
  'Estado dinamico da estrategia (passo da progressao, streaks, totais).';

create index if not exists ix_estrategias_progresso_usuario
  on public.estrategias_progresso(usuario_id);

drop trigger if exists trg_estrategias_progresso_atualizado_em on public.estrategias_progresso;
create trigger trg_estrategias_progresso_atualizado_em
  before update on public.estrategias_progresso
  for each row execute function public.fn_atualizado_em();

alter table public.estrategias          enable row level security;
alter table public.estrategias          force  row level security;
alter table public.estrategias_progresso enable row level security;
alter table public.estrategias_progresso force  row level security;

drop policy if exists estrategias_select on public.estrategias;
drop policy if exists estrategias_insert on public.estrategias;
drop policy if exists estrategias_update on public.estrategias;
drop policy if exists estrategias_delete on public.estrategias;

create policy estrategias_select on public.estrategias
  for select to authenticated
  using ( (select auth.uid()) = usuario_id );

create policy estrategias_insert on public.estrategias
  for insert to authenticated
  with check ( (select auth.uid()) = usuario_id );

create policy estrategias_update on public.estrategias
  for update to authenticated
  using      ( (select auth.uid()) = usuario_id )
  with check ( (select auth.uid()) = usuario_id );

create policy estrategias_delete on public.estrategias
  for delete to authenticated
  using ( (select auth.uid()) = usuario_id );

drop policy if exists estrategias_progresso_select on public.estrategias_progresso;
drop policy if exists estrategias_progresso_insert on public.estrategias_progresso;
drop policy if exists estrategias_progresso_update on public.estrategias_progresso;
drop policy if exists estrategias_progresso_delete on public.estrategias_progresso;

create policy estrategias_progresso_select on public.estrategias_progresso
  for select to authenticated
  using ( (select auth.uid()) = usuario_id );

create policy estrategias_progresso_insert on public.estrategias_progresso
  for insert to authenticated
  with check ( (select auth.uid()) = usuario_id );

create policy estrategias_progresso_update on public.estrategias_progresso
  for update to authenticated
  using      ( (select auth.uid()) = usuario_id )
  with check ( (select auth.uid()) = usuario_id );

create policy estrategias_progresso_delete on public.estrategias_progresso
  for delete to authenticated
  using ( (select auth.uid()) = usuario_id );
