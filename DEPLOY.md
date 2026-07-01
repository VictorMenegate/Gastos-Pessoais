# Deploy — Coolify (Supabase + Evolution API)

Guia para subir o **Gastos Pessoais** no Coolify usando **Supabase self-hosted** (banco + auth)
e **Evolution API** para o WhatsApp.

---

## 1. Banco — Supabase no Coolify

1. Coolify → **+ New Resource → Service → Supabase** → deploy.
2. Abra o **Studio / SQL Editor** do Supabase e rode, **nesta ordem**:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_full_restructure.sql`
3. Anote, das variáveis do serviço Supabase:
   - **API URL** (gateway/Kong) → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

> As migrations usam `auth.users` / `auth.uid()` (existem no Supabase) e as extensões
> `uuid-ossp` e `pgcrypto` (habilitadas por padrão no Supabase).

---

## 2. App — variáveis de ambiente no Coolify

```env
NEXT_PUBLIC_SUPABASE_URL=<api url do supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
CRON_SECRET=<string aleatória>
EVOLUTION_API_URL=<url base da evolution, sem barra no final>
EVOLUTION_API_KEY=<apikey da evolution>
EVOLUTION_INSTANCE=gastos
```

> ⚠️ **Build-time:** `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são embutidas
> no bundle durante o build (ver `ARG` no `Dockerfile`). No Coolify, marque essas duas também
> como **Build Variable** e faça **rebuild** — senão o front continua apontando pro banco antigo.

---

## 3. WhatsApp — Evolution API

> A Evolution pode rodar no próprio Coolify (imagem `atendai/evolution-api`).
> A `apikey` global é a env `AUTHENTICATION_API_KEY` da Evolution.

### 3.1 Criar a instância e parear o número

```bash
curl -X POST "$EVOLUTION_API_URL/instance/create" \
  -H "apikey: $EVOLUTION_API_KEY" -H "Content-Type: application/json" \
  -d '{"instanceName":"gastos","integration":"WHATSAPP-BAILEYS","qrcode":true}'
```

Retorna um **QR Code** → escaneie com o chip (WhatsApp → *Aparelhos conectados*).

### 3.2 Apontar o webhook para o app

```bash
curl -X POST "$EVOLUTION_API_URL/webhook/set/gastos" \
  -H "apikey: $EVOLUTION_API_KEY" -H "Content-Type: application/json" \
  -d '{"webhook":{"enabled":true,"url":"https://SEU-APP/api/whatsapp/webhook","webhookByEvents":false,"events":["MESSAGES_UPSERT"]}}'
```

---

## 4. Vincular a conta ao número

Cadastro/login no app → **Configurações** → salve o perfil preenchendo o **WhatsApp**
com DDI 55 (ex.: `5511999999999`). É esse campo (`profiles.whatsapp_phone`) que o webhook
usa para identificar o usuário.

---

## 5. Teste

Mande `Mercado 120` para o número da instância. O bot deve responder pedindo
**entrada ou saída** (responda pelo número da opção). Ao confirmar, a transação é salva
em `transactions` com `source = 'whatsapp'`.

---

## Notas

- Botões/listas interativos são instáveis no WhatsApp via Evolution; por isso o webhook
  envia as opções como **texto numerado** e aceita resposta por número.
- O endpoint `GET /api/whatsapp/webhook` responde apenas um health check
  (`{ status: "ok" }`) — a Evolution não usa verificação por challenge como a Meta.
- Mantenha a `EVOLUTION_API_KEY` **somente** em variável de ambiente; nunca no código.
