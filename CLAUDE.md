# CLAUDE.md — Guia do projeto Gastos Pessoais

> ⚠️ **MANUTENÇÃO OBRIGATÓRIA**
> Este arquivo descreve o **estado atual** do projeto e serve de referência para qualquer nova ação.
> **Sempre que mudar stack, rotas, variáveis de ambiente, schema do banco ou convenções, atualize este arquivo na mesma alteração.** Um guia desatualizado é pior que nenhum.

---

## 1. Visão geral

App de **finanças pessoais multi-usuário**, em **português (pt-BR)**. Permite registrar transações por três caminhos: formulário na interface, **bot de WhatsApp** e **extração por IA** de extratos/prints. Tem dashboard com gráficos, orçamentos, metas, parcelados, recorrentes e alertas. É um **PWA** instalável no celular.

Stack central: **Next.js 14 (App Router) + Supabase (Postgres + Auth)**.

## 2. Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14.2 (App Router, `output: 'standalone'`) |
| UI | React 18, TypeScript (**strict OFF**) |
| Estilo | Tailwind CSS 3.4 + CSS variables; sem CSS Modules |
| Banco/Auth | Supabase (Postgres + Auth) — **sem ORM**, client direto |
| Gráficos | Recharts + SVG custom (pie 3D) |
| Animação | anime.js |
| Datas | date-fns (locale pt-BR) |
| PDF | unpdf (com suporte a senha) |
| IA | Groq (Llama, análise de documento/print) |
| PWA | next-pwa + Workbox |
| Ícones | Lucide React (UI) + emoji (categorias/metas) |

Gerenciador de pacotes: **npm**.

## 3. Scripts

```
npm run dev     # desenvolvimento (localhost:3000)
npm run build   # build de produção (standalone)
npm run start   # servir build
npm run lint    # ESLint (next lint)
```

Não há testes automatizados. **O build ignora erros de TypeScript e ESLint** (`next.config.js`: `typescript.ignoreBuildErrors` e `eslint.ignoreDuringBuilds`). Logo, `npm run lint` não roda no build — rode manualmente quando precisar.

## 4. Estrutura de pastas

```
src/
├── app/                      # páginas (App Router, nomes em pt-BR)
│   ├── (auth)/login/         # login/cadastro (Supabase Auth)
│   ├── dashboard/            # hub principal + components/ (gráficos e overviews)
│   ├── transacoes/           # lista/filtro/CRUD de transações
│   ├── recorrentes/          # transações recorrentes
│   ├── parcelados/           # parcelamentos
│   ├── orcamentos/           # orçamentos por categoria
│   ├── metas/                # metas financeiras
│   ├── alertas/              # central de notificações
│   ├── configuracoes/        # perfis, salário, WhatsApp
│   ├── api/                  # ver abaixo
│   ├── layout.tsx            # layout raiz (config PWA)
│   ├── page.tsx              # redireciona p/ /dashboard
│   └── globals.css           # Tailwind + design tokens (.card, .btn-primary, .input, .label, .pill-btn, .quick-action)
├── components/               # UI reutilizável (Sidebar, MonthSelector, TransactionForm, ExtratoUpload, ...)
├── lib/
│   ├── queries.ts            # TODA operação de banco (Supabase)
│   ├── utils.ts              # formatação e cálculos
│   ├── theme.ts              # temas de cor do app (CSS vars + localStorage)
│   ├── constants.ts          # cores, ícones, enums, opções
│   ├── useAnime.ts           # hooks de animação (anime.js)
│   └── supabase/{client,server}.ts  # clients browser e server (SSR)
├── types/index.ts            # interfaces TypeScript
└── middleware.ts             # guard de auth (protege rotas)

supabase/migrations/          # 001_initial_schema.sql, 002_full_restructure.sql
public/                       # manifest.json, sw.js (gerado), ícones
```

### Rotas de API (`src/app/api`)

| Rota | Função |
|------|--------|
| `whatsapp/webhook` | Bot de WhatsApp (GET verifica, POST processa mensagens — máquina de estados) |
| `analyze-screenshot` | Extração de transações de print/PDF via Groq |
| `pluggy/auth` · `pluggy/sync` | Conexão e sync bancário (Pluggy) |
| `cron` | Job mensal (gera recorrentes, lançamentos de salário, checa alertas) — exige `CRON_SECRET` |
| `auth/callback` | Callback de sessão Supabase |

## 5. Onde mexer (pontos-chave)

- **Qualquer acesso a banco** → adicione/edite função em `src/lib/queries.ts`. Não chame o Supabase espalhado pelas páginas.
- **Tipos** → `src/types/index.ts`.
- **Formatação/cálculo** (moeda BRL, datas, `month_ref`, taxa de poupança) → `src/lib/utils.ts`.
- **Cores, ícones, enums, opções de frequência** → `src/lib/constants.ts`.
- **Design tokens e classes base** (`.card`, `.btn-primary`, `.input`, `.label`, CSS vars) → `src/app/globals.css`.
- **Proteção de rota / redirecionamento de auth** → `src/middleware.ts`.

## 6. Convenções

- **Tudo em português**: nomes de variáveis/funções, comentários e mensagens de commit.
- **Commits semânticos**: `feat(escopo): descrição`, `fix(escopo): descrição` (ex.: `feat(whatsapp): migrar webhook ...`).
- Páginas e componentes são **`'use client'`** com `useState`/`useEffect`. **Não há lib de estado global** (sem Redux/Zustand/Context global) — estado é local e dados vêm de `queries.ts`.
- Estilo: **Tailwind + classes de componente** do `globals.css`. Sem CSS Modules.
- **Design mobile (`<768px`)**: visual "glass" — fundo em gradiente pastel (media query no `body`), `.card` translúcido com blur, botões `.pill-btn` no hero e grid `.quick-action`. As ações rápidas (gasto/entrada/extrato IA) ficam no **botão central do bottom nav** (`Sidebar.tsx`) — não existe mais componente FAB. Desktop mantém o visual sólido original.
- **Cor do app (tema)**: a cor de destaque vem das CSS vars `--accent*` (`globals.css` = padrão Azul). O usuário troca em **Configurações → Aparência**; `src/lib/theme.ts` grava em `localStorage` (por aparelho) e um script inline no `layout.tsx` reaplica antes do paint. A paleta `brand` do Tailwind aponta para essas vars. **Nunca hardcode `#2B4C7E`/`#567EBB`** em componentes — use `var(--accent)`/`var(--accent-light)`/`rgba(var(--accent-rgb), α)` ou classes `brand-*`; para atributos SVG (ex.: `fill` do Recharts), leia a cor computada com `corDaVar()` de `theme.ts`.
- TypeScript é **frouxo** (`strict: false`); ainda assim, prefira tipar via `src/types`.

## 7. Banco de dados

Supabase Postgres com **RLS multi-tenant por `account_id`**. Uma `account` agrupa perfis (ex.: casal/família), cada perfil com salário, cor e WhatsApp próprios.

Migrations em `supabase/migrations/`:
- `001_initial_schema.sql` — schema original.
- `002_full_restructure.sql` — reestruturação multi-tenant (modelo atual).

Tabelas centrais: `accounts`, `profiles`, `transactions`, `recurring_transactions`, `installments`, `categories`, `payment_methods`, `budgets`, `financial_goals`, `goal_contributions`, `alerts`, `whatsapp_sessions`.

RPCs usadas: `generate_recurring_for_month`, `check_budget_alerts`.

> Ao mudar o schema, crie **nova migration numerada** (não edite as antigas) e atualize `src/types/index.ts` + `src/lib/queries.ts`.

## 8. Integrações

- **WhatsApp → Evolution API** (migrado da Meta Cloud API). Autenticação por header `apikey`; conversa guiada por máquina de estados persistida em `whatsapp_sessions` (tipo → forma de pagamento → categoria → confirmação). Lógica em `src/app/api/whatsapp/webhook/route.ts`.
- **Pluggy** — agregação/sync bancário (`source: 'bank_sync'`).
- **Groq** — extração de extrato/print em `analyze-screenshot`.

Origem da transação fica em `source` (`manual` | `whatsapp` | `bank_sync`).

## 9. Variáveis de ambiente

Ver `.env.example` para a lista completa (**não commitar valores**).

| Variável | Função |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase no client (**build-time**) |
| `SUPABASE_SERVICE_ROLE_KEY` | Operações privilegiadas (cron, webhook) — server only |
| `CRON_SECRET` | Bearer token do endpoint `/api/cron` |
| `EVOLUTION_API_URL` · `EVOLUTION_API_KEY` · `EVOLUTION_INSTANCE` | WhatsApp via Evolution API |
| `WHATSAPP_TOKEN` · `WHATSAPP_PHONE_NUMBER_ID` · `WHATSAPP_VERIFY_TOKEN` | Legado Meta Cloud API |
| `PLUGGY_CLIENT_ID` · `PLUGGY_CLIENT_SECRET` | Sync bancário (opcional) |

> ⚠️ Variáveis `NEXT_PUBLIC_*` são embutidas no bundle **no build**. No Coolify marque-as como **Build Variable** e **rebuilde** após alterar.

## 10. Deploy

Docker multi-stage (Node 20 Alpine, saída `standalone`, usuário não-root, porta 3000) → **Coolify** (self-hosted). Supabase e Evolution API rodam self-hosted. Detalhes em `DEPLOY.md`; setup geral em `README.md`.
