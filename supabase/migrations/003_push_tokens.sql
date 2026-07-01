-- ============================================================
-- MIGRATION 003: PUSH TOKENS (notificações do app Android)
-- Guarda os tokens FCM dos dispositivos para envio de push.
-- ============================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL DEFAULT 'android' CHECK (platform IN ('android', 'ios', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_account ON push_tokens(account_id);

-- ── Row Level Security (mesmo padrão das demais tabelas) ──
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Usuário gerencia apenas tokens das suas contas.
-- (O envio no backend usa a service role key, que ignora RLS.)
CREATE POLICY "push_tokens_own" ON push_tokens
  FOR ALL USING (account_id IN (SELECT user_account_ids()));
