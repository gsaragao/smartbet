-- =============================================================================
-- Smart Bet · 0022 · CHECK de sinal em eventos_banca aceita 'aposta'
-- =============================================================================
-- Precisa vir em migration separada do ALTER TYPE ... ADD VALUE, pois o novo
-- valor do enum só fica visível em uma nova transação.
-- =============================================================================

alter table public.eventos_banca
  drop constraint if exists chk_eventos_banca_sinal_por_tipo;

alter table public.eventos_banca
  add constraint chk_eventos_banca_sinal_por_tipo
  check (
    (tipo = 'deposito'      and valor > 0)
    or (tipo = 'saque'      and valor < 0)
    or (tipo = 'ajuste'     and valor <> 0)
    or (tipo = 'saldo_inicial' and valor >= 0)
    or (tipo = 'aposta'     and valor <> 0)
  );
