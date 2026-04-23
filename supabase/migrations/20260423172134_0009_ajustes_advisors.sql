-- =============================================================================
-- Smart Bet · 0009 · Ajustes baseados nos advisors do Supabase
-- =============================================================================

create schema if not exists extensions;
grant usage on schema extensions to public;
alter extension citext set schema extensions;

drop policy if exists perfis_select_dono  on public.perfis;
drop policy if exists perfis_select_admin on public.perfis;

create policy perfis_select on public.perfis
  for select
  to authenticated
  using (
    (select auth.uid()) = id
    or public.fn_eh_admin()
  );

create index if not exists ix_apostas_selecoes_partida
  on public.apostas_selecoes(partida_id)
  where partida_id is not null;

create index if not exists ix_apostas_selecoes_tipo_aposta
  on public.apostas_selecoes(tipo_aposta_id)
  where tipo_aposta_id is not null;

create index if not exists ix_estrategias_esporte
  on public.estrategias(esporte_id)
  where esporte_id is not null;

create index if not exists ix_estrategias_tipo_aposta
  on public.estrategias(tipo_aposta_id)
  where tipo_aposta_id is not null;

create index if not exists ix_partidas_esporte
  on public.partidas(esporte_id);

create index if not exists ix_partidas_time_mandante
  on public.partidas(time_mandante_id)
  where time_mandante_id is not null;

create index if not exists ix_partidas_time_visitante
  on public.partidas(time_visitante_id)
  where time_visitante_id is not null;
