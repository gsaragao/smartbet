-- =============================================================================
-- Smart Bet · 0010 · Inclui schema `extensions` no search_path dos roles
-- =============================================================================
-- Motivação: a migration 0009 moveu o tipo `citext` para o schema `extensions`
-- (boa prática recomendada pelos advisors do Supabase). Porém, o PostgREST e os
-- roles expostos ao cliente (`anon`, `authenticated`, `service_role` e o
-- conector `authenticator`) possuem um `search_path` restrito que não inclui
-- `extensions`. Quando o PostgREST tenta fazer casts implícitos/explícitos para
-- `citext` em colunas como `slug` (ex.: inserts/updates em `tipos_aposta`), o
-- servidor levanta o erro `type "public.citext" does not exist`.
--
-- Ajustamos o `search_path` explicitamente para esses roles, preservando
-- `public` como schema padrão e adicionando `extensions` para resolução de
-- tipos e operadores. Isso replica o comportamento que o Supabase já aplica
-- em projetos novos.
-- =============================================================================

alter role authenticator set search_path = public, extensions;
alter role anon          set search_path = public, extensions;
alter role authenticated set search_path = public, extensions;
alter role service_role  set search_path = public, extensions;

-- Força o PostgREST a recarregar o schema cache com o novo search_path.
notify pgrst, 'reload schema';
