-- =============================================================================
-- Smart Bet · 0007 · Seeds idempotentes dos catalogos globais
-- =============================================================================

insert into public.esportes (slug, nome) values
  ('futebol',  'Futebol'),
  ('basquete', 'Basquete'),
  ('tenis',    'Tenis'),
  ('volei',    'Volei')
on conflict (slug) do nothing;

do $$
declare
  v_futebol_id smallint;
begin
  select id into v_futebol_id from public.esportes where slug = 'futebol';

  insert into public.tipos_aposta (esporte_id, categoria, slug, nome, descricao) values
    (v_futebol_id, 'Resultado',      'resultado-final-1x2',      'Resultado Final 1X2',         'Vitoria mandante / empate / vitoria visitante.'),
    (v_futebol_id, 'Resultado',      'dupla-chance',             'Dupla Chance',                '1X, 12 ou X2.'),
    (v_futebol_id, 'Resultado',      'empate-anula-aposta',      'Empate Anula Aposta (DNB)',   'Aposta no vencedor: se empatar, stake devolvida.'),
    (v_futebol_id, 'Gols',           'ambas-marcam',             'Ambas Marcam (BTTS)',         'Ambos os times marcam ao menos 1 gol.'),
    (v_futebol_id, 'Gols',           'mais-de-meio-gol',          'Mais de 0.5 gol',             'Pelo menos 1 gol na partida.'),
    (v_futebol_id, 'Gols',           'mais-de-1-5-gols',          'Mais de 1.5 gols',            'Pelo menos 2 gols.'),
    (v_futebol_id, 'Gols',           'mais-de-2-5-gols',          'Mais de 2.5 gols',            'Pelo menos 3 gols.'),
    (v_futebol_id, 'Gols',           'menos-de-2-5-gols',         'Menos de 2.5 gols',           'No maximo 2 gols.'),
    (v_futebol_id, 'Gols',           'over-under-personalizado',  'Over/Under Personalizado',    'Linha de gols parametrizada.'),
    (v_futebol_id, 'Escanteios',     'total-escanteios',          'Total de Escanteios',         'Over/Under de escanteios.'),
    (v_futebol_id, 'Cartoes',        'total-cartoes',             'Total de Cartoes',            'Over/Under de cartoes.'),
    (v_futebol_id, 'Handicap',       'handicap-asiatico',         'Handicap Asiatico',           'Handicap com linhas de 0.25 em 0.25.'),
    (v_futebol_id, 'Handicap',       'handicap-europeu',          'Handicap Europeu',            'Handicap inteiro (1X2 com vantagem).'),
    (v_futebol_id, 'Jogador',        'jogador-marca',             'Jogador Marca',               'Anytime scorer.'),
    (v_futebol_id, 'Tempo',          'resultado-ht',              'Resultado Primeiro Tempo',    'Vencedor ou empate no intervalo.'),
    (v_futebol_id, 'Tempo',          'gols-ht',                   'Gols no Primeiro Tempo',      'Over/Under de gols no 1T.'),
    (v_futebol_id, 'Combinada',      'resultado-e-ambas',         'Resultado + Ambas Marcam',    'Combinacao classica 1X2 + BTTS.'),
    (v_futebol_id, 'Combinada',      'resultado-e-gols',          'Resultado + Total de Gols',   'Combinacao 1X2 + over/under.'),
    (v_futebol_id, 'Placar',         'placar-exato',              'Placar Exato',                'Correct score.')
  on conflict (esporte_id, slug) do nothing;
end$$;
