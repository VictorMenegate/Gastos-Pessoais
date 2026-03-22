-- ============================================================
-- SCHEMA GASTOS PESSOAIS
-- Execute no SQL Editor do seu Supabase
-- ============================================================

-- Habilita extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: profiles
-- Um perfil por usuário (você e sua namorada)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- 'split' = vale + salário separados | 'single' = tudo junto
  payment_type TEXT NOT NULL DEFAULT 'single' CHECK (payment_type IN ('split', 'single')),
  -- JSON com as entradas de salário configuradas
  -- Exemplo split: [{"label":"Vale","amount":800,"day":5},{"label":"Salário","amount":4200,"day":20}]
  -- Exemplo single: [{"label":"Salário","amount":3500,"day":10}]
  salary_schedule JSONB NOT NULL DEFAULT '[]',
  color TEXT NOT NULL DEFAULT '#16a34a', -- cor do perfil no dashboard
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: income_entries
-- Registros de entradas de dinheiro (salário, vale, etc.)
-- ============================================================
CREATE TABLE income_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,               -- "Vale Alimentação", "Salário", etc.
  amount DECIMAL(12,2) NOT NULL,
  expected_date DATE NOT NULL,       -- data que deveria entrar
  received_date DATE,                -- data que realmente entrou (null = pendente)
  month_ref TEXT NOT NULL,           -- "2024-12" para facilitar filtros
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: categories
-- Categorias de gasto personalizáveis
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- null = categoria global
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '💰',
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias padrão (sem profile_id = globais)
INSERT INTO categories (name, icon, color) VALUES
  ('Alimentação', '🍔', '#f59e0b'),
  ('Transporte', '🚗', '#3b82f6'),
  ('Moradia', '🏠', '#8b5cf6'),
  ('Saúde', '🏥', '#ef4444'),
  ('Lazer', '🎮', '#ec4899'),
  ('Mercado', '🛒', '#10b981'),
  ('Educação', '📚', '#6366f1'),
  ('Roupas', '👕', '#f97316'),
  ('Streaming', '📺', '#14b8a6'),
  ('Outros', '💸', '#6b7280');

-- ============================================================
-- TABELA: expenses
-- Gastos do dia a dia
-- ============================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  month_ref TEXT NOT NULL,           -- "2024-12"
  paid BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: recurring_bills
-- Contas recorrentes (luz, internet, aluguel, streaming...)
-- ============================================================
CREATE TABLE recurring_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: bill_occurrences
-- Ocorrências mensais geradas automaticamente de recurring_bills
-- ============================================================
CREATE TABLE bill_occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurring_bill_id UUID NOT NULL REFERENCES recurring_bills(id) ON DELETE CASCADE,
  month_ref TEXT NOT NULL,           -- "2024-12"
  due_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,     -- pode ser diferente do padrão naquele mês
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recurring_bill_id, month_ref)
);

-- ============================================================
-- TABELA: installments
-- Compras parceladas
-- ============================================================
CREATE TABLE installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  installment_value DECIMAL(12,2) NOT NULL,
  total_installments INTEGER NOT NULL,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEWS úteis
-- ============================================================

-- Resumo mensal por perfil
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  p.id AS profile_id,
  p.name AS profile_name,
  e.month_ref,
  COALESCE(SUM(CASE WHEN ex.id IS NOT NULL THEN ex.amount ELSE 0 END), 0) AS total_expenses,
  COALESCE(SUM(CASE WHEN ie.id IS NOT NULL THEN ie.amount ELSE 0 END), 0) AS total_income_expected,
  COALESCE(SUM(CASE WHEN ie.received_date IS NOT NULL THEN ie.amount ELSE 0 END), 0) AS total_income_received
FROM profiles p
CROSS JOIN (SELECT DISTINCT month_ref FROM expenses UNION SELECT DISTINCT month_ref FROM income_entries) e
LEFT JOIN expenses ex ON ex.profile_id = p.id AND ex.month_ref = e.month_ref
LEFT JOIN income_entries ie ON ie.profile_id = p.id AND ie.month_ref = e.month_ref
GROUP BY p.id, p.name, e.month_ref;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuário só vê seus próprios dados
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário vê só os seus
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- Income entries: via profile do usuário
CREATE POLICY "income_own" ON income_entries
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Expenses: via profile do usuário
CREATE POLICY "expenses_own" ON expenses
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Recurring bills: via profile do usuário
CREATE POLICY "recurring_bills_own" ON recurring_bills
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Bill occurrences: via recurring_bills do usuário
CREATE POLICY "bill_occurrences_own" ON bill_occurrences
  FOR ALL USING (
    recurring_bill_id IN (
      SELECT rb.id FROM recurring_bills rb
      JOIN profiles p ON p.id = rb.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Installments: via profile do usuário
CREATE POLICY "installments_own" ON installments
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Categories: globais (sem profile_id) ou do próprio usuário
CREATE POLICY "categories_own_or_global" ON categories
  FOR ALL USING (
    profile_id IS NULL OR
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- FUNÇÃO: generate_monthly_occurrences
-- Chamada pelo cron todo dia 1 do mês
-- ============================================================
CREATE OR REPLACE FUNCTION generate_monthly_occurrences(target_month TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_month TEXT;
  v_year INTEGER;
  v_month_num INTEGER;
  v_due_date DATE;
  v_bill recurring_bills%ROWTYPE;
  v_installment installments%ROWTYPE;
  v_count INTEGER := 0;
BEGIN
  -- Usa mês atual se não passado
  v_month := COALESCE(target_month, TO_CHAR(NOW(), 'YYYY-MM'));
  v_year := SPLIT_PART(v_month, '-', 1)::INTEGER;
  v_month_num := SPLIT_PART(v_month, '-', 2)::INTEGER;

  -- Gera ocorrências de contas recorrentes
  FOR v_bill IN SELECT * FROM recurring_bills WHERE active = TRUE LOOP
    -- Calcula due_date respeitando fim de mês
    v_due_date := MAKE_DATE(v_year, v_month_num,
      LEAST(v_bill.due_day, DATE_PART('day',
        (DATE_TRUNC('month', MAKE_DATE(v_year, v_month_num, 1)) + INTERVAL '1 month - 1 day')
      )::INTEGER)
    );

    INSERT INTO bill_occurrences (recurring_bill_id, month_ref, due_date, amount)
    VALUES (v_bill.id, v_month, v_due_date, v_bill.amount)
    ON CONFLICT (recurring_bill_id, month_ref) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  -- Registra parcelas como despesas se ainda não registradas
  FOR v_installment IN
    SELECT * FROM installments
    WHERE active = TRUE
      AND paid_installments < total_installments
      AND TO_CHAR(start_date + ((paid_installments) * INTERVAL '1 month'), 'YYYY-MM') <= v_month
  LOOP
    v_count := v_count + 1;
  END LOOP;

  RETURN JSON_BUILD_OBJECT('month', v_month, 'processed', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
