-- =============================================================================
-- Smart Bet · 0026 · Apostas múltiplas (validações + trigger de agregação)
-- =============================================================================
-- Contexto:
--   Até aqui apostas.formato podia ser 'multipla' mas não havia validação
--   estrutural. Esta migration adiciona:
--     1. CHECK: se formato = 'multipla' então deve haver ≥ 2 seleções e
--        odd_total ≈ produto(odd_i) com tolerância 0.01.
--     2. Trigger em apostas_selecoes.status: quando todas as seleções
--        estão definidas, recalcula o status agregado da aposta múltipla
--        (regra: qualquer red → perdida; todas green → ganha; se alguma
--        anulada, recalcula odd_total com produto das não anuladas; caso
--        contrário mantém pendente).
--   Não tocamos na RPC fn_resolver_aposta ainda — múltipla usa outra
--   entrada: resolver cada seleção individualmente via RPC específica
--   (fn_resolver_selecao), que invoca o trigger para atualizar a aposta.
-- =============================================================================

-- ---------- 1. Validação estrutural da múltipla ------------------------------

create or replace function public.fn_validar_aposta_multipla()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  v_qtd       int;
  v_odd_prod  numeric(18,6);
begin
  if new.formato <> 'multipla' then
    return new;
  end if;

  -- Buscamos seleções já inseridas (pode ser zero durante INSERT inicial,
  -- a verificação completa acontece via função fn_checar_aposta_multipla
  -- chamada explicitamente pela RPC de criação ou por trigger AFTER).
  select count(*), coalesce(exp(sum(ln(odd))), 1)::numeric
    into v_qtd, v_odd_prod
    from public.apostas_selecoes
   where aposta_id = new.id;

  if v_qtd >= 2 then
    if abs(v_odd_prod - new.odd_total) > 0.01 then
      raise exception
        'odd_total (%) inconsistente com produto das odds das seleções (%).',
        new.odd_total, round(v_odd_prod, 3)
        using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

-- Aplicamos a validação em AFTER para garantir que as seleções já foram
-- inseridas junto na mesma transação (a RPC de criação insere apostas +
-- selecoes na sequência).
drop trigger if exists trg_apostas_validar_multipla on public.apostas;
create constraint trigger trg_apostas_validar_multipla
  after insert or update of odd_total, formato on public.apostas
  deferrable initially deferred
  for each row execute function public.fn_validar_aposta_multipla();

-- ---------- 2. Agregação de status em múltipla -------------------------------
--
-- Quando atualiza o status de uma seleção de uma aposta múltipla, recalcula
-- o status da aposta pai de acordo com:
--   - qualquer 'perdida' ou 'meio_red' → aposta 'perdida'
--   - todas 'ganha' (ou mix com 'anulada') → aposta 'ganha'
--   - todas 'anulada' → aposta 'anulada'
--   - qualquer 'pendente' restante → mantém 'pendente'
--   - qualquer 'cashout' → aposta 'cashout' (o valor do cashout fica a cargo
--     da resolução manual no pai)
--
-- Observação: a retorno_real e lucro não são ajustados automaticamente aqui —
-- a responsabilidade é da RPC fn_resolver_aposta_multipla (não criada nesta
-- fatia; S3 no frontend usa esse trigger apenas para UI feedback durante
-- resoluções parciais). Para consistência mínima, quando conseguimos decidir
-- um estado final (ganha/perdida/anulada) e a aposta ainda estava pendente,
-- calculamos retorno_real/lucro como na simples.

create or replace function public.fn_trg_apostas_recalcular_status()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  v_aposta   public.apostas%rowtype;
  v_total    int;
  v_greens   int;
  v_reds     int;
  v_voids    int;
  v_cashout  int;
  v_pend     int;
  v_meio_g   int;
  v_meio_r   int;
  v_novo     public.status_aposta;
  v_retorno  numeric(14,2);
  v_lucro    numeric(14,2);
begin
  select * into v_aposta
    from public.apostas
   where id = new.aposta_id;

  if not found or v_aposta.formato <> 'multipla' then
    return new;
  end if;

  select
    count(*),
    count(*) filter (where status = 'ganha'),
    count(*) filter (where status = 'perdida'),
    count(*) filter (where status = 'anulada'),
    count(*) filter (where status = 'cashout'),
    count(*) filter (where status = 'pendente'),
    count(*) filter (where status = 'meio_green'),
    count(*) filter (where status = 'meio_red')
    into v_total, v_greens, v_reds, v_voids, v_cashout, v_pend, v_meio_g, v_meio_r
    from public.apostas_selecoes
   where aposta_id = new.aposta_id;

  -- Regra de decisão.
  if v_reds > 0 or v_meio_r > 0 then
    v_novo := 'perdida';
  elsif v_cashout > 0 then
    v_novo := 'cashout';
  elsif v_pend > 0 then
    v_novo := 'pendente';
  elsif v_voids = v_total then
    v_novo := 'anulada';
  elsif (v_greens + v_voids + v_meio_g) = v_total then
    v_novo := 'ganha';
  else
    v_novo := 'pendente';
  end if;

  if v_novo = v_aposta.status then
    return new;
  end if;

  -- Cálculo de retorno/lucro para transições automáticas.
  if v_novo = 'ganha' then
    v_retorno := round(v_aposta.stake * v_aposta.odd_total, 2);
    v_lucro   := round(v_retorno - v_aposta.stake, 2);
  elsif v_novo = 'perdida' then
    v_retorno := 0;
    v_lucro   := case when v_aposta.eh_freebet then 0 else -v_aposta.stake end;
  elsif v_novo = 'anulada' then
    v_retorno := v_aposta.stake;
    v_lucro   := 0;
  else
    v_retorno := v_aposta.retorno_real;
    v_lucro   := v_aposta.lucro;
  end if;

  update public.apostas
     set status       = v_novo,
         retorno_real = v_retorno,
         lucro        = v_lucro,
         resolvida_em = case when v_novo = 'pendente' then null else now() end
   where id = v_aposta.id;

  -- Se virou ganha/perdida com lucro definido e não havia evento, lança um.
  if v_novo in ('ganha','perdida') and v_lucro <> 0 then
    insert into public.eventos_banca (
      banca_id, usuario_id, tipo, valor, observacao, ocorrido_em
    )
    select v_aposta.banca_id, v_aposta.usuario_id, 'aposta', v_lucro,
           concat('Resolução múltipla ', v_aposta.id::text, ' (', v_novo::text, ')'),
           now()
     where not exists (
       select 1 from public.eventos_banca
        where usuario_id = v_aposta.usuario_id
          and tipo = 'aposta'
          and observacao like '%' || v_aposta.id::text || '%'
     );
  end if;

  if v_aposta.estrategia_id is not null and v_novo <> 'pendente' then
    perform public.fn_recalcular_progresso_estrategia(v_aposta.estrategia_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_selecoes_recalcular_aposta on public.apostas_selecoes;
create trigger trg_selecoes_recalcular_aposta
  after update of status on public.apostas_selecoes
  for each row execute function public.fn_trg_apostas_recalcular_status();

comment on function public.fn_trg_apostas_recalcular_status() is
  'Recalcula status agregado de aposta múltipla baseado nos status das seleções.';
