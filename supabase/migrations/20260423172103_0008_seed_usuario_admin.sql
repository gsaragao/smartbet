-- =============================================================================
-- Smart Bet · 0008 · Seed do usuario administrador
-- -----------------------------------------------------------------------------
-- Cria admin@smartbet.com / admin123. Idempotente.
-- =============================================================================

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'admin@smartbet.com';

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new, is_sso_user
    ) values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@smartbet.com',
      crypt('admin123', gen_salt('bf', 10)),
      now(),
      jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
      jsonb_build_object('nome_completo','Administrador Smart Bet'),
      now(), now(), '', '', '', '', false
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'admin@smartbet.com',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(), now(), now()
    );
  end if;

  insert into public.perfis (id, email, nome_completo, papel)
  values (v_user_id, 'admin@smartbet.com', 'Administrador Smart Bet', 'admin')
  on conflict (id) do update
    set papel = 'admin',
        nome_completo = coalesce(excluded.nome_completo, public.perfis.nome_completo);
end$$;
