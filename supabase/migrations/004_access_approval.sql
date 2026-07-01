-- ============================================================
-- MIGRATION 004: APROVAÇÃO DE CADASTRO
-- Novos cadastros ficam "pendentes" até um admin aprovar.
-- O primeiro usuário criado vira admin e já entra aprovado.
-- ============================================================

CREATE TABLE IF NOT EXISTS access_requests (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- cada usuário só lê a própria linha (o painel admin usa service_role via API)
DROP POLICY IF EXISTS "access_requests_self" ON access_requests;
CREATE POLICY "access_requests_self" ON access_requests
  FOR SELECT USING (user_id = auth.uid());

-- ao criar um usuário de auth, registra o pedido de acesso.
-- primeiro usuário do sistema = admin já aprovado; demais = pendentes.
CREATE OR REPLACE FUNCTION handle_new_access()
RETURNS TRIGGER AS $$
DECLARE
  v_first BOOLEAN;
BEGIN
  SELECT COUNT(*) = 0 INTO v_first FROM access_requests;
  BEGIN
    INSERT INTO access_requests (user_id, email, approved, is_admin)
    VALUES (NEW.id, NEW.email, v_first, v_first)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- nunca deixa o signup quebrar por causa disso
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_access ON auth.users;
CREATE TRIGGER trg_new_access
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_access();

-- backfill de usuários já existentes: todos aprovados; o mais antigo vira admin
INSERT INTO access_requests (user_id, email, approved, is_admin, created_at)
SELECT u.id, u.email, TRUE,
       (ROW_NUMBER() OVER (ORDER BY u.created_at) = 1),
       u.created_at
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- helpers para o middleware (SECURITY DEFINER = ignoram RLS)
CREATE OR REPLACE FUNCTION is_approved()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT approved FROM access_requests WHERE user_id = auth.uid()), FALSE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT is_admin FROM access_requests WHERE user_id = auth.uid()), FALSE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;
