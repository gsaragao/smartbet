-- =============================================================================
-- Smart Bet · 0018 · Seed dos templates de estratégia para o admin
-- -----------------------------------------------------------------------------
-- Três templates (decisão S2):
--   1) Ambas Marcam          — pré-live, BTTS histórico
--   2) Ao vivo · Over 0.5    — ao-vivo, 2º tempo 0x0 com pressão ofensiva
--   3) Under 2.5             — pré-live conservador, Kelly 1/4
--
-- IDs dos tipos de aposta variam entre ambientes, por isso resolvemos via slug.
-- Se o admin ainda não existir (seed 0008 não rodou), o insert é ignorado.
-- Idempotente: `on conflict do nothing` pelo índice único (usuario_id, lower(nome)).
-- =============================================================================

do $$
declare
  v_admin_id uuid;
  v_esporte_id int;
  v_estrategia_id uuid;
  v_tipo_btts int;
  v_tipo_over05 int;
  v_tipo_under25 int;
begin
  select id into v_admin_id
    from public.perfis
   where email = 'admin@smartbet.com'
   limit 1;

  if v_admin_id is null then
    raise notice 'Admin não encontrado — seed de templates ignorado.';
    return;
  end if;

  select id into v_esporte_id
    from public.esportes
   where slug = 'futebol'
   limit 1;

  if v_esporte_id is null then
    raise notice 'Esporte futebol não encontrado — seed de templates ignorado.';
    return;
  end if;

  select id into v_tipo_btts     from public.tipos_aposta where slug = 'ambas-marcam'       limit 1;
  select id into v_tipo_over05   from public.tipos_aposta where slug = 'mais-de-meio-gol'   limit 1;
  select id into v_tipo_under25  from public.tipos_aposta where slug = 'menos-de-2-5-gols'  limit 1;

  -- -------------------------------------------------------------------------
  -- 1) Ambas Marcam
  -- -------------------------------------------------------------------------
  if v_tipo_btts is not null then
    insert into public.estrategias (
      usuario_id, nome, descricao, cor, tags, status, contextos,
      esporte_id, odd_minima, odd_maxima, minuto_minimo,
      metodo_stake, stake_config, banca_referencia, edge_minimo,
      stop_loss_reds, stop_loss_banca_pct,
      drawdown_alerta_pct, reds_consec_alerta, yield_minimo_alerta,
      revisao_apos_apostas, revisao_apos_dias,
      regras_jsonb, tipo_aposta_id
    ) values (
      v_admin_id,
      'Ambas Marcam',
      'Foco em jogos com BTTS histórico ≥ 60% e médias de gols confortáveis em ambos os lados.',
      '#22c55e',
      array['pre-live','btts']::text[],
      'ativa',
      array['pre_live']::text[],
      v_esporte_id,
      1.60, 2.20, null,
      'percentual',
      jsonb_build_object('metodo','percentual','percentual',2),
      'saldo_atual',
      4,
      5, 10,
      8, 3, null,
      30, 15,
      jsonb_build_object(
        'tipo','grupo',
        'operador','AND',
        'filhos', jsonb_build_array(
          jsonb_build_object('tipo','condicao','campo','btts_historico','operador','gte','valor',60),
          jsonb_build_object('tipo','condicao','campo','media_gols_time','operador','gte','valor',1.2)
        )
      ),
      v_tipo_btts
    )
    on conflict do nothing
    returning id into v_estrategia_id;

    if v_estrategia_id is not null then
      insert into public.estrategias_tipos_aposta (estrategia_id, tipo_aposta_id, usuario_id)
      values (v_estrategia_id, v_tipo_btts, v_admin_id)
      on conflict do nothing;
    end if;
  end if;

  -- -------------------------------------------------------------------------
  -- 2) Ao vivo · Over 0.5 (2º tempo 0x0)
  -- -------------------------------------------------------------------------
  v_estrategia_id := null;
  if v_tipo_over05 is not null then
    insert into public.estrategias (
      usuario_id, nome, descricao, cor, tags, status, contextos,
      esporte_id, odd_minima, odd_maxima, minuto_minimo,
      metodo_stake, stake_config, banca_referencia, edge_minimo,
      stop_loss_reds, stop_loss_banca_pct,
      drawdown_alerta_pct, reds_consec_alerta, yield_minimo_alerta,
      revisao_apos_apostas, revisao_apos_dias,
      regras_jsonb, tipo_aposta_id
    ) values (
      v_admin_id,
      'Ao vivo · Over 0.5 (2T 0x0)',
      'Identifica jogos parados no 2º tempo com boas estatísticas de finalização e xG.',
      '#f97316',
      array['ao-vivo','over','2t']::text[],
      'ativa',
      array['ao_vivo']::text[],
      v_esporte_id,
      1.40, 1.80, 50,
      'fixo',
      jsonb_build_object('metodo','fixo','valor',15),
      'saldo_inicial',
      3,
      4, null,
      10, 3, null,
      25, 10,
      jsonb_build_object(
        'tipo','grupo',
        'operador','AND',
        'filhos', jsonb_build_array(
          jsonb_build_object('tipo','condicao','campo','placar_atual','operador','eq','valor','0x0'),
          jsonb_build_object('tipo','condicao','campo','minuto','operador','gte','valor',50),
          jsonb_build_object('tipo','condicao','campo','finalizacoes_pct','operador','gte','valor',50),
          jsonb_build_object('tipo','condicao','campo','xg','operador','gte','valor',1.4)
        )
      ),
      v_tipo_over05
    )
    on conflict do nothing
    returning id into v_estrategia_id;

    if v_estrategia_id is not null then
      insert into public.estrategias_tipos_aposta (estrategia_id, tipo_aposta_id, usuario_id)
      values (v_estrategia_id, v_tipo_over05, v_admin_id)
      on conflict do nothing;
    end if;
  end if;

  -- -------------------------------------------------------------------------
  -- 3) Under 2.5
  -- -------------------------------------------------------------------------
  v_estrategia_id := null;
  if v_tipo_under25 is not null then
    insert into public.estrategias (
      usuario_id, nome, descricao, cor, tags, status, contextos,
      esporte_id, odd_minima, odd_maxima, minuto_minimo,
      metodo_stake, stake_config, banca_referencia, edge_minimo,
      stop_loss_reds, stop_loss_banca_pct,
      drawdown_alerta_pct, reds_consec_alerta, yield_minimo_alerta,
      revisao_apos_apostas, revisao_apos_dias,
      regras_jsonb, tipo_aposta_id
    ) values (
      v_admin_id,
      'Under 2.5',
      'Foco em jogos defensivos com médias de gols baixas. Kelly conservador (¼).',
      '#0ea5e9',
      array['pre-live','under','conservador']::text[],
      'ativa',
      array['pre_live']::text[],
      v_esporte_id,
      1.60, 2.10, null,
      'kelly',
      jsonb_build_object('metodo','kelly','fracao',0.25),
      'saldo_atual',
      5,
      5, 10,
      8, 3, null,
      40, 20,
      jsonb_build_object(
        'tipo','grupo',
        'operador','AND',
        'filhos', jsonb_build_array(
          jsonb_build_object('tipo','condicao','campo','media_gols_time','operador','lte','valor',1.3)
        )
      ),
      v_tipo_under25
    )
    on conflict do nothing
    returning id into v_estrategia_id;

    if v_estrategia_id is not null then
      insert into public.estrategias_tipos_aposta (estrategia_id, tipo_aposta_id, usuario_id)
      values (v_estrategia_id, v_tipo_under25, v_admin_id)
      on conflict do nothing;
    end if;
  end if;
end$$;
