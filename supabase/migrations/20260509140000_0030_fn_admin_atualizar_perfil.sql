-- =============================================================================
-- Smart Bet · 0030 · Admin — atualizar perfil de outro usuario (RPC)
-- -----------------------------------------------------------------------------
-- Permite que um admin altere papel, nome, moeda e fuso horario de qualquer
-- perfil sem abrir UPDATE amplo via RLS. Impede remover o ultimo administrador.
-- =============================================================================

create or replace function public.fn_admin_atualizar_perfil(
  p_usuario_id uuid,
  p_patch jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_old_papel public.papel_usuario;
  v_new_papel public.papel_usuario;
  v_new_nome text;
  v_new_moeda char(3);
  v_new_fuso text;
  v_admin_n int;
  v_moeda_raw text;
begin
  v_actor := (select auth.uid());
  if v_actor is null then
    raise exception 'Nao autenticado' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.perfis p where p.id = v_actor and p.papel = 'admin'
  ) then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  select p.papel, p.nome_completo, p.moeda, p.fuso_horario
    into v_old_papel, v_new_nome, v_new_moeda, v_new_fuso
    from public.perfis p
   where p.id = p_usuario_id
   for update;

  if not found then
    raise exception 'Usuario nao encontrado' using errcode = 'P0002';
  end if;

  v_new_papel := v_old_papel;

  if p_patch ? 'papel' then
    begin
      v_new_papel := (p_patch->>'papel')::public.papel_usuario;
    exception
      when invalid_text_representation then
        raise exception 'Papel invalido.' using errcode = '22023';
    end;
  end if;

  if v_old_papel = 'admin' and v_new_papel is distinct from 'admin' then
    select count(*)::int into v_admin_n from public.perfis where papel = 'admin';
    if v_admin_n <= 1 then
      raise exception 'Nao e possivel remover o unico administrador do sistema.'
        using errcode = 'P0001';
    end if;
  end if;

  if p_patch ? 'nome_completo' then
    v_new_nome := nullif(trim(p_patch->>'nome_completo'), '');
  end if;

  if p_patch ? 'moeda' then
    v_moeda_raw := upper(trim(p_patch->>'moeda'));
    if length(v_moeda_raw) <> 3 then
      raise exception 'Moeda invalida (codigo ISO 4217 de 3 letras, ex.: BRL).' using errcode = '22023';
    end if;
    v_new_moeda := substr(v_moeda_raw, 1, 3)::char(3);
  end if;

  if p_patch ? 'fuso_horario' then
    v_new_fuso := nullif(trim(p_patch->>'fuso_horario'), '');
    if v_new_fuso is null then
      raise exception 'Fuso horario nao pode ser vazio.' using errcode = '22023';
    end if;
  end if;

  update public.perfis
     set papel         = v_new_papel,
         nome_completo = v_new_nome,
         moeda         = v_new_moeda,
         fuso_horario  = v_new_fuso
   where id = p_usuario_id;
end;
$$;

comment on function public.fn_admin_atualizar_perfil(uuid, jsonb) is
  'Administrador autenticado atualiza outro perfil (papel, nome, moeda, fuso).';

grant execute on function public.fn_admin_atualizar_perfil(uuid, jsonb) to authenticated;
