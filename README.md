# 💰 Gastos Pessoais

Aplicativo de controle financeiro pessoal e do casal — gastos do dia a dia, contas recorrentes, parcelamentos e entradas de salário configuráveis por perfil.

**Stack:** Next.js 14 · Supabase (PostgreSQL + Auth) · Recharts · PWA · Docker · GitHub Actions

---

## ✨ Funcionalidades

- **Dashboard** com gráficos de gastos por categoria e linha do tempo de entradas
- **Gastos** do dia a dia com categorias personalizáveis
- **Contas recorrentes** (luz, internet, aluguel...) — geradas automaticamente todo mês
- **Parcelamentos** com controle de parcelas pagas e barra de progresso
- **Entradas** configuráveis por perfil (vale + salário separados ou tudo junto)
- **Dois perfis** independentes (você e sua namorada)
- **PWA** — installable no celular como app nativo
- **CI/CD automático** — push na main = deploy em ~2 minutos

---

## 🚀 Setup inicial

### 1. Clone o repositório

```bash
git clone https://github.com/VictorMenegate/Gastos-Pessoais.git
cd Gastos-Pessoais
npm install
```

### 2. Configure o Supabase

No painel do seu Supabase (`supabase.co`):

1. Vá em **SQL Editor** → cole e execute o conteúdo de `supabase/migrations/001_initial_schema.sql`
2. Vá em **Authentication → URL Configuration** → adicione:
   - Site URL: `https://SEU_DOMINIO`
   - Redirect URL: `https://SEU_DOMINIO/api/auth/callback`

### 3. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com os valores do seu projeto Supabase (Settings → API):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CRON_SECRET=qualquer_string_segura_aqui
```

### 4. Rode localmente

```bash
npm run dev
# Abra http://localhost:3000
```

### 5. Configure os perfis

Depois de criar sua conta, acesse **Configurações** e:
- Crie seu perfil com Vale + Salário separados (tipo: "split")
- Crie o perfil da sua namorada com salário único (tipo: "single")

---

## 🐳 Deploy no EasyPanel

### Pré-requisitos
- Servidor com EasyPanel instalado
- Domínio apontando para o servidor (ou use o subdomínio do EasyPanel)

### Passo a passo

#### 1. Crie o app no EasyPanel

1. Acesse seu EasyPanel → **Create Service → App**
2. Nome: `gastos-pessoais`
3. Em **Source**: selecione **GitHub**
4. Conecte sua conta GitHub e selecione o repositório `VictorMenegate/Gastos-Pessoais`
5. Branch: `main`
6. Build method: **Dockerfile**

#### 2. Configure as variáveis de ambiente

No EasyPanel, vá em **Environment** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CRON_SECRET=qualquer_string_segura_aqui
```

#### 3. Configure o domínio

Em **Domains**, adicione seu domínio ou use o subdomínio gerado pelo EasyPanel.

#### 4. Copie o Webhook URL para CI/CD automático

1. No EasyPanel, vá no seu app → **Deployments → Deploy Hook**
2. Copie a URL do webhook (formato: `https://easypanel.SEU_SERVIDOR/api/deploy/...`)

#### 5. Configure os secrets no GitHub

No repositório GitHub → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Valor |
|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key do Supabase |
| `CRON_SECRET` | Sua string secreta do cron |
| `EASYPANEL_WEBHOOK_URL` | URL do webhook copiada no passo 4 |
| `APP_URL` | URL do seu app (ex: `https://gastos.seudominio.com`) |

#### 6. Faça o primeiro deploy

```bash
git add .
git commit -m "feat: deploy inicial"
git push origin main
```

Aguarde ~2 minutos. O GitHub Actions vai buildar e disparar o deploy no EasyPanel automaticamente.

---

## 🔄 Geração automática de contas mensais

O workflow `.github/workflows/cron.yml` roda **todo dia 1 às 03h00 (Brasília)** e:
- Gera as ocorrências mensais de todas as contas recorrentes ativas
- Cria as `income_entries` baseadas no `salary_schedule` de cada perfil

Para testar manualmente: GitHub → **Actions → Geração Mensal de Contas → Run workflow**

---

## 📱 Instalação como PWA

- **Android (Chrome):** Menu → "Adicionar à tela inicial"
- **iOS (Safari):** Compartilhar → "Adicionar à Tela de Início"

---

## 🗂 Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/login/      # Tela de login
│   ├── dashboard/         # Visão geral com gráficos
│   ├── gastos/            # Lançamentos do dia a dia
│   ├── contas/            # Recorrentes + ocorrências mensais
│   ├── parcelados/        # Compras parceladas
│   ├── entradas/          # Salário, vale, etc.
│   ├── configuracoes/     # Perfis e agendamento
│   └── api/
│       ├── cron/          # Geração mensal automática
│       └── auth/callback/ # Auth callback Supabase
├── components/
│   ├── Sidebar.tsx        # Navegação desktop + mobile
│   └── MonthSelector.tsx  # Seletor de mês
└── lib/
    ├── queries.ts          # Todas as queries do banco
    └── supabase/           # Clients browser + server
```
