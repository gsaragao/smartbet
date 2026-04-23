-- =============================================================================
-- Smart Bet · 0021 · Enum tipo_evento_banca ganha o valor 'aposta'
-- =============================================================================
-- Contexto:
--   Quando uma aposta é resolvida (ganha/perdida/meio_green/meio_red/cashout),
--   lançamos em `eventos_banca` um evento do tipo 'aposta' cujo `valor` é o
--   LUCRO da aposta (positivo para green, negativo para red, zero nunca — por
--   CHECK). Isso mantém uma única fonte de verdade para o saldo via o trigger
--   em 0011.
--
--   `anulada` NÃO gera evento (saldo volta ao original por definição).
--   `cashout` lança o lucro real informado pelo usuário.
-- =============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'tipo_evento_banca'
      and e.enumlabel = 'aposta'
  ) then
    alter type public.tipo_evento_banca add value 'aposta';
  end if;
end$$;
