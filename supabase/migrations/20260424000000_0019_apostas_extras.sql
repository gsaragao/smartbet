-- =============================================================================
-- Smart Bet · 0019 · Apostas — colunas auxiliares (override, edge, EV, índice)
-- =============================================================================
-- Contexto:
--   A feature de Apostas (S1) registra apostas SIMPLES com validação bloqueante
--   contra as regras da estratégia vinculada. Quando o usuário quer salvar
--   fora do escopo, precisa marcar explicitamente `estrategia_override = true`
--   E informar um `motivo_override`. Isso mantém a disciplina sem impedir
--   exceções conscientes.
--
--   As colunas `edge` e `valor_esperado` são persistidas para permitir
--   análises retroativas (quando a aposta foi registrada com edge baixo?
--   o EV previsto bateu com o resultado?).
--
--   Índice parcial em apostas pendentes acelera a listagem principal.
-- =============================================================================

alter table public.apostas
  add column if not exists estrategia_override  boolean        not null default false,
  add column if not exists motivo_override      text,
  add column if not exists edge                 numeric(6,4),
  add column if not exists valor_esperado       numeric(14,2);

-- Se override = true, motivo é obrigatório. Se override = false, motivo é ignorado.
do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'chk_apostas_motivo_override_quando_override'
       and conrelid = 'public.apostas'::regclass
  ) then
    alter table public.apostas
      add constraint chk_apostas_motivo_override_quando_override
      check (
        estrategia_override = false
        or (estrategia_override = true and motivo_override is not null and length(btrim(motivo_override)) > 0)
      );
  end if;
end$$;

-- Override só faz sentido quando há estratégia vinculada.
do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'chk_apostas_override_exige_estrategia'
       and conrelid = 'public.apostas'::regclass
  ) then
    alter table public.apostas
      add constraint chk_apostas_override_exige_estrategia
      check (
        estrategia_override = false
        or (estrategia_override = true and estrategia_id is not null)
      );
  end if;
end$$;

create index if not exists ix_apostas_pendentes
  on public.apostas(usuario_id, colocada_em desc)
  where status = 'pendente';

comment on column public.apostas.estrategia_override is
  'Quando true, a aposta foi registrada fora das regras da estrategia (requer motivo).';
comment on column public.apostas.motivo_override is
  'Motivo obrigatorio quando estrategia_override = true.';
comment on column public.apostas.edge is
  'Edge (vantagem) calculada no momento da entrada, em pontos percentuais (ex: 0.05 = 5%).';
comment on column public.apostas.valor_esperado is
  'Valor Esperado (EV+) monetario calculado no momento da entrada.';
