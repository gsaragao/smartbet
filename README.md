# Smart Bet

Sistema pessoal de gestão e análise inteligente de apostas esportivas. Cada aposta é registrada dentro de uma **estratégia nomeada**, permitindo medir objetivamente o que funciona e o que destrói a banca.

## Visão do produto

- **Fase 1 (MVP)** – Registro manual, controle de banca, dashboard analítico por estratégia.
- **Fase 2** – Coleta semiautomática de jogos da próxima rodada.
- **Fase 3** – Estatísticas ao vivo + motor de regras (filtros Odd → Tempo → Estatística → EV+) com notificações push/WhatsApp.
- **Fase 4** – Execução (semi)automatizada de apostas a partir das notificações.

## Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Estilização**: Tailwind CSS v4 + shadcn/ui (preset base-nova, paleta neutral)
- **Backend / DB**: Supabase (PostgreSQL + Auth + RLS + Realtime + Storage)
- **Estado servidor**: TanStack Query
- **Formulários**: React Hook Form + Zod
- **Gráficos**: Recharts
- **Ícones**: lucide-react
- **Utilitários**: date-fns, clsx, tailwind-merge
- **Qualidade**: ESLint + Prettier + Husky + lint-staged

## Estrutura de pastas

```
smart-bet/
├── src/
│   ├── app/
│   │   ├── (auth)/            # rotas de autenticação (login / registro)
│   │   └── (app)/             # rotas autenticadas (dashboard, bets, etc.)
│   ├── components/
│   │   ├── ui/                # componentes shadcn/ui
│   │   ├── charts/            # wrappers de Recharts
│   │   ├── forms/             # BetForm, StrategyForm, etc.
│   │   └── tables/            # data tables
│   ├── lib/
│   │   ├── supabase/          # clients (browser / server / middleware)
│   │   ├── metrics/           # ROI, hit rate, drawdown, curva de banca, etc.
│   │   ├── stake/             # calcNextStake, progressão, Kelly, etc.
│   │   ├── validators/        # schemas Zod
│   │   └── utils.ts
│   ├── hooks/
│   └── types/
├── supabase/
│   ├── migrations/            # SQL versionado do schema
│   └── seed.sql
└── public/
```

## Setup local

### 1. Pré-requisitos

- Node.js **20 ou superior** (testado em 24.x)
- npm 10+ (testado em 11.x)

### 2. Instalar dependências

```bash
npm install
```

### 3. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local` com as credenciais do projeto Supabase (serão criadas no próximo passo do plano, passo `2-supabase`).

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

O app sobe em http://localhost:3000 com Turbopack.

## Scripts disponíveis

| Script                 | O que faz                                 |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Ambiente de desenvolvimento com Turbopack |
| `npm run build`        | Build de produção                         |
| `npm start`            | Executa o build de produção               |
| `npm run lint`         | ESLint                                    |
| `npm run lint:fix`     | ESLint com correção automática            |
| `npm run format`       | Prettier em todos os arquivos             |
| `npm run format:check` | Verifica formatação sem alterar arquivos  |
| `npm run type-check`   | TypeScript sem emitir arquivos            |

## Qualidade de código

- **ESLint** com config do Next.js.
- **Prettier** + plugin Tailwind (ordena classes automaticamente).
- **Husky** roda `lint-staged` no `pre-commit`: corrige e formata apenas os arquivos modificados.

## Roadmap de implementação (MVP)

Os passos seguem o plano em `.cursor/plans/`. Resumo:

1. Scaffold do projeto (feito neste passo).
2. Projeto Supabase + cliente + Auth.
3. Schema com RLS + triggers de banca.
4. Seed do catálogo baseado na planilha real.
5. Tipos TypeScript + validators Zod.
6. Layout autenticado.
7. Settings (saldo inicial, moeda, timezone).
8. CRUDs de catálogo.
9. CRUD de estratégias (com `stake_method` e `stake_config`).
10. CRUD de partidas.
11. Form de apostas (simples/múltipla, freebet, cashout).
12. Módulo `lib/metrics` com testes.
13. Módulo `lib/stake` com testes.
14. Tela de banca (extrato + ajustes).
15. Tela de projeção (simulador "e se").
16. Dashboard (KPIs + gráficos).
17. Polimento de UX (loading/empty/error, responsividade, dark mode).
18. Deploy Vercel + Supabase Cloud.

## Licença

Uso privado. Todos os direitos reservados.
