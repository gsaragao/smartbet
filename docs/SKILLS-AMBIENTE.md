# Skills instaladas no ambiente (UX, React, marketing, Cursor)

Estas skills **não** ficam dentro do repositório `smart-bet`; o Cursor/Claude carregam a partir dos caminhos abaixo quando aparecem na lista de skills disponíveis.

## `C:\Users\<SEU-USUARIO>\.agents\skills\`

| Pasta                         | Uso típico                                                  |
| ----------------------------- | ----------------------------------------------------------- |
| `ui-ux-pro-max`               | UI/UX: paletas, estilos, acessibilidade, shadcn, dashboards |
| `frontend-design`             | Interfaces fortes, evitar “cara de IA genérica”             |
| `vercel-react-best-practices` | Performance React / Next.js (Vercel)                        |
| `vercel-react-native-skills`  | React Native / Expo                                         |
| `find-skills`                 | Descobrir/instalar outras skills                            |
| `copywriting`                 | Copy de páginas / marketing                                 |
| `copy-frameworks`             | AIDA, PAS, etc.                                             |
| `direct-response-copy`        | Copy de resposta direta                                     |
| `conversion-optimization`     | CRO                                                         |
| `funnel-architect`            | Funis / jornada                                             |
| `marketing-psychology`        | Psicologia aplicada a marketing                             |
| `product-marketing-context`   | Documento de contexto de produto                            |
| `sales-page-copywriting`      | Página de vendas                                            |
| `traffic-architect`           | Tráfego / Dream 100                                         |
| `upsell-downsell-scripting`   | OTO / upsell                                                |

Cada skill tem um `SKILL.md` na própria pasta (ex.: `C:\Users\<SEU-USUARIO>\.agents\skills\ui-ux-pro-max\SKILL.md`).

## `C:\Users\<SEU-USUARIO>\.cursor\skills-cursor\`

| Pasta                    | Uso típico                |
| ------------------------ | ------------------------- |
| `babysit`                | Manter PR/CI em ordem     |
| `create-hook`            | Hooks do Cursor           |
| `create-rule`            | Regras `.cursor` / AGENTS |
| `create-skill`           | Autoria de skills         |
| `create-subagent`        | Subagentes                |
| `migrate-to-skills`      | Migração para skills      |
| `shell`                  | Uso do terminal           |
| `split-to-prs`           | Dividir trabalho em PRs   |
| `statusline`             | Status line no CLI        |
| `update-cli-config`      | `cli-config.json`         |
| `update-cursor-settings` | `settings.json`           |

## Claude Code — plugins oficiais

Exemplo: **frontend-design** em  
`C:\Users\<SEU-USUARIO>\.claude\plugins\marketplaces\claude-plugins-official\plugins\frontend-design\skills\frontend-design\`

Outras skills de plugin ficam sob  
`C:\Users\<SEU-USUARIO>\.claude\plugins\marketplaces\claude-plugins-official\plugins\...\skills\...`.

> Na máquina atual não há um conjunto equivalente em `C:\Users\<SEU-USUARIO>\.claude\skills\`; o foco em UX/React/marketing está em **`.agents\skills`** + **`.cursor\skills-cursor`** + plugins do Claude.
