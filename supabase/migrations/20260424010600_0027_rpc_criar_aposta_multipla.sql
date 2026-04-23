-- =============================================================================
-- Smart Bet · 0027 · RPC fn_criar_aposta_multipla
-- =============================================================================
-- Contexto:
--   Espelha fn_criar_aposta_simples (0020) mas aceita N seleções em uma única
--   aposta múltipla. Cada seleção pode ter sua própria partida (hybrid) e sua
--   própria odd. A odd_total da aposta é validada pelo trigger
--   fn_validar_aposta_multipla (0026) — aceita tolerância 0.01.
--
-- Payload:
--   {
--     "banca_id": "...",
--     "estrategia_id": "..." | null,
--     "stake": 100,
--     "odd_total": 5.625,       -- produto das odds ± 0.01
--     "eh_freebet": false,
--     "casa_de_aposta": "...",
--     "descricao": "...",
--     "observacao": "...",
--     "estrategia_override": false,
--     "motivo_override": null,
--     "edge": null,
--     "valor_esperado": null,
--     "selecoes": [
--       {
--         "partida": { ... } -- existing/new, mesmo shape de 0020
--         "tipo_aposta_id": 3,
--         "linha": "2.5" | null,
--         "odd": 1.50,
--         "descricao": "Over 2.5"
--       },
--       ...  (>= 2 itens)
--     ]
--   }
-- =============================================================================

create or replace function public.fn_criar_aposta_multipla(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id        uuid := auth.uid();
  v_banca_id       uuid;
  v_estrategia_id  uuid;
  v_aposta_id      uuid;

  v_selecoes       jsonb;
  v_sel            jsonb;
  v_partida        jsonb;
  v_partida_kind   text;
  v_partida_id     uuid;
  v_qtd            int;
begin
  if v_user_id is null then
    raise exception 'Não autenticado.' using errcode = '28000';
  end if;

  v_banca_id      := nullif(payload->>'banca_id','')::uuid;
  v_estrategia_id := nullif(payload->>'estrategia_id','')::uuid;

  if v_banca_id is null then
    raise exception 'banca_id é obrigatório.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.bancas
     where id = v_banca_id and usuario_id = v_user_id
  ) then
    raise exception 'Banca não encontrada.' using errcode = '23503';
  end if;

  if v_estrategia_id is not null and not exists (
    select 1 from public.estrategias
     where id = v_estrategia_id and usuario_id = v_user_id
  ) then
    raise exception 'Estratégia não encontrada.' using errcode = '23503';
  end if;

  v_selecoes := payload->'selecoes';
  if v_selecoes is null or jsonb_typeof(v_selecoes) <> 'array' then
    raise exception 'selecoes deve ser um array.' using errcode = '22023';
  end if;

  v_qtd := jsonb_array_length(v_selecoes);
  if v_qtd < 2 then
    raise exception 'Aposta múltipla requer ao menos 2 seleções.' using errcode = '22023';
  end if;

  insert into public.apostas (
    usuario_id,
    banca_id,
    estrategia_id,
    formato,
    descricao,
    stake,
    odd_total,
    status,
    eh_freebet,
    casa_de_aposta,
    observacao,
    estrategia_override,
    motivo_override,
    edge,
    valor_esperado,
    colocada_em
  )
  values (
    v_user_id,
    v_banca_id,
    v_estrategia_id,
    'multipla',
    nullif(payload->>'descricao',''),
    (payload->>'stake')::numeric,
    (payload->>'odd_total')::numeric,
    'pendente',
    coalesce((payload->>'eh_freebet')::boolean, false),
    nullif(payload->>'casa_de_aposta',''),
    nullif(payload->>'observacao',''),
    coalesce((payload->>'estrategia_override')::boolean, false),
    nullif(payload->>'motivo_override',''),
    nullif(payload->>'edge','')::numeric,
    nullif(payload->>'valor_esperado','')::numeric,
    now()
  )
  returning id into v_aposta_id;

  for v_sel in select * from jsonb_array_elements(v_selecoes) loop
    v_partida      := v_sel->'partida';
    v_partida_kind := v_partida->>'kind';

    if v_partida_kind = 'existing' then
      v_partida_id := (v_partida->>'partida_id')::uuid;
      if not exists (
        select 1 from public.partidas
         where id = v_partida_id and usuario_id = v_user_id
      ) then
        raise exception 'Partida não encontrada.' using errcode = '23503';
      end if;
    elsif v_partida_kind = 'new' then
      insert into public.partidas (
        usuario_id, esporte_id, liga_id,
        time_mandante_id, time_visitante_id,
        mandante_nome, visitante_nome, inicio
      )
      values (
        v_user_id,
        (v_partida->>'esporte_id')::smallint,
        nullif(v_partida->>'liga_id','')::bigint,
        nullif(v_partida->>'time_mandante_id','')::bigint,
        nullif(v_partida->>'time_visitante_id','')::bigint,
        nullif(v_partida->>'mandante_nome',''),
        nullif(v_partida->>'visitante_nome',''),
        coalesce(nullif(v_partida->>'inicio','')::timestamptz, now())
      )
      returning id into v_partida_id;
    else
      raise exception 'partida.kind inválido em uma das seleções.' using errcode = '22023';
    end if;

    insert into public.apostas_selecoes (
      aposta_id, usuario_id, partida_id, tipo_aposta_id,
      descricao, linha, odd, status
    )
    values (
      v_aposta_id,
      v_user_id,
      v_partida_id,
      nullif(v_sel->>'tipo_aposta_id','')::smallint,
      coalesce(nullif(v_sel->>'descricao',''), 'Seleção'),
      nullif(v_sel->>'linha',''),
      (v_sel->>'odd')::numeric,
      'pendente'
    );
  end loop;

  return v_aposta_id;
end;
$$;

revoke all on function public.fn_criar_aposta_multipla(jsonb) from public;
grant execute on function public.fn_criar_aposta_multipla(jsonb) to authenticated;

comment on function public.fn_criar_aposta_multipla(jsonb) is
  'Cria aposta múltipla com N seleções em uma única transação.';
