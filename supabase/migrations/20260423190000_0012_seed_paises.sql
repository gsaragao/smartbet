-- =============================================================================
-- Smart Bet · 0012 · Seed idempotente de paises
-- -----------------------------------------------------------------------------
-- Lista enxuta cobrindo as principais ligas de futebol mundial. Codigos em
-- ISO-3166 alpha-2 para permitir render de bandeira via emoji (regional
-- indicator) sem depender de assets. Nomes em pt-BR porque a app inteira esta
-- localizada nesse idioma.
-- =============================================================================

insert into public.paises (codigo_iso, nome) values
  ('BR', 'Brasil'),
  ('AR', 'Argentina'),
  ('UY', 'Uruguai'),
  ('CL', 'Chile'),
  ('CO', 'Colombia'),
  ('MX', 'Mexico'),
  ('US', 'Estados Unidos'),
  ('GB', 'Reino Unido'),
  ('ES', 'Espanha'),
  ('PT', 'Portugal'),
  ('IT', 'Italia'),
  ('DE', 'Alemanha'),
  ('FR', 'Franca'),
  ('NL', 'Holanda'),
  ('BE', 'Belgica'),
  ('TR', 'Turquia'),
  ('SA', 'Arabia Saudita'),
  ('JP', 'Japao'),
  ('KR', 'Coreia do Sul')
on conflict (codigo_iso) do nothing;
