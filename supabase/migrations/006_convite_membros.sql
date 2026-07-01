-- ============================================================
-- MIGRATION 006: CONVITE DE MEMBROS + BOOTSTRAP DE CONTA
--
-- Corrige dois problemas:
--
-- 1. Usuário novo não conseguia salvar o perfil: a policy de
--    accounts (FOR ALL USING id IN user_account_ids()) bloqueia
--    o INSERT da primeira account — sem perfil não se cria conta,
--    sem conta não se cria perfil. garantir_conta() resolve.
--
-- 2. Código de convite não fazia nada: agora convite_valido()
--    valida antes do cadastro e entrar_com_convite() coloca o
--    convidado na account (com aprovação automática de acesso).
--    Perfis passam a ser visíveis/editáveis por toda a account
--    (antes cada login só via o próprio perfil).
--
-- Padrão: SECURITY DEFINER sempre com SET search_path = public
-- e tabelas qualificadas (ver 005_fix_access_functions.sql).
-- ============================================================

-- ------------------------------------------------------------
-- 1. RLS de profiles por account
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_own" ON profiles;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (user_id = auth.uid() OR account_id IN (SELECT user_account_ids()));

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (user_id = auth.uid() OR account_id IN (SELECT user_account_ids()));

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (user_id = auth.uid() OR account_id IN (SELECT user_account_ids()));

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  USING (user_id = auth.uid() OR account_id IN (SELECT user_account_ids()));

-- ------------------------------------------------------------
-- 2. garantir_conta: retorna a account do usuário, criando se preciso
--    (SECURITY DEFINER contorna o ovo-e-galinha da RLS de accounts)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION garantir_conta()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT account_id INTO v_id FROM public.profiles
  WHERE user_id = auth.uid() AND account_id IS NOT NULL
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.accounts (name) VALUES ('Minha Conta') RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- ------------------------------------------------------------
-- 3. convite_valido: valida um código antes do cadastro (sem login)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION convite_valido(p_codigo TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.accounts WHERE invite_code = LOWER(TRIM(p_codigo))
  );
$$;

-- ------------------------------------------------------------
-- 4. entrar_com_convite: cria o perfil do usuário logado na
--    account do código e aprova o acesso (convite = aval do dono)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION entrar_com_convite(p_codigo TEXT, p_nome TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account public.accounts%ROWTYPE;
  v_qtd INT;
  -- mesmas cores de PROFILE_COLORS (src/lib/constants.ts)
  v_cores TEXT[] := ARRAY['#16a34a','#2563eb','#9333ea','#db2777','#ea580c','#0891b2','#65a30d','#c026d3','#dc2626','#0d9488'];
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN JSON_BUILD_OBJECT('ok', FALSE, 'error', 'Não autenticado');
  END IF;

  SELECT * INTO v_account FROM public.accounts WHERE invite_code = LOWER(TRIM(p_codigo));
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT('ok', FALSE, 'error', 'Código de convite inválido');
  END IF;

  -- convite válido = acesso aprovado (quem convida é membro da conta)
  INSERT INTO public.access_requests (user_id, email, approved)
  SELECT u.id, u.email, TRUE FROM auth.users u WHERE u.id = auth.uid()
  ON CONFLICT (user_id) DO UPDATE SET approved = TRUE;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND account_id = v_account.id) THEN
    RETURN JSON_BUILD_OBJECT('ok', TRUE, 'ja_membro', TRUE);
  END IF;

  SELECT COUNT(*) INTO v_qtd FROM public.profiles WHERE account_id = v_account.id;

  INSERT INTO public.profiles (user_id, account_id, name, role, color, salary_schedule)
  VALUES (
    auth.uid(),
    v_account.id,
    COALESCE(NULLIF(TRIM(p_nome), ''), 'Novo membro'),
    'member',
    v_cores[(v_qtd % 10) + 1],
    '[]'::jsonb
  );

  RETURN JSON_BUILD_OBJECT('ok', TRUE, 'account_id', v_account.id);
END;
$$;
