-- =============================================================================
-- Smart Bet · 0029 · Perfis consulta e executor
-- -----------------------------------------------------------------------------
-- Adiciona dois novos papeis ao enum papel_usuario:
--   · executor  — CRUD completo nos proprios dados (equivalente ao antigo usuario)
--   · consulta  — somente leitura (read-only)
--
-- Migra todos os registros existentes com papel = 'usuario' para 'executor'.
-- Altera o DEFAULT da coluna perfis.papel para 'consulta' — novos registros
-- criados via auto-registro serao sempre read-only por padrao.
--
-- Cria fn_pode_escrever() (SECURITY DEFINER) para uso nas politicas RLS.
-- Recria politicas INSERT/UPDATE/DELETE em todas as tabelas de dados do usuario
-- para que o banco tambem bloqueie escritas de usuarios com papel = 'consulta'.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Novos valores no enum
-- ALTER TYPE ... ADD VALUE nao pode rodar dentro de uma transacao explicita no
-- Postgres, mas o Supabase CLI envolve cada migration em BEGIN/COMMIT. Por isso
-- usamos IF NOT EXISTS para idempotencia, e os valores ficam disponiveis
-- imediatamente para o restante da migration no mesmo bloco de conexao.
-- ---------------------------------------------------------------------------
alter type public.papel_usuario add value if not exists 'executor';
alter type public.papel_usuario add value if not exists 'consulta';

-- ---------------------------------------------------------------------------
-- 2. Migrar dados existentes: usuario → executor
-- ---------------------------------------------------------------------------
update public.perfis
  set papel = 'executor'
  where papel = 'usuario';

-- ---------------------------------------------------------------------------
-- 3. Novo DEFAULT para novos registros (auto-registro via /register = consulta)
-- ---------------------------------------------------------------------------
alter table public.perfis
  alter column papel set default 'consulta';

-- ---------------------------------------------------------------------------
-- 4. Funcao auxiliar para politicas RLS
-- ---------------------------------------------------------------------------
create or replace function public.fn_pode_escrever()
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
      and p.papel in ('admin', 'executor', 'usuario')
  );
$$;

comment on function public.fn_pode_escrever() is
  'Retorna true quando o usuario autenticado tem permissao de escrita (admin, executor ou usuario). '
  'Usado nas politicas RLS de INSERT/UPDATE/DELETE nas tabelas de dados do usuario.';

grant execute on function public.fn_pode_escrever() to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Recriar politicas de escrita para tabelas de estrategias
-- ---------------------------------------------------------------------------
drop policy if exists estrategias_insert on public.estrategias;
drop policy if exists estrategias_update on public.estrategias;
drop policy if exists estrategias_delete on public.estrategias;

create policy estrategias_insert on public.estrategias
  for insert to authenticated
  with check (
    (select auth.uid()) = usuario_id
    and public.fn_pode_escrever()
  );

create policy estrategias_update on public.estrategias
  for update to authenticated
  using      ( (select auth.uid()) = usuario_id and public.fn_pode_escrever() )
  with check ( (select auth.uid()) = usuario_id and public.fn_pode_escrever() );

create policy estrategias_delete on public.estrategias
  for delete to authenticated
  using ( (select auth.uid()) = usuario_id and public.fn_pode_escrever() );

-- ---------------------------------------------------------------------------
-- 6. Recriar politicas de escrita para estrategias_progresso
-- ---------------------------------------------------------------------------
drop policy if exists estrategias_progresso_insert on public.estrategias_progresso;
drop policy if exists estrategias_progresso_update on public.estrategias_progresso;
drop policy if exists estrategias_progresso_delete on public.estrategias_progresso;

create policy estrategias_progresso_insert on public.estrategias_progresso
  for insert to authenticated
  with check (
    (select auth.uid()) = usuario_id
    and public.fn_pode_escrever()
  );

create policy estrategias_progresso_update on public.estrategias_progresso
  for update to authenticated
  using      ( (select auth.uid()) = usuario_id and public.fn_pode_escrever() )
  with check ( (select auth.uid()) = usuario_id and public.fn_pode_escrever() );

create policy estrategias_progresso_delete on public.estrategias_progresso
  for delete to authenticated
  using ( (select auth.uid()) = usuario_id and public.fn_pode_escrever() );

-- ---------------------------------------------------------------------------
-- 7. Recriar politicas de escrita para bancas, eventos_banca e partidas
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['bancas', 'eventos_banca', 'partidas']
  loop
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('drop policy if exists %I_delete on public.%I', t, t);

    execute format($p$
      create policy %I_insert on public.%I
        for insert to authenticated
        with check (
          (select auth.uid()) = usuario_id
          and public.fn_pode_escrever()
        )
    $p$, t, t);

    execute format($p$
      create policy %I_update on public.%I
        for update to authenticated
        using      ( (select auth.uid()) = usuario_id and public.fn_pode_escrever() )
        with check ( (select auth.uid()) = usuario_id and public.fn_pode_escrever() )
    $p$, t, t);

    execute format($p$
      create policy %I_delete on public.%I
        for delete to authenticated
        using ( (select auth.uid()) = usuario_id and public.fn_pode_escrever() )
    $p$, t, t);
  end loop;
end$$;

-- ---------------------------------------------------------------------------
-- 8. Recriar politicas de escrita para apostas e apostas_selecoes
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['apostas', 'apostas_selecoes']
  loop
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('drop policy if exists %I_delete on public.%I', t, t);

    execute format($p$
      create policy %I_insert on public.%I
        for insert to authenticated
        with check (
          (select auth.uid()) = usuario_id
          and public.fn_pode_escrever()
        )
    $p$, t, t);

    execute format($p$
      create policy %I_update on public.%I
        for update to authenticated
        using      ( (select auth.uid()) = usuario_id and public.fn_pode_escrever() )
        with check ( (select auth.uid()) = usuario_id and public.fn_pode_escrever() )
    $p$, t, t);

    execute format($p$
      create policy %I_delete on public.%I
        for delete to authenticated
        using ( (select auth.uid()) = usuario_id and public.fn_pode_escrever() )
    $p$, t, t);
  end loop;
end$$;
