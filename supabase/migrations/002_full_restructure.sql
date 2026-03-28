-- ============================================================
-- MIGRATION 002: REESTRUTURAÇÃO COMPLETA
-- Sistema financeiro pessoal multiusuário moderno
-- ============================================================

-- ============================================================
-- 1. TABELA: accounts (multi-tenant - conta compartilhada)
-- Uma conta pode ter múltiplos usuários (casal, família)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Minha Conta',
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. REFATORAR profiles → adicionar account_id e salary
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary DECIMAL(12,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

-- ============================================================
-- 3. TABELA: payment_methods (métodos de pagamento)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'pix', 'cash', 'transfer', 'other')),
  icon TEXT NOT NULL DEFAULT '💳',
  color TEXT NOT NULL DEFAULT '#6b7280',
  is_default BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. REFATORAR categories → adicionar account_id + type
-- ============================================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'both'));

-- ============================================================
-- 5. TABELA: transactions (substituir expenses + income_entries)
-- Tabela unificada de transações
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  month_ref TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_id UUID,  -- FK adicionada depois
  installment_id UUID, -- FK adicionada depois
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'whatsapp', 'bank_sync', 'recurring', 'installment')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_account_month ON transactions(account_id, month_ref);
CREATE INDEX IF NOT EXISTS idx_transactions_profile_month ON transactions(profile_id, month_ref);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- ============================================================
-- 6. REFATORAR recurring_bills → recurring_transactions
-- Suporta recorrência flexível (mensal, semanal, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual')),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  auto_confirm BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar FK na transactions
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_recurring
  FOREIGN KEY (recurring_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL;

-- ============================================================
-- 7. REFATORAR installments → com tracking melhor
-- ============================================================
ALTER TABLE installments ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE installments ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL;

ALTER TABLE transactions ADD CONSTRAINT fk_transactions_installment
  FOREIGN KEY (installment_id) REFERENCES installments(id) ON DELETE SET NULL;

-- ============================================================
-- 8. TABELA: budgets (orçamentos por categoria)
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  month_ref TEXT, -- NULL = orçamento padrão mensal
  alert_threshold DECIMAL(3,2) DEFAULT 0.80, -- alerta em 80%
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, category_id, profile_id, month_ref)
);

-- ============================================================
-- 9. TABELA: financial_goals (metas financeiras)
-- ============================================================
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#6366f1',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. TABELA: goal_contributions (aportes para metas)
-- ============================================================
CREATE TABLE IF NOT EXISTS goal_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. TABELA: alerts (alertas configuráveis)
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('budget_warning', 'budget_exceeded', 'bill_due', 'bill_overdue', 'goal_milestone', 'spending_spike', 'income_received', 'custom')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'danger', 'success')),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_account_unread ON alerts(account_id, read) WHERE read = FALSE;

-- ============================================================
-- 12. TABELA: whatsapp_sessions (integração WhatsApp)
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  state TEXT DEFAULT 'pending' CHECK (state IN ('pending', 'awaiting_type', 'awaiting_payment', 'awaiting_category', 'awaiting_confirm', 'completed')),
  temp_data JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. VIEWS ATUALIZADAS
-- ============================================================

-- Resumo mensal completo por conta
CREATE OR REPLACE VIEW v_monthly_summary AS
SELECT
  t.account_id,
  t.month_ref,
  t.profile_id,
  p.name AS profile_name,
  t.type,
  COUNT(*) AS transaction_count,
  SUM(t.amount) AS total_amount,
  SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS total_expenses
FROM transactions t
JOIN profiles p ON p.id = t.profile_id
GROUP BY t.account_id, t.month_ref, t.profile_id, p.name, t.type;

-- Gastos por categoria no mês
CREATE OR REPLACE VIEW v_expenses_by_category AS
SELECT
  t.account_id,
  t.month_ref,
  t.category_id,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  COUNT(*) AS transaction_count,
  SUM(t.amount) AS total_amount
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
WHERE t.type = 'expense'
GROUP BY t.account_id, t.month_ref, t.category_id, c.name, c.icon, c.color;

-- Status dos orçamentos
CREATE OR REPLACE VIEW v_budget_status AS
SELECT
  b.id AS budget_id,
  b.account_id,
  b.category_id,
  c.name AS category_name,
  c.icon AS category_icon,
  b.amount AS budget_amount,
  b.alert_threshold,
  COALESCE(b.month_ref, TO_CHAR(NOW(), 'YYYY-MM')) AS month_ref,
  COALESCE(spent.total, 0) AS spent_amount,
  ROUND(COALESCE(spent.total, 0) / b.amount * 100, 1) AS spent_percentage
FROM budgets b
LEFT JOIN categories c ON c.id = b.category_id
LEFT JOIN LATERAL (
  SELECT SUM(t.amount) AS total
  FROM transactions t
  WHERE t.account_id = b.account_id
    AND t.category_id = b.category_id
    AND t.type = 'expense'
    AND t.month_ref = COALESCE(b.month_ref, TO_CHAR(NOW(), 'YYYY-MM'))
    AND (b.profile_id IS NULL OR t.profile_id = b.profile_id)
) spent ON TRUE;

-- ============================================================
-- 14. ROW LEVEL SECURITY (NOVAS TABELAS)
-- ============================================================

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Helper: IDs de accounts do usuário atual
CREATE OR REPLACE FUNCTION user_account_ids()
RETURNS SETOF UUID AS $$
  SELECT account_id FROM profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Accounts: usuário vê contas onde tem perfil
CREATE POLICY "accounts_own" ON accounts
  FOR ALL USING (id IN (SELECT user_account_ids()));

-- Payment methods: via account
CREATE POLICY "payment_methods_own" ON payment_methods
  FOR ALL USING (account_id IN (SELECT user_account_ids()));

-- Transactions: via account
CREATE POLICY "transactions_own" ON transactions
  FOR ALL USING (account_id IN (SELECT user_account_ids()));

-- Recurring transactions: via account
CREATE POLICY "recurring_transactions_own" ON recurring_transactions
  FOR ALL USING (account_id IN (SELECT user_account_ids()));

-- Budgets: via account
CREATE POLICY "budgets_own" ON budgets
  FOR ALL USING (account_id IN (SELECT user_account_ids()));

-- Financial goals: via account
CREATE POLICY "financial_goals_own" ON financial_goals
  FOR ALL USING (account_id IN (SELECT user_account_ids()));

-- Goal contributions: via goal do account
CREATE POLICY "goal_contributions_own" ON goal_contributions
  FOR ALL USING (
    goal_id IN (
      SELECT id FROM financial_goals WHERE account_id IN (SELECT user_account_ids())
    )
  );

-- Alerts: via account
CREATE POLICY "alerts_own" ON alerts
  FOR ALL USING (account_id IN (SELECT user_account_ids()));

-- WhatsApp sessions: via profile
CREATE POLICY "whatsapp_sessions_own" ON whatsapp_sessions
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- 15. FUNÇÕES ATUALIZADAS
-- ============================================================

-- Gera transações de recorrências para o mês
CREATE OR REPLACE FUNCTION generate_recurring_for_month(target_month TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_month TEXT;
  v_year INTEGER;
  v_month_num INTEGER;
  v_rec recurring_transactions%ROWTYPE;
  v_date DATE;
  v_count INTEGER := 0;
BEGIN
  v_month := COALESCE(target_month, TO_CHAR(NOW(), 'YYYY-MM'));
  v_year := SPLIT_PART(v_month, '-', 1)::INTEGER;
  v_month_num := SPLIT_PART(v_month, '-', 2)::INTEGER;

  FOR v_rec IN
    SELECT * FROM recurring_transactions
    WHERE active = TRUE
      AND frequency = 'monthly'
      AND start_date <= MAKE_DATE(v_year, v_month_num, 28)
      AND (end_date IS NULL OR end_date >= MAKE_DATE(v_year, v_month_num, 1))
  LOOP
    v_date := MAKE_DATE(v_year, v_month_num,
      LEAST(COALESCE(v_rec.day_of_month, 1),
        DATE_PART('day',
          (DATE_TRUNC('month', MAKE_DATE(v_year, v_month_num, 1)) + INTERVAL '1 month - 1 day')
        )::INTEGER)
    );

    -- Evita duplicata
    IF NOT EXISTS (
      SELECT 1 FROM transactions
      WHERE recurring_id = v_rec.id AND month_ref = v_month
    ) THEN
      INSERT INTO transactions (
        account_id, profile_id, category_id, payment_method_id,
        type, description, amount, date, month_ref,
        is_recurring, recurring_id, source
      ) VALUES (
        v_rec.account_id, v_rec.profile_id, v_rec.category_id, v_rec.payment_method_id,
        v_rec.type, v_rec.description, v_rec.amount, v_date, v_month,
        TRUE, v_rec.id, 'recurring'
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN JSON_BUILD_OBJECT('month', v_month, 'generated', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifica orçamentos e cria alertas
CREATE OR REPLACE FUNCTION check_budget_alerts()
RETURNS JSON AS $$
DECLARE
  v_budget RECORD;
  v_count INTEGER := 0;
  v_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  FOR v_budget IN
    SELECT * FROM v_budget_status
    WHERE month_ref = v_month
      AND spent_percentage >= (alert_threshold * 100)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM alerts
      WHERE reference_id = v_budget.budget_id
        AND type IN ('budget_warning', 'budget_exceeded')
        AND created_at >= DATE_TRUNC('month', NOW())
    ) THEN
      INSERT INTO alerts (account_id, type, title, message, severity, reference_id, reference_type)
      VALUES (
        v_budget.account_id,
        CASE WHEN v_budget.spent_percentage >= 100 THEN 'budget_exceeded' ELSE 'budget_warning' END,
        CASE WHEN v_budget.spent_percentage >= 100
          THEN 'Orçamento ultrapassado: ' || v_budget.category_name
          ELSE 'Orçamento quase no limite: ' || v_budget.category_name
        END,
        v_budget.category_icon || ' ' || v_budget.category_name || ': ' ||
          v_budget.spent_percentage || '% do orçamento utilizado',
        CASE WHEN v_budget.spent_percentage >= 100 THEN 'danger' ELSE 'warning' END,
        v_budget.budget_id,
        'budget'
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN JSON_BUILD_OBJECT('alerts_created', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 16. DADOS PADRÃO DE MÉTODOS DE PAGAMENTO
-- (serão criados por account via trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION create_default_payment_methods()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO payment_methods (account_id, name, type, icon, color, is_default) VALUES
    (NEW.id, 'Cartão de Crédito', 'credit', '💳', '#8b5cf6', TRUE),
    (NEW.id, 'Cartão de Débito', 'debit', '💳', '#3b82f6', FALSE),
    (NEW.id, 'Pix', 'pix', '⚡', '#22c55e', FALSE),
    (NEW.id, 'Dinheiro', 'cash', '💵', '#10b981', FALSE),
    (NEW.id, 'Transferência', 'transfer', '🏦', '#6366f1', FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_default_payment_methods
  AFTER INSERT ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION create_default_payment_methods();

-- Categorias padrão de receita
INSERT INTO categories (name, icon, color, type) VALUES
  ('Salário', '💰', '#22c55e', 'income'),
  ('Freelance', '💻', '#3b82f6', 'income'),
  ('Investimentos', '📈', '#8b5cf6', 'income'),
  ('Presente', '🎁', '#ec4899', 'income'),
  ('Outros (Receita)', '💸', '#6b7280', 'income')
ON CONFLICT DO NOTHING;

-- Atualiza categorias existentes para ter type = 'expense'
UPDATE categories SET type = 'expense' WHERE type IS NULL AND profile_id IS NULL;

-- ============================================================
-- 17. TRIGGER: atualiza current_amount da meta ao fazer contribuição
-- ============================================================
CREATE OR REPLACE FUNCTION update_goal_current_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE financial_goals
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM goal_contributions
    WHERE goal_id = NEW.goal_id
  ),
  status = CASE
    WHEN (SELECT COALESCE(SUM(amount), 0) FROM goal_contributions WHERE goal_id = NEW.goal_id) >= target_amount
    THEN 'completed'
    ELSE status
  END,
  updated_at = NOW()
  WHERE id = NEW.goal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_goal_amount
  AFTER INSERT OR DELETE ON goal_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_current_amount();
