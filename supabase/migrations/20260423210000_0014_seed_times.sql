-- =============================================================================
-- Smart Bet · 0014 · Seed idempotente de times
-- -----------------------------------------------------------------------------
-- Populamos os clubes mais relevantes para começar a usar o produto:
--   · Série A brasileira 2026 completa (20 clubes).
--   · Top 5 clubes ingleses, espanhóis, italianos, alemães e franceses.
--   · Clubes argentinos relevantes (Libertadores).
--
-- Resolvemos os FKs via subqueries para manter portabilidade entre ambientes.
-- `escudo_url` fica null por padrão — o usuário preenche pelo admin.
-- =============================================================================

insert into public.times (esporte_id, pais_id, nome, slug, escudo_url)
select
  (select id from public.esportes where slug = 'futebol'),
  (select id from public.paises where codigo_iso = src.iso),
  src.nome,
  src.slug,
  null
from (values
  -- Brasil — Série A 2026
  ('BR', 'Flamengo',       'flamengo'),
  ('BR', 'Palmeiras',      'palmeiras'),
  ('BR', 'Corinthians',    'corinthians'),
  ('BR', 'São Paulo',      'sao-paulo'),
  ('BR', 'Santos',         'santos'),
  ('BR', 'Fluminense',     'fluminense'),
  ('BR', 'Vasco da Gama',  'vasco-da-gama'),
  ('BR', 'Botafogo',       'botafogo'),
  ('BR', 'Atlético-MG',    'atletico-mg'),
  ('BR', 'Cruzeiro',       'cruzeiro'),
  ('BR', 'Grêmio',         'gremio'),
  ('BR', 'Internacional',  'internacional'),
  ('BR', 'Athletico-PR',   'athletico-pr'),
  ('BR', 'Bahia',          'bahia'),
  ('BR', 'Fortaleza',      'fortaleza'),
  ('BR', 'Ceará',          'ceara'),
  ('BR', 'Sport',          'sport'),
  ('BR', 'Vitória',        'vitoria'),
  ('BR', 'Juventude',      'juventude'),
  ('BR', 'Mirassol',       'mirassol'),

  -- Inglaterra — Premier League big six + outros
  ('GB', 'Manchester City',  'manchester-city'),
  ('GB', 'Arsenal',          'arsenal'),
  ('GB', 'Liverpool',        'liverpool'),
  ('GB', 'Manchester United','manchester-united'),
  ('GB', 'Chelsea',          'chelsea'),
  ('GB', 'Tottenham',        'tottenham'),
  ('GB', 'Newcastle',        'newcastle'),
  ('GB', 'Aston Villa',      'aston-villa'),

  -- Espanha
  ('ES', 'Real Madrid',     'real-madrid'),
  ('ES', 'Barcelona',       'barcelona'),
  ('ES', 'Atletico Madrid', 'atletico-madrid'),
  ('ES', 'Sevilla',         'sevilla'),
  ('ES', 'Real Betis',      'real-betis'),
  ('ES', 'Athletic Bilbao', 'athletic-bilbao'),
  ('ES', 'Villarreal',      'villarreal'),

  -- Itália
  ('IT', 'Juventus',   'juventus'),
  ('IT', 'Inter',      'inter'),
  ('IT', 'Milan',      'milan'),
  ('IT', 'Napoli',     'napoli'),
  ('IT', 'Roma',       'roma'),
  ('IT', 'Lazio',      'lazio'),
  ('IT', 'Atalanta',   'atalanta'),

  -- Alemanha
  ('DE', 'Bayern Munich',     'bayern-munich'),
  ('DE', 'Borussia Dortmund', 'borussia-dortmund'),
  ('DE', 'RB Leipzig',        'rb-leipzig'),
  ('DE', 'Bayer Leverkusen',  'bayer-leverkusen'),

  -- França
  ('FR', 'Paris Saint-Germain', 'paris-saint-germain'),
  ('FR', 'Marseille',           'marseille'),
  ('FR', 'Lyon',                'lyon'),
  ('FR', 'Monaco',              'monaco'),

  -- Portugal
  ('PT', 'Benfica',     'benfica'),
  ('PT', 'Porto',       'porto'),
  ('PT', 'Sporting CP', 'sporting-cp'),

  -- Argentina
  ('AR', 'Boca Juniors',  'boca-juniors'),
  ('AR', 'River Plate',   'river-plate'),
  ('AR', 'Racing Club',   'racing-club'),
  ('AR', 'Independiente', 'independiente'),

  -- Holanda
  ('NL', 'Ajax',      'ajax'),
  ('NL', 'PSV',       'psv'),
  ('NL', 'Feyenoord', 'feyenoord')
) as src(iso, nome, slug)
on conflict (esporte_id, slug) do nothing;
