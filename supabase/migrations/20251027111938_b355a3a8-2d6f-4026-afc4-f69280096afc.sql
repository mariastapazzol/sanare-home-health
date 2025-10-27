-- ============================================
-- RECONSTRUÇÃO COMPLETA DO BANCO DE DADOS
-- Versão 2 - Corrigida
-- ============================================

-- 1. CRIAR ENUM PARA ROLES (se não existir)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('cuidador', 'paciente_autonomo', 'paciente_dependente');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. CRIAR TABELA DE ROLES SEPARADA (SEGURANÇA)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. HABILITAR RLS NA TABELA user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR FUNÇÃO SECURITY DEFINER PARA VERIFICAR ROLES
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 5. CRIAR FUNÇÃO PARA OBTER ROLE DO USUÁRIO
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- 6. MIGRAR ROLES EXISTENTES DE profiles PARA user_roles (conversão via texto)
INSERT INTO public.user_roles (user_id, role)
SELECT 
  user_id, 
  CASE role::text
    WHEN 'cuidador' THEN 'cuidador'::app_role
    WHEN 'paciente_autonomo' THEN 'paciente_autonomo'::app_role
    WHEN 'paciente_dependente' THEN 'paciente_dependente'::app_role
  END as role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. POLÍTICAS RLS PARA user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 8. ADICIONAR TRIGGERS PARA USERNAME ÚNICO
DROP TRIGGER IF EXISTS check_unique_username_cuidadores ON public.cuidadores;
CREATE TRIGGER check_unique_username_cuidadores
  BEFORE INSERT OR UPDATE ON public.cuidadores
  FOR EACH ROW
  EXECUTE FUNCTION public.check_unique_username();

DROP TRIGGER IF EXISTS check_unique_username_autonomos ON public.pacientes_autonomos;
CREATE TRIGGER check_unique_username_autonomos
  BEFORE INSERT OR UPDATE ON public.pacientes_autonomos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_unique_username();

DROP TRIGGER IF EXISTS check_unique_username_dependentes ON public.pacientes_dependentes;
CREATE TRIGGER check_unique_username_dependentes
  BEFORE INSERT OR UPDATE ON public.pacientes_dependentes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_unique_username();

-- 9. FUNÇÃO PARA AUTO-CRIAR CARE CONTEXT SELF
CREATE OR REPLACE FUNCTION public.create_self_care_context()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM care_contexts 
    WHERE owner_user_id = NEW.user_id AND tipo = 'self'
  ) THEN
    INSERT INTO care_contexts (nome, tipo, owner_user_id)
    VALUES ('Meu Cuidado', 'self', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 10. TRIGGER PARA AUTO-CRIAR CARE CONTEXT
DROP TRIGGER IF EXISTS auto_create_self_context_autonomo ON public.pacientes_autonomos;
CREATE TRIGGER auto_create_self_context_autonomo
  AFTER INSERT ON public.pacientes_autonomos
  FOR EACH ROW
  EXECUTE FUNCTION public.create_self_care_context();

DROP TRIGGER IF EXISTS auto_create_self_context_cuidador ON public.cuidadores;
CREATE TRIGGER auto_create_self_context_cuidador
  AFTER INSERT ON public.cuidadores
  FOR EACH ROW
  EXECUTE FUNCTION public.create_self_care_context();

-- 11. GARANTIR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_care_contexts_owner ON public.care_contexts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_care_contexts_dependente ON public.care_contexts(dependente_id);
CREATE INDEX IF NOT EXISTS idx_cuidadores_user_id ON public.cuidadores(user_id);
CREATE INDEX IF NOT EXISTS idx_cuidadores_dependente_id ON public.cuidadores(dependente_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_autonomos_user_id ON public.pacientes_autonomos(user_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_dependentes_user_id ON public.pacientes_dependentes(user_id);

-- 12. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.user_roles IS 'Tabela separada para roles de usuário (segurança contra escalação de privilégios)';
COMMENT ON FUNCTION public.has_role IS 'Função security definer para verificar role sem recursão RLS';
COMMENT ON FUNCTION public.get_user_role IS 'Função security definer para obter role do usuário';
COMMENT ON FUNCTION public.create_self_care_context IS 'Cria automaticamente contexto self para novos usuários';