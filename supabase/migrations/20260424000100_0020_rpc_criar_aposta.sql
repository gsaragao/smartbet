-- =============================================================================
-- Smart Bet · 0020 · RPC fn_criar_aposta_simples (modo híbrido de partida)
-- =============================================================================
-- Contexto:
--   A UI de "Registrar aposta" precisa, em uma única transação:
--     1. Resolver a partida (reusar `partida_id` existente OU criar uma nova
--        a partir de dados livres/autocomplete de times).
--     2. Inserir em `apostas`.
--     3. Inserir 1 linha em `apostas_selecoes`.
--
--   Fazer isso em 3 requests separados do cliente aumenta o risco de
--   inconsistência (ex.: criar partida e falhar no insert da aposta).
--   Então concentramos em uma RPC `security definer` que valida RLS na mão
--   (auth.uid() == usuario_id) e faz tudo em um único BEGIN/COMMIT.
--
-- Formato do payload (jsonb):
--   {
--     "banca_id": "uuid",
--     "estrategia_id": "uuid" | null,
--     "stake": 100.00,
--     "odd_total": 1.85,
--     "eh_freebet": false,
--     "casa_de_aposta": "Bet365" | null,
--     "descricao": "..." | null,
--     "observacao": "..." | null,
--     "estrategia_override": false,
--     "motivo_override": null,
--     "edge": null,
--     "valor_esperado": null,
--     "selecao": {
--       "partida": { ... },  -- ver abaixo
--       "tipo_aposta_id": 3,
--       "linha": "2.5" | null,
--       "odd": 1.85,
--       "descricao": "Over 2.5 gols"
--     }
--   }
--
-- Formato do campo "partida":
--   A) { "kind": "existing", "partida_id": "uuid" }
--   B) { "kind": "new",
--        "mandante_nome": "Arabia",
--        "visitante_nome": "Haiti",
--        "time_mandante_id": 12 | null,
--        "time_visitante_id": 34 | null,
--        "liga_id": 5 | null,
--        "esporte_id": 1,
--        "inicio": "2026-04-24T20:00:00Z" }
-- =============================================================================

create or replace function public.fn_criar_aposta_simples(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id        uuid := auth.uid();
  v_banca_id       uuid;
  v_estrategia_id  uuid;
  v_partida_id     uuid;
  v_aposta_id      uuid;

  v_selecao        jsonb;
  v_partida        jsonb;
  v_partida_kind   text;
begin
  if v_user_id is null then
    raise exception 'Não autenticado.' using errcode = '28000';
  end if;

  v_banca_id      := nullif(payload->>'banca_id','')::uuid;
  v_estrategia_id := nullif(payload->>'estrategia_id','')::uuid;

  if v_banca_id is null then
    raise exception 'banca_id é obrigatório.' using errcode = '22023';
  end if;

  -- Confirma que a banca pertence ao usuário. Sem isso, qualquer payload
  -- forjado poderia escrever numa banca alheia (security definer pula RLS).
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

  v_selecao := payload->'selecao';
  if v_selecao is null then
    raise exception 'selecao é obrigatória.' using errcode = '22023';
  end if;

  v_partida       := v_selecao->'partida';
  v_partida_kind  := v_partida->>'kind';

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
      usuario_id,
      esporte_id,
      liga_id,
      time_mandante_id,
      time_visitante_id,
      mandante_nome,
      visitante_nome,
      inicio
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
    raise exception 'partida.kind inválido (use "existing" ou "new").'
      using errcode = '22023';
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
    'simples',
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

  insert into public.apostas_selecoes (
    aposta_id,
    usuario_id,
    partida_id,
    tipo_aposta_id,
    descricao,
    linha,
    odd,
    status
  )
  values (
    v_aposta_id,
    v_user_id,
    v_partida_id,
    nullif(v_selecao->>'tipo_aposta_id','')::smallint,
    coalesce(nullif(v_selecao->>'descricao',''), 'Seleção'),
    nullif(v_selecao->>'linha',''),
    (v_selecao->>'odd')::numeric,
    'pendente'
  );

  return v_aposta_id;
end;
$$;

revoke all on function public.fn_criar_aposta_simples(jsonb) from public;
grant execute on function public.fn_criar_aposta_simples(jsonb) to authenticated;

comment on function public.fn_criar_aposta_simples(jsonb) is
  'Cria uma aposta simples em 1 transacao: resolve/cria partida, insere em apostas e apostas_selecoes.';
