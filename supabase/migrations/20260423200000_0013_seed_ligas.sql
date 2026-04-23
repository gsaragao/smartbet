-- =============================================================================
-- Smart Bet · 0013 · Seed idempotente de ligas
-- -----------------------------------------------------------------------------
-- Populamos as competições mais relevantes para o MVP (focado em futebol).
-- Usamos subqueries por slug/codigo_iso para resolver os FKs — assim a seed
-- permanece portável entre ambientes onde os IDs podem divergir.
--
-- Ligas internacionais (Champions, Libertadores) ficam com `pais_id = null`
-- para não forçar a escolha arbitrária de um país "sede".
-- =============================================================================

insert into public.ligas (esporte_id, pais_id, nome, slug, temporada, ativo)
select
  (select id from public.esportes where slug = 'futebol'),
  (select id from public.paises where codigo_iso = src.iso),
  src.nome,
  src.slug,
  src.temporada,
  true
from (values
  -- (pais_iso, nome, slug, temporada)
  ('BR', 'Brasileirao Serie A',   'brasileirao-serie-a',   '2026'),
  ('BR', 'Brasileirao Serie B',   'brasileirao-serie-b',   '2026'),
  ('BR', 'Copa do Brasil',        'copa-do-brasil',        '2026'),
  ('GB', 'Premier League',        'premier-league',        '2025-26'),
  ('ES', 'La Liga',               'la-liga',               '2025-26'),
  ('IT', 'Serie A',               'serie-a-italia',        '2025-26'),
  ('DE', 'Bundesliga',            'bundesliga',            '2025-26'),
  ('FR', 'Ligue 1',               'ligue-1',               '2025-26'),
  ('PT', 'Primeira Liga',         'primeira-liga',         '2025-26'),
  ('AR', 'Liga Profesional',      'liga-profesional',      '2026'),
  ('US', 'MLS',                   'mls',                   '2026'),
  ('SA', 'Saudi Pro League',      'saudi-pro-league',      '2025-26')
) as src(iso, nome, slug, temporada)
on conflict (esporte_id, slug) do nothing;

-- Competicoes internacionais — sem pais_id.
insert into public.ligas (esporte_id, pais_id, nome, slug, temporada, ativo)
select
  (select id from public.esportes where slug = 'futebol'),
  null,
  src.nome,
  src.slug,
  src.temporada,
  true
from (values
  ('UEFA Champions League', 'uefa-champions-league', '2025-26'),
  ('UEFA Europa League',    'uefa-europa-league',    '2025-26'),
  ('Copa Libertadores',     'copa-libertadores',     '2026'),
  ('Copa Sul-Americana',    'copa-sul-americana',    '2026')
) as src(nome, slug, temporada)
on conflict (esporte_id, slug) do nothing;
