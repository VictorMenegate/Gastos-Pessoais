-- ============================================================
-- MIGRATION 005: corrige as funções de aprovação
-- Problema: SECURITY DEFINER sem search_path não achava
-- public.access_requests -> quebrava o signup (500).
-- Correção: qualificar com public. + SET search_path + blindar.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first BOOLEAN;
BEGIN
  SELECT COUNT(*) = 0 INTO v_first FROM public.access_requests;
  INSERT INTO public.access_requests (user_id, email, approved, is_admin)
  VALUES (NEW.id, NEW.email, v_first, v_first)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- nunca deixa o signup falhar por causa disso
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION is_approved()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT approved FROM public.access_requests WHERE user_id = auth.uid()), FALSE);
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.access_requests WHERE user_id = auth.uid()), FALSE);
$$;

GRANT EXECUTE ON FUNCTION is_approved() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated, service_role;
