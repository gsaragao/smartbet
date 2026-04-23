---
name: Smart Bet MVP
overview: Sistema web pessoal para registro e análise de apostas esportivas com foco em estratégias, construído em Next.js + Supabase. MVP enxuto com CRUDs completos, controle de banca e dashboard analítico, preparando terreno para as fases futuras (EV+, motor de regras ao vivo, notificações push).
todos:
  - id: 1-setup
    content: Inicializar projeto Next.js 16 + TS + Tailwind v4 + shadcn/ui, configurar ESLint/Prettier/Husky + lint-staged, criar estrutura de pastas, .env.example, .gitattributes e git local com primeiro commit
    status: completed
  - id: 2-supabase
    content: Criar projeto Supabase, configurar cliente (client/server/middleware), Auth (login/registro/logout) e proteger rotas (app)
    status: completed
  - id: 3-schema
    content: 'Migrations do schema completo: sports, countries, leagues, teams, bet_types, bookmakers, strategies (com stake_method e stake_config), strategy_progress, matches, bets (com outcome estendido, is_free_bet, legs_won/lost), bet_legs, bankroll_events, user_settings — todos com RLS + triggers de banca + trigger de progressão'
    status: completed
  - id: 4-seed
    content: 'Seed rico extraído da planilha real: Futebol como esporte, 20+ bet_types (Match Odd, DNB, Dupla Chance, Ambas Marcam, Over/Under 0.5/1.5/2.5/3.5/4.5, Handicap Europeu, Handicap Asiático, Gols Asiáticos, Match Odd+Both Score, Match Odd+Gols, Resultado Exato, Cartões, 2/1, Double Chance), principais casas de apostas BR'
    status: pending
  - id: 5-types
    content: Gerar tipos TypeScript do Supabase e criar schemas Zod correspondentes em lib/validators
    status: completed
  - id: 6-layout
    content: Construir layout autenticado (sidebar + header + breadcrumbs) com navegação para todas as seções
    status: completed
  - id: 7-settings
    content: 'Tela de Settings: saldo inicial, moeda, timezone; onboarding para primeiro acesso'
    status: pending
  - id: 8-catalog
    content: 'CRUDs de catálogo: sports, countries, leagues, teams, bet_types, bookmakers (listagem + form + delete com confirm)'
    status: pending
  - id: 9-strategies
    content: 'CRUD de Strategies com seletor de stake_method (fixed/progression/percent_bankroll) e editor específico de stake_config (ex.: array editável de sequência de progressão, % da banca, valor fixo) + página de detalhe com métricas e strategy_progress'
    status: completed
  - id: 10-matches
    content: 'CRUD de Matches (form: liga, times, data, status, placar FT e HT)'
    status: pending
  - id: 11-bets
    content: 'Form avançado de Bets: escolher estratégia (auto-preenche stake via calcNextStake, editável), toggle simples/múltipla, adicionar N legs dinâmicas, flags is_free_bet e cashout, cálculo automático de total_odd/potential_return, integração com triggers de banca e progressão'
    status: completed
  - id: 12-metrics
    content: 'Módulo lib/metrics completo: ROI, hit rate, yield, drawdown, curva de banca, profit por grupo, pior/melhor sequência, freeBetProfit, multipleOutcome XcYe — todos com testes unitários'
    status: pending
  - id: 12b-stake
    content: 'Módulo lib/stake: calcNextStake e advanceProgression para os 3 métodos de stake, com testes'
    status: pending
  - id: 13-bankroll
    content: 'Tela Bankroll: extrato de bankroll_events com filtros + ações manuais de depósito/saque/ajuste'
    status: completed
  - id: 13b-projection
    content: 'Tela Projeção: simulador e-se (banca, % ou stake fixo, odd média, hit rate, nº apostas) com gráfico de evolução projetada'
    status: pending
  - id: 14-dashboard
    content: 'Dashboard: KPIs (incl. pior sequência e recorde), curva de banca, lucro por estratégia, distribuição por tipo de aposta, lucro por campeonato, tabela das últimas 15 apostas com outcome colorido'
    status: pending
  - id: 15-polish
    content: Revisão de UX (estados de loading/empty/error), responsividade, acessibilidade básica, dark mode
    status: pending
  - id: 16-deploy
    content: Deploy Vercel + variáveis de ambiente, conectar Supabase Cloud, smoke test end-to-end e README final
    status: pending
isProject: false
---

## To-dos do MVP (18 itens — checklist)

Use esta lista no dia a dia (GitHub, VS Code, ou qualquer leitor Markdown). Os mesmos itens existem no **YAML** `todos:` no topo do arquivo para o Cursor.

**Legenda:** `[x]` concluído no código atual · `[ ]` ainda falta ou está só parcial (detalhe entre parênteses).

1. [x] **1-setup** — Inicializar projeto Next.js 16 + TS + Tailwind v4 + shadcn/ui, configurar ESLint/Prettier/Husky + lint-staged, criar estrutura de pastas, `.env.example`, `.gitattributes` e git local com primeiro commit.
2. [x] **2-supabase** — Criar projeto Supabase, configurar cliente (client/server/middleware), Auth (login/registro/logout) e proteger rotas (app).
3. [x] **3-schema** — Migrations do schema completo (no repo: nomes em PT-BR equivalentes a sports/countries/leagues/teams/bet_types/strategies/strategy_progress/matches/bets/bet_legs/bankroll_events, etc.) com RLS + triggers de banca + progressão/apostas via RPCs.
4. [ ] **4-seed** — Seed rico extraído da planilha real: Futebol, 20+ `tipos_aposta`, casas BR (hoje: seeds parciais; expandir ao nível do plano).
5. [x] **5-types** — Gerar tipos TypeScript do Supabase e schemas Zod (hoje em `src/features/*/schema.ts`; o plano citava `lib/validators` — alinhado conceitualmente).
6. [x] **6-layout** — Layout autenticado (sidebar + header + navegação); breadcrumbs onde fizer sentido.
7. [ ] **7-settings** — Tela de Settings: saldo inicial, moeda, timezone; onboarding primeiro acesso.
8. [ ] **8-catalog** — CRUDs de catálogo: admin com esportes, países, ligas, times, tipos de aposta **(parcial: falta entidade `bookmakers` + CRUD; casa como texto em aposta/banca).**
9. [x] **9-strategies** — CRUD de estratégias com `stake_method`, `stake_config`, regras, progresso e página de detalhe.
10. [ ] **10-matches** — CRUD de partidas dedicado (liga, times, data, status, placar FT/HT) **(parcial: PartidaPicker + fluxo em apostas; sem `/matches` central).**
11. [x] **11-bets** — Form avançado de apostas: estratégia, simples/múltipla, legs, freebet/cashout, odd total, integração banca/progresso (RPCs).
12. [ ] **12-metrics** — Módulo `lib/metrics`: ROI, hit rate, yield, drawdown, curva de banca, profit por grupo, sequências, freebet/múltipla XcYe — **com testes unitários.**
13. [ ] **12b-stake** — Módulo `lib/stake`: `calcNextStake` e `advanceProgression` — **com testes** e UX explícita de sugestão de stake no form.
14. [x] **13-bankroll** — Tela banca: extrato `eventos_banca` + depósito/saque/ajuste (rota `/banca`).
15. [ ] **13b-projection** — Tela Projeção: simulador “e se” com gráfico de evolução projetada.
16. [ ] **14-dashboard** — Dashboard completo: KPIs + curva de banca + lucro por estratégia/tipo/liga + últimas 15 apostas **(parcial: KPIs e resumo real; faltam gráficos/tabela do plano).**
17. [ ] **15-polish** — Revisão de UX (loading/empty/error), responsividade, a11y, dark mode **(parcial: já há padrões no app; revisão final pendente).**
18. [ ] **16-deploy** — Deploy Vercel + env, Supabase Cloud, smoke E2E, README de operação.

**Resumo:** 9 concluídos · 9 abertos (vários com entrega parcial anotada). Atualize os `[x]` / `[ ]` acima quando fechar cada item, e sincronize o `status:` no YAML se usar automação do Cursor.

---

# Smart Bet — Plano de Desenvolvimento

## Visão geral

Plataforma pessoal para transformar a gestão de apostas esportivas em um processo **quantitativo e orientado a dados**. A aposta deixa de ser "palpite" e passa a ser registrada dentro de uma **estratégia nomeada**, permitindo medir o que funciona e o que destrói a banca. Este plano cobre a **Fase 1 (MVP)**, com hooks arquiteturais preparados para Fases 2-4.

## Roadmap em 4 fases

- **Fase 1 (este plano)**: Registro manual, controle de banca, dashboard de métricas por estratégia.
- **Fase 2**: Coleta semiautomática de jogos da próxima rodada (fonte a definir).
- **Fase 3**: Estatísticas ao vivo + motor de regras com filtros Odd → Tempo → Estatísticas → EV+ → notificação push/WhatsApp.
- **Fase 4**: Execução (semi)automatizada de apostas a partir da notificação.

## Stack técnica (confirmada)

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts (gráficos)
- **Backend/DB**: Supabase (PostgreSQL + Auth + Row Level Security + Realtime + Storage)
- **Validação**: Zod
- **Forms**: React Hook Form
- **State server**: TanStack Query (cache de queries Supabase)
- **Utilitários**: date-fns, clsx, tailwind-merge
- **Deploy**: Vercel (frontend) + Supabase Cloud (backend)
- **Qualidade**: ESLint + Prettier + Husky + lint-staged

## Contexto extraído da planilha real do usuário

Análise da `Estrategias_bets.xlsx` (9 abas) revelou que o usuário é **apostador avançado** com estratégias sofisticadas. O modelo foi calibrado ao uso real:

- **Abas identificadas**: Desafio 5-10-20-40-80, Combo, Combo Mega Nocivo, Relatório Desafio, Apostas Ambas Marcam, Apostas 3x1, Projeção, Desafio 2-4-8-16-32, Estratégia Percentual da Banca.
- **Métodos de stake usados**: stake fixo, progressão escalonada (Martingale-like: 5→10→20→40→70→140→280→500→1000), percentual da banca.
- **Resultados de aposta usados**: green/red, **anulou/void, cash out, freebet (aposta grátis)**.
- **Múltiplas com formato XcYe**: rastreia quantas legs "certas" e "erradas" (ex.: `4c 3e` = 4 acertos e 3 erros numa múltipla de 7 jogos) — essencial para apostas com freebet parcial.
- **Tipos de aposta reais**: Match Odd, DNB, Dupla Chance, Ambas Marcam (Both Score), Over/Under 0.5/1.5/2.5/3.5/4.5, Handicap Europeu, Handicap Asiático (+0.5/+1.0, +1.5/+2.0, 0.0/+0.5, -0.5), Gols Asiáticos, Match Odd + Ambas Marcam, Match Odd + Gols, Resultado Exato, Cartões, 2/1 (HT/FT), Double Chance.
- **Métricas extras observadas**: "Pior sequência" (reds consecutivos), "Recorde" (greens consecutivos), projeção "e se" (odd média × % banca × nº apostas).

## Modelagem de dados (Postgres/Supabase)

Schema relacional já pensando em todas as fases. Toda tabela tem `user_id uuid references auth.users` + **RLS habilitado** (cada usuário só vê seus próprios dados).

### Entidades de catálogo (cadastros de apoio)

- **`sports`**: id, name (Futebol, Basquete, etc.)
- **`countries`**: id, name, code
- **`leagues`** (campeonatos): id, name, country_id, sport_id
- **`teams`**: id, name, country_id, league_id (opcional), logo_url
- **`bet_types`**: id, name, code, description, category (Resultado / Gols / Handicap / Combinada / Cartões / Resultado Exato) — seed rico com todos os tipos extraídos da planilha
- **`bookmakers`** (casas de apostas): id, name

### Entidade central — Estratégia com método de stake parametrizado

- **`strategies`**: id, user_id, name, description, status (active/paused/archived), **`stake_method`** enum (`fixed` | `progression` | `percent_bankroll` | `custom`), **`stake_config jsonb`** (ex.: `{"value": 5}` para fixed; `{"sequence": [5,10,20,40,70,140,280,500,1000], "reset_on_win": true, "protection": 3}` para progression; `{"percent": 2}` para percent_bankroll), `rules_json jsonb` (vazio no MVP, reservado para Fase 3 — odd mínima, minuto, estatística), created_at — **coração do produto**.
- **`strategy_progress`**: id, strategy_id, user_id, current_step (int, qual passo da progressão está), worst_red_streak, best_green_streak, last_updated — estado "vivo" de estratégias de progressão (como sua aba Desafio 5-10-20-40-80).

### Jogos e apostas

- **`matches`**: id, league_id, home_team_id, away_team_id, scheduled_at, status (scheduled/live/finished), home_score, away_score, home_score_ht, away_score_ht (meio-tempo — útil pra tipo 2/1)
- **`bets`** (aposta "guarda-chuva"): id, user_id, strategy_id, bookmaker_id, bet_date, **`is_multiple`** bool, **`legs_count`** int, **`legs_won`** int (para XcYe), **`legs_lost`** int, total_odd numeric, **`actual_odd`** numeric (odd final após eventos), stake numeric, **`is_free_bet`** bool (freebet), potential_return numeric, **`outcome`** enum (`pending` | `won` | `lost` | `void` | `cashout` | `partial`), actual_return numeric, profit_loss numeric, balance_before numeric, balance_after numeric, initial_balance_pct numeric, details text, notes text
- **`bet_legs`** (palpites individuais; simples = 1 leg, múltipla = N legs): id, bet_id, match_id, bet_type_id, selection text (ex.: "Over 2.5", "DNB Manchester", "Handicap Roma -1"), odd numeric, result enum (`pending` | `won` | `lost` | `void`)

### Banca

- **`bankroll_events`**: id, user_id, event_type (`deposit` | `withdraw` | `bet_placed` | `bet_settled` | `adjustment` | `free_bet_credit`), amount, balance_after, bet_id (nullable), occurred_at — histórico imutável para reconstruir curva de banca e auditoria.
- **`user_settings`**: id, user_id, initial_balance, current_balance (cache), currency (default BRL), timezone

### Triggers importantes

- Ao inserir/atualizar `bets` com `outcome` final: gerar `bankroll_events`, recalcular `profit_loss` (considerando freebet: lucro = `(odd-1) × stake` se ganha, 0 se perde), atualizar `current_balance`.
- Ao inserir `bet_legs` em múltipla: recalcular `total_odd` (produto das odds), `legs_count`, e atualizar `legs_won`/`legs_lost` quando `result` for preenchido.
- Ao fechar aposta de uma `strategy` com `stake_method = progression`: atualizar `strategy_progress.current_step` (avança em red, reseta em green conforme `reset_on_win`), recalcular `worst_red_streak` e `best_green_streak`.

## Estrutura do projeto

```
smart-bet/
├── app/
│   ├── (auth)/login, register           # auth pages (Supabase Auth UI)
│   ├── (app)/
│   │   ├── dashboard/                    # home: KPIs + curva de banca
│   │   ├── bets/                         # lista, criar, editar, detalhe
│   │   ├── strategies/                   # lista, criar, editar, detalhe (com métricas da estratégia)
│   │   ├── matches/                      # cadastro de jogos (usado nas bet_legs)
│   │   ├── catalog/                      # sports, countries, leagues, teams, bet-types, bookmakers
│   │   ├── bankroll/                     # extrato e ajustes de banca
│   │   └── settings/                     # saldo inicial, moeda, etc.
│   ├── api/                              # route handlers quando necessário
│   └── layout.tsx
├── components/
│   ├── ui/                               # shadcn/ui primitives
│   ├── charts/                           # wrappers de Recharts
│   ├── forms/                            # BetForm, StrategyForm, etc.
│   └── tables/                           # data tables (TanStack Table)
├── lib/
│   ├── supabase/                         # client, server, middleware
│   ├── metrics/                          # calculos: ROI, hit rate, yield, drawdown, curva de banca
│   ├── validators/                       # schemas Zod
│   └── utils.ts
├── hooks/                                # useBets, useStrategies, useBankroll, useMetrics
├── types/                                # tipos gerados do Supabase + domínio
├── supabase/
│   ├── migrations/                       # SQL de cada migração
│   └── seed.sql                          # catálogo inicial (esportes, tipos de aposta comuns)
└── public/
```

## Módulo de métricas (coração analítico do MVP)

Em `lib/metrics/` — funções puras, testáveis, que alimentam o dashboard e a tela de detalhe de estratégia:

- `calcROI(bets)` = (lucro_total / total_apostado) × 100
- `calcHitRate(bets)` = wins / (wins + losses) × 100 (ignora void/cashout)
- `calcYield(bets)` = lucro_total / total_apostado
- `calcProfitByStrategy(bets)` / `calcProfitByBetType(bets)` / `calcProfitByLeague(bets)` → agrupadores
- `calcBankrollCurve(events)` → série temporal para o gráfico
- `calcMaxDrawdown(events)` → maior queda percentual de pico a vale
- `calcAvgOdd(bets)` → odd média
- `calcLongestRedStreak(bets)` / `calcLongestGreenStreak(bets)` → "pior sequência" e "recorde" (como nas suas abas)
- `calcCurrentStreak(bets)` → sequência atual
- `calcPctOfInitialBalance(balance, initial)` → para mostrar "aposta X representa Y% do saldo inicial"
- `calcFreeBetProfit(bet)` → cálculo especial de lucro para freebet (lucro = `(odd-1) × stake` se ganha, 0 se perde)
- `calcMultipleOutcome(legs)` → resolve múltipla XcYe a partir das legs (won/lost/partial)

### Módulo de stake (crítico, dado seu uso real)

- `calcNextStake(strategy, progress, bankroll)` → calcula próximo stake segundo o método:
  - `fixed`: retorna `stake_config.value`
  - `progression`: retorna `stake_config.sequence[current_step]`
  - `percent_bankroll`: retorna `bankroll × stake_config.percent / 100`
- `advanceProgression(strategy_progress, outcome)` → avança ou reseta o passo da progressão

### Módulo de projeção (replica sua aba "Projeção")

- `projectBankroll({ bankroll, percent, avgOdd, chances, hitRate })` → simula evolução "e se" para N apostas e retorna série temporal projetada

**Ganchos para Fase 3 (não implementar agora, mas reservar assinaturas):**

- `calcExpectedValue(probEstimada, odd, stake)` = (P × (Odd−1) × stake) − ((1−P) × stake)
- `calcEdge(probEstimada, odd)` = probEstimada − (1/odd)
- `calcKellyStake(probEstimada, odd, bankroll)` = bankroll × ((P×(Odd−1) − (1−P)) / (Odd−1))

## Telas do MVP (prioridade de construção)

1. **Auth** (login/registro Supabase) e **Settings** (saldo inicial) → primeira coisa que o usuário faz.
2. **Catálogo** → sports, countries, leagues, teams, bet_types, bookmakers (com seed inicial rico — todos os tipos extraídos da sua planilha).
3. **Estratégias** → CRUD com seletor de **método de stake** (fixo / progressão / % da banca) e configurador específico (campo valor, sequência de progressão editável, % da banca) + página de detalhe com métricas filtradas daquela estratégia (ROI, hit rate, pior sequência, recorde, curva específica da estratégia).
4. **Matches** → cadastro simples (liga, times, data, status, placar FT e HT).
5. **Bets** → formulário avançado:
   - Escolhe estratégia (preenche stake automaticamente com `calcNextStake`, editável)
   - Toggle simples/múltipla
   - Para múltipla: adiciona N legs dinamicamente, cada uma com match, bet_type, seleção, odd
   - Flags: é freebet? houve cashout?
   - Ao salvar: calcula `total_odd`, `potential_return`, gera `bankroll_events`, avança `strategy_progress`
6. **Bankroll** → extrato de todos os `bankroll_events` com filtros + ações manuais de depósito/saque/ajuste.
7. **Projeção** → simulador "e se": inputs (% da banca ou stake, odd média, hit rate esperado, nº de apostas) → gráfico de evolução projetada (replica sua aba Projeção).
8. **Dashboard** → KPIs gerais + gráficos (detalhado abaixo).

## Dashboard — layout e gráficos

- **Linha de KPIs** (cards): Banca atual, % vs inicial, ROI geral, Hit rate, Apostas abertas, Lucro do mês, **Pior sequência de reds**, **Recorde de greens**
- **Gráfico 1**: Curva de evolução da banca (line chart temporal)
- **Gráfico 2**: Lucro por estratégia (bar chart horizontal, ordenado por ROI)
- **Gráfico 3**: Distribuição por tipo de aposta (pie ou stacked bar)
- **Gráfico 4**: Lucro por campeonato (bar chart, top 10)
- **Tabela**: Últimas 15 apostas com outcome colorido (green/red/void/cashout/freebet)

## Segurança e boas práticas

- RLS em **todas** as tabelas de usuário (`policies` para SELECT/INSERT/UPDATE/DELETE só em `user_id = auth.uid()`)
- Validação dupla: Zod no client + check constraints no Postgres
- Variáveis de ambiente em `.env.local` (NUNCA commitar)
- Supabase service role key **só** em server components/route handlers (nunca client)
- Tipos TypeScript gerados automaticamente do schema (`supabase gen types typescript`)

## Como as skills e MCPs serão usadas

- **MCP `user-context7`**: buscar docs atualizadas de Next.js 15, Supabase JS, shadcn/ui, Recharts, TanStack Query.
- **MCP `user-supabase-clube-ecg`**: criar/gerenciar schema, migrations, policies, seed.
- **Skill `ui-ux-pro-max`**: desenhar identidade visual, paleta (sugestão: dark mode para apostador à noite), layout de dashboard com grid moderno.
- **Skill `frontend-design`**: refinar componentes-chave (cards de KPI, formulário de aposta múltipla).
- **Skill `vercel-react-best-practices`**: aplicar padrões de Server Components, cache, streaming.
- **MCP `cursor-ide-browser`**: testes visuais de regressão das telas.

## Ganchos preparados para as próximas fases (sem implementar)

- `strategies.rules_json` para armazenar regras parametrizáveis (odd mínima/máxima, minuto, placar, limiares estatísticos) → Fase 3
- `matches` já com status `live` e campos de placar → Fase 2/3
- Pasta `lib/rules-engine/` reservada (vazia) → Fase 3
- Estrutura preparada para adicionar Supabase Realtime + Edge Functions → Fase 3
- Layout responsivo + PWA-ready → Fase 4 (mobile/push)

## Entregáveis do MVP

- Repositório inicializado com a stack completa configurada
- Schema Supabase aplicado com RLS e seed de catálogo
- Autenticação funcional (email + senha)
- 100% dos CRUDs listados
- Dashboard com todos os KPIs e 3 gráficos
- Deploy em Vercel + Supabase Cloud
- README com instruções de setup local
