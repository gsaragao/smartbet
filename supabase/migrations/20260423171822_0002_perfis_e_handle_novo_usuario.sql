-- =============================================================================
-- Smart Bet · 0002 · Perfis de usuario
-- =============================================================================

create table if not exists public.perfis (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               citext not null unique,
  nome_completo       text,
  papel               public.papel_usuario not null default 'usuario',
  moeda               char(3) not null default 'BRL',
  fuso_horario        text not null default 'America/Sao_Paulo',
  avatar_url          text,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now()
);

comment on table  public.perfis is 'Dados do usuario da aplicacao. Relacao 1-1 com auth.users.';
comment on column public.perfis.papel is 'Controla acesso administrativo: "admin" enxerga areas administrativas, "usuario" e o papel padrao.';
comment on column public.perfis.moeda is 'Codigo ISO 4217 da moeda preferida (padrao BRL).';

create index if not exists ix_perfis_papel on public.perfis(papel);

drop trigger if exists trg_perfis_atualizado_em on public.perfis;
create trigger trg_perfis_atualizado_em
  before update on public.perfis
  for each row
  execute function public.fn_atualizado_em();

create or replace function public.fn_handle_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, email, nome_completo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome_completo',
             new.raw_user_meta_data->>'full_name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.fn_handle_novo_usuario is
  'Cria automaticamente um registro em public.perfis quando um novo usuario se registra em auth.users.';

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.fn_handle_novo_usuario();

create or replace function public.fn_eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = (select auth.uid())
      and p.papel = 'admin'
  );
$$;

comment on function public.fn_eh_admin is
  'Retorna true quando o usuario autenticado tem papel admin. Utilizado em politicas RLS.';

grant execute on function public.fn_eh_admin() to authenticated;

alter table public.perfis enable row level security;
alter table public.perfis force row level security;

drop policy if exists perfis_select_dono       on public.perfis;
drop policy if exists perfis_select_admin      on public.perfis;
drop policy if exists perfis_update_dono       on public.perfis;

create policy perfis_select_dono on public.perfis
  for select
  to authenticated
  using ( (select auth.uid()) = id );

create policy perfis_select_admin on public.perfis
  for select
  to authenticated
  using ( public.fn_eh_admin() );

create policy perfis_update_dono on public.perfis
  for update
  to authenticated
  using ( (select auth.uid()) = id )
  with check (
    (select auth.uid()) = id
    and papel = (select p.papel from public.perfis p where p.id = (select auth.uid()))
  );
