# Smart Bet — contexto para IA / handoff

**Use este arquivo** ao abrir o projeto em outro IDE ou chat: cole ou anexe `CONTEXTO-IA.md` na primeira mensagem para restaurar produto, conversas de produto, plano MVP e o que falta.

**Não commite segredos.** Variáveis sensíveis ficam em `.env.local` (já no `.gitignore`). Detalhes técnicos de stack e setup: `README.md`.

**Plano MVP (cópia versionada no repo):** `docs/plans/smart_bet_mvp_4ac4e384.plan.md` — espelho do plano Cursor; o frontmatter YAML pode estar **desatualizado** (vários itens ainda como `pending`). Para continuar o MVP, use a **seção “MVP 9/14”** abaixo + o código como fonte de verdade. O arquivo original no disco pode permanecer em `C:\Users\Juan\.cursor\plans\smart_bet_mvp_4ac4e384.plan.md`.

---

## Ideias de produto (das conversas — visão completa)

### Dor que resolve

- Apostadores que **espalham controle em várias planilhas** e não conseguem ver, por estratégia, o que paga ou destrói a banca.
- Objetivo: **estratégia como unidade central** — cada aposta ligada a uma estratégia nomeada, com histórico e métricas objetivas (ROI, yield, hit rate, sequências, etc.).

### O que o sistema deve representar (modelo mental)

- **Aposta** pode ser simples ou **múltipla** (1:N seleções); freebet, cashout, void, meio green/red.
- Na planilha real havia formato **XcYe** (ex.: 4 acertos / 3 erros em uma múltipla) — conceito de rastrear pernas certas/erradas / freebet parcial; o domínio atual cobre múltipla com seleções e status agregado (alinhar métricas avançadas com legado da planilha quando for prioridade).
- **Banca**: saldo ao longo do tempo, eventos auditáveis, % em relação ao saldo inicial na época da aposta.
- **Estratégia**: não é só “nome”; inclui **método de stake** (fixo, % banca, progressão tipo 5-10-20-40…, Kelly no roadmap), **regras** (no app: AST + escopo + guardrails) e **progresso** (passo da progressão, streaks, lucro acumulado).

### Fases de roadmap (alto nível)

| Fase        | Ideia                                                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 — MVP** | Registro manual, banca, estratégias, apostas, dashboard analítico (base).                                                                                                                             |
| **2**       | Coleta **semiautomática** de jogos da próxima rodada (fonte/API/scraper a definir).                                                                                                                   |
| **3**       | Stats **ao vivo** (referência: FlashScore), **motor de regras**: Odd → Tempo de jogo → Estatísticas → **EV+** / edge → decisão; **notificações** (push / WhatsApp): “jogo apto dentro da estratégia”. |
| **4**       | **Execução semiautomatizada** da aposta a partir do sinal (ainda com supervisão humana).                                                                                                              |

### Conceitos de “boa aposta” (conversas — Fase 3+)

- **Odd** como determinante: ex. odd 1.10 com red grande exige muitos greens para recuperar — o sistema deve deixar isso explícito no motor (EV+, compensação).
- **EV+** (valor esperado positivo), **edge**, **Kelly** como ganchos analíticos — reservados para quando houver feed de probabilidade/odd em tempo quase real.
- Cenário citado: jogo 0x0, 2º tempo, minuto ~53, odd alta para “um gol” **vs** estatísticas fracas (finalizações/chutes ao gol) — só notificar se **superar** camadas de filtro (odd + tempo + stats + EV).

### IA

- **Análise por IA** sobre histórico (“em quais estratégias me dou bem/mal”) — intenção de produto; **não implementado** no MVP atual.

### Requisitos transversais (sempre)

- **Performance**, código **limpo**, **manutenível**, UI **elegante** e usável (padrão “produto sério”).
- Banco: tabelas e enums em **português**; **RLS**; operações sensíveis em **RPC `SECURITY DEFINER`** transacional.
- Next.js **16** desta instalação pode divergir do treinamento — ver `AGENTS.md` e docs em `node_modules/next/dist/docs/`.

---

## MVP alinhado ao plano `smart_bet_mvp_…` — **9/14 concluídos**

Legenda: concluído = entregue de forma suficiente para uso; pendente = ainda falta para fechar o MVP **como descrito no plano** (não significa que o app não rode).

| #   | Entrega (resumo)                                                                                                                                                                                                                                                | Ref. plano                                                                | Estado                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | Scaffold Next 16 + TS + Tailwind v4 + shadcn + ESLint/Prettier/Husky, estrutura base                                                                                                                                                                            | `1-setup`                                                                 | Concluído                                                  |
| 2   | Supabase: clientes `browser/server/middleware`, Auth (login/registro/logout), rotas protegidas                                                                                                                                                                  | `2-supabase`                                                              | Concluído                                                  |
| 3   | Migrations: schema **PT-BR**, RLS, triggers de banca, RPCs de apostas (criar/resolver/reabrir/múltipla/seleção), progresso de estratégia                                                                                                                        | `3-schema`                                                                | Concluído                                                  |
| 4   | **Seed rico** (planilha): muitos `tipos_aposta`, ligas/times de exemplo, **casas BR** — hoje há seeds/migrations de catálogo, mas **não** no nível “rico” descrito no plano (ex.: 20+ tipos espelhando todas as linhas da planilha)                             | `4-seed`                                                                  | Pendente                                                   |
| 5   | Tipos gerados (`src/types/supabase.ts`) + **Zod** por domínio em `src/features/*/schema.ts`                                                                                                                                                                     | `5-types`                                                                 | Concluído                                                  |
| 6   | Layout autenticado (sidebar/header), navegação para áreas principais                                                                                                                                                                                            | `6-layout`                                                                | Concluído                                                  |
| 7   | **Settings**: moeda/timezone/onboarding primeiro acesso (no plano: `user_settings` + fluxo) — hoje **não** há tela dedicada equivalente; parte de contexto está em **banca**                                                                                    | `7-settings`                                                              | Pendente                                                   |
| 8   | **CRUD catálogo**: no app = área **Admin** (esportes, países, ligas, times, tipos de aposta). O plano também previa **`bookmakers`** como entidade; no código a casa é **`casa_de_aposta` texto** em aposta/banca — falta decidir se vira tabela + admin        | `8-catalog`                                                               | Parcial → contar como **concluído para 9/14** com ressalva |
| 9   | **Estratégias**: CRUD, wizard, `stake_method` + config, regras AST, escopo, guardrails, junções, histórico de apostas na estratégia                                                                                                                             | `9-strategies`                                                            | Concluído                                                  |
| 10  | **Partidas**: CRUD dedicado (liga, times, data, status, placar FT/HT). Hoje: **PartidaPicker** híbrido + criação no fluxo de aposta; **sem** rota `/matches` tipo gestão central                                                                                | `10-matches`                                                              | Pendente                                                   |
| 11  | **Apostas**: formulário, simples/múltipla, validação vs regras + override, resolução, filtros, CSV, integração banca/progresso                                                                                                                                  | `11-bets`                                                                 | Concluído                                                  |
| 12  | **`lib/metrics`**: ROI, yield, drawdown, curva de banca, lucro por grupo, streaks, freebet/múltipla avançada — **funções puras + testes** como no plano                                                                                                         | `12-metrics`                                                              | Pendente                                                   |
| 13  | **`lib/stake`**: `calcNextStake`, `advanceProgression` + testes; UX explícita “próximo stake sugerido” no form                                                                                                                                                  | `12b-stake`                                                               | Pendente                                                   |
| 14  | **Banca** (extrato + depósito/saque/ajuste) — implementado como **`/banca`**. Fechamento MVP do plano ainda junta: **Projeção** “e se”, **dashboard** com **gráficos** (Recharts) como especificado, **polish** (loading/empty/a11y), **deploy** Vercel + smoke | `13-bankroll`, `13b-projection`, `14-dashboard`, `15-polish`, `16-deploy` | Parcial: **banca** ok; resto **pendente**                  |

### Como interpretar o **9/14**

- Contam como **feitos** os itens **1, 2, 3, 5, 6, 8** (admin catálogo, com ressalva de bookmakers), **9, 11** e a **base de banca** dentro do **14** (extrato/ações).
- Contam como **abertos** para “MVP = plano”: **seed rico (4)**, **settings (7)**, **CRUD partidas dedicado (10)**, **lib/metrics + testes (12)**, **lib/stake + testes + UX (13)**, e o **bloco final (14)**: projeção + gráficos completos no dashboard + polish + deploy.

(Ajuste os números se passarem a tratar `8` como pendente até existir `bookmakers` formal — aí o “feito” cai para 8/14 até completar.)

---

## O que já está implementado no código (resumo técnico)

| Área                                                | Detalhe                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth + middleware + RLS                             | Sim                                                                                                                                                                                         |
| Admin                                               | Esportes, países, ligas, times, tipos de aposta                                                                                                                                             |
| Banca                                               | Múltiplas bancas, `eventos_banca`, saldo via triggers, tipo `aposta`                                                                                                                        |
| Estratégias                                         | Wizard, AST, stake methods, guardrails, versões de regras, progresso                                                                                                                        |
| Apostas                                             | S1 CRUD, S2 resolução RPC, S3 múltipla + filtros + CSV                                                                                                                                      |
| Dashboard                                           | KPIs e dados reais (`obterDashboardOverview`, `force-dynamic`); **sem** todos os gráficos/tabela “últimas 15” do plano                                                                      |
| Skills **no seu PC** (UX, React, Cursor, marketing) | `C:\Users\Juan\.agents\skills\`, `C:\Users\Juan\.cursor\skills-cursor\` — lista em `docs/SKILLS-AMBIENTE.md` (pastas `skills/` e `scripts/` na raiz são **locais** e estão no `.gitignore`) |

---

## Próximos passos sugeridos (ordem razoável para fechar MVP do plano)

1. **`lib/metrics`** + **`lib/stake`** com testes (Vitest ou Jest — ainda a definir no projeto).
2. **Settings / onboarding** (moeda padrão, timezone, primeiro uso).
3. **Seed rico** + opcional **tabela `casas_de_aposta` / bookmakers** + admin, migrando de texto livre se desejado.
4. **`/matches`** (lista + form) ou decidir explicitamente que MVP = só PartidaPicker.
5. **Projeção** + **dashboard** com Recharts (curva banca, lucro por estratégia/tipo/liga, últimas apostas).
6. **Polish** + **deploy** + README de operação.

### Fases 2–4 (fora do MVP 14)

- Coleta de jogos; stats ao vivo; motor EV+; notificações; execução semi-automática — ver tabela de fases acima.

---

## Arquivos-chave

| O quê                       | Onde                                        |
| --------------------------- | ------------------------------------------- |
| Regras Next.js 16           | `AGENTS.md`                                 |
| Stack + arquitetura + setup | `README.md`                                 |
| Handoff / MVP / ideias      | `CONTEXTO-IA.md` (este arquivo)             |
| Plano MVP (no repo)         | `docs/plans/smart_bet_mvp_4ac4e384.plan.md` |
| Tipos DB                    | `src/types/supabase.ts`                     |
| Dashboard agregado          | `src/features/dashboard/queries.ts`         |
| Apostas                     | `src/features/bets/`                        |
| Migrações                   | `supabase/migrations/*.sql`                 |

---

## Comandos úteis

```bash
npm install
npm run type-check
npm run lint
npm run build
```

---

## Lembrete para a outra IA

1. Ler `README.md` + este arquivo + trechos relevantes do plano `smart_bet_mvp_…` se existir no ambiente.
2. Não commitar `.env.local`; alinhar `.env.example` ao código quando faltar variável.
3. Preservar **RLS** e **RPCs transacionais** para apostas/banca/progresso.
4. Manter nomenclatura **em português** no banco, consistente com migrações.
5. Entregas em **fatias** pequenas e revisáveis.

_Última atualização deste documento: 2026-04-23 — inclui ideias das conversas, mapa MVP 9/14 e divergências em relação ao YAML do plano Cursor._
