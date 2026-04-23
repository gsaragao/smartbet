-- =============================================================================
-- Smart Bet · 0015 · Evolução da tabela `estrategias` (v2)
-- -----------------------------------------------------------------------------
-- A base criada em 0004 cobre o MVP mais superficial. Esta migration expande
-- o modelo para suportar:
--   • Status rico (ativa/pausada/arquivada) no lugar de um boolean.
--   • Tags livres + contextos (pre_live, ao_vivo) para discriminar onde a
--     estratégia se aplica.
--   • Parâmetros dedicados para estratégias ao-vivo (minuto mínimo).
--   • Configuração de EV+ (edge mínimo).
--   • Configuração de banca de referência para gestão (saldo_atual / inicial /
--     média móvel de 7 dias).
--   • Stop-loss (por reds consecutivos e/ou por % da banca).
--   • Guardrails de alerta (drawdown, reds, yield) — não auto-pausam no MVP.
--   • Lembretes de revisão periódica (por N apostas OU X dias).
--   • AST serializado das regras de entrada (builder estruturado) + versão.
--   • Link pai→filha para experimentos A/B.
--
-- É seguro alterar esporte_id para NOT NULL porque o produto ainda não tem
-- dados: `select count(*) from public.estrategias` retorna 0. Se no futuro
-- quisermos estratégias multi-esporte, subimos uma tabela de junção dedicada
-- e mantemos a FK principal como "esporte primário".
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Novo enum de status (preserva o `boolean ativa` até migrarmos os dados)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'status_estrategia') then
    create type public.status_estrategia as enum ('ativa', 'pausada', 'arquivada');
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- 2. Colunas novas em `estrategias`
-- -----------------------------------------------------------------------------
alter table public.estrategias
  add column if not exists status               public.status_estrategia not null default 'ativa',
  add column if not exists tags                 text[]                   not null default '{}',
  add column if not exists contextos            text[]                   not null default '{pre_live,ao_vivo}',
  add column if not exists minuto_minimo        smallint,
  add column if not exists edge_minimo          numeric(5,2),
  add column if not exists banca_referencia     text                     not null default 'saldo_atual',
  add column if not exists stop_loss_reds       smallint,
  add column if not exists stop_loss_banca_pct  numeric(5,2),
  add column if not exists drawdown_alerta_pct  numeric(5,2),
  add column if not exists reds_consec_alerta   smallint,
  add column if not exists yield_minimo_alerta  numeric(5,2),
  add column if not exists revisao_apos_apostas smallint,
  add column if not exists revisao_apos_dias    smallint,
  add column if not exists regras_jsonb         jsonb                    not null default '{"tipo":"grupo","operador":"AND","filhos":[]}'::jsonb,
  add column if not exists regras_versao        smallint                 not null default 1,
  add column if not exists estrategia_pai_id    uuid                     references public.estrategias(id) on delete set null,
  add column if not exists arquivada_em         timestamptz;

-- -----------------------------------------------------------------------------
-- 3. Backfill do status a partir do boolean `ativa` (se a coluna ainda existir)
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'estrategias'
       and column_name  = 'ativa'
  ) then
    update public.estrategias
       set status = case when ativa then 'ativa'::public.status_estrategia
                         else 'pausada'::public.status_estrategia
                    end
     where status is null;

    alter table public.estrategias drop column ativa;
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- 4. Constraints e normalizações
-- -----------------------------------------------------------------------------

-- esporte_id passa a ser obrigatório (decisão 8 — 1 esporte por estratégia).
-- Como a tabela está vazia, não há risco de quebrar nada.
alter table public.estrategias
  alter column esporte_id set not null;

-- Banca de referência deve estar dentro do conjunto conhecido.
alter table public.estrategias
  drop constraint if exists chk_estrategias_banca_referencia;

alter table public.estrategias
  add constraint chk_estrategias_banca_referencia
  check (banca_referencia in ('saldo_atual', 'saldo_inicial', 'media_7d'));

-- Contextos só podem conter valores conhecidos.
alter table public.estrategias
  drop constraint if exists chk_estrategias_contextos_validos;

alter table public.estrategias
  add constraint chk_estrategias_contextos_validos
  check (
    contextos <@ array['pre_live','ao_vivo']::text[]
    and array_length(contextos, 1) >= 1
  );

-- Minuto mínimo faz sentido apenas dentro da faixa 0..120 (inclui prorrogação).
alter table public.estrategias
  drop constraint if exists chk_estrategias_minuto_minimo;

alter table public.estrategias
  add constraint chk_estrategias_minuto_minimo
  check (minuto_minimo is null or (minuto_minimo between 0 and 120));

-- Percentuais de guardrail/stop-loss ficam entre 0 e 100.
alter table public.estrategias
  drop constraint if exists chk_estrategias_percentuais_guardrail;

alter table public.estrategias
  add constraint chk_estrategias_percentuais_guardrail
  check (
    (drawdown_alerta_pct is null or drawdown_alerta_pct between 0 and 100)
    and (stop_loss_banca_pct is null or stop_loss_banca_pct between 0 and 100)
    and (yield_minimo_alerta is null or yield_minimo_alerta between -100 and 100)
    and (edge_minimo is null or edge_minimo between 0 and 100)
  );

-- Estratégia não pode ser pai de si mesma.
alter table public.estrategias
  drop constraint if exists chk_estrategias_pai_nao_self;

alter table public.estrategias
  add constraint chk_estrategias_pai_nao_self
  check (estrategia_pai_id is null or estrategia_pai_id <> id);

-- Uma estratégia arquivada precisa ter `arquivada_em` preenchido (e vice-versa)
-- — simplifica relatórios históricos.
alter table public.estrategias
  drop constraint if exists chk_estrategias_arquivada_em_coerente;

alter table public.estrategias
  add constraint chk_estrategias_arquivada_em_coerente
  check (
    (status = 'arquivada' and arquivada_em is not null)
    or (status <> 'arquivada' and arquivada_em is null)
  );

-- Unicidade de nome por usuário. Permite seed de templates + um template
-- duplicado com outro nome pelo usuário. Usa citext seria ideal, mas como
-- `nome` é text simples aqui, comparação com lower() resolve.
drop index if exists ux_estrategias_usuario_nome_lower;

create unique index ux_estrategias_usuario_nome_lower
  on public.estrategias (usuario_id, lower(nome));

-- -----------------------------------------------------------------------------
-- 5. Índices adicionais para consultas do produto
-- -----------------------------------------------------------------------------
create index if not exists ix_estrategias_tags_gin
  on public.estrategias using gin (tags);

create index if not exists ix_estrategias_usuario_status
  on public.estrategias (usuario_id, status);

create index if not exists ix_estrategias_pai
  on public.estrategias (estrategia_pai_id)
  where estrategia_pai_id is not null;

comment on column public.estrategias.status              is 'Ciclo de vida: ativa | pausada | arquivada.';
comment on column public.estrategias.tags               is 'Etiquetas livres para categorização (ex.: over, ht, pre-live).';
comment on column public.estrategias.contextos          is 'Contextos de aplicação permitidos: pre_live, ao_vivo ou ambos.';
comment on column public.estrategias.minuto_minimo      is 'Minuto mínimo do jogo para considerar a estratégia (usado em ao-vivo).';
comment on column public.estrategias.edge_minimo        is 'Edge mínimo (EV%) aceitável para entrar na aposta.';
comment on column public.estrategias.banca_referencia   is 'Base de cálculo para gestão: saldo_atual | saldo_inicial | media_7d.';
comment on column public.estrategias.regras_jsonb       is 'AST do builder de regras: grupos AND/OR aninhados com condições (campo, operador, valor).';
comment on column public.estrategias.regras_versao      is 'Versão atual do `regras_jsonb`. Incrementa ao editar as regras.';
comment on column public.estrategias.estrategia_pai_id  is 'Link pai→filha em experimentos A/B (a filha aponta para a mãe).';
