-- ============================================
-- CRIAR SISTEMA DE 3 TIPOS DE USUÁRIOS
-- Paciente Autônomo, Cuidador, Paciente Dependente
-- ============================================

-- 1. Criar enum para user_role
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('paciente_autonomo', 'cuidador', 'paciente_dependente');
  END IF;
END $$;

-- 2. Adicionar role na tabela profiles se não existir
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'paciente_autonomo';

-- 3. Criar tabela de pacientes_dependentes
CREATE TABLE IF NOT EXISTS pacientes_dependentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  nome_usuario text UNIQUE NOT NULL,
  nascimento date,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE pacientes_dependentes ENABLE ROW LEVEL SECURITY;

-- 4. Criar tabela de cuidadores
CREATE TABLE IF NOT EXISTS cuidadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  nome_usuario text UNIQUE NOT NULL,
  nascimento date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  dependente_id uuid UNIQUE REFERENCES pacientes_dependentes(id) ON DELETE SET NULL
);

ALTER TABLE cuidadores ENABLE ROW LEVEL SECURITY;

-- 5. Criar tabela care_contexts
CREATE TABLE IF NOT EXISTS care_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL, -- 'autocuidado' ou 'dependente'
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dependente_id uuid REFERENCES pacientes_dependentes(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE care_contexts ENABLE ROW LEVEL SECURITY;

-- 6. Criar função de segurança para verificar acesso ao contexto
CREATE OR REPLACE FUNCTION can_access_context(context_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM care_contexts cc
    WHERE cc.id = context_uuid
    AND (
      cc.owner_user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM pacientes_dependentes pd
        WHERE pd.id = cc.dependente_id
        AND pd.user_id = auth.uid()
      )
    )
  );
$$;

-- 7. RLS Policies para care_contexts
CREATE POLICY "Users can view their own contexts"
ON care_contexts FOR SELECT
USING (
  owner_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM pacientes_dependentes pd
    WHERE pd.id = care_contexts.dependente_id
    AND pd.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own contexts"
ON care_contexts FOR INSERT
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update their own contexts"
ON care_contexts FOR UPDATE
USING (owner_user_id = auth.uid());

CREATE POLICY "Users can delete their own contexts"
ON care_contexts FOR DELETE
USING (owner_user_id = auth.uid());

-- 8. RLS Policies para cuidadores
CREATE POLICY "Users can manage their own cuidador record"
ON cuidadores FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 9. RLS Policies para pacientes_dependentes
CREATE POLICY "Caregivers can view their dependents"
ON pacientes_dependentes FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM cuidadores c
    WHERE c.user_id = auth.uid()
    AND c.dependente_id = pacientes_dependentes.id
  )
);

CREATE POLICY "Caregivers can update their dependents"
ON pacientes_dependentes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM cuidadores c
    WHERE c.user_id = auth.uid()
    AND c.dependente_id = pacientes_dependentes.id
  )
);

CREATE POLICY "Dependents can view their own record"
ON pacientes_dependentes FOR SELECT
USING (user_id = auth.uid());

-- 10. Adicionar context_id em todas as tabelas de dados
ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS context_id uuid REFERENCES care_contexts(id) ON DELETE CASCADE;
ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS dependente_id uuid REFERENCES pacientes_dependentes(id) ON DELETE CASCADE;

ALTER TABLE lembretes ADD COLUMN IF NOT EXISTS context_id uuid REFERENCES care_contexts(id) ON DELETE CASCADE;
ALTER TABLE lembretes ADD COLUMN IF NOT EXISTS dependente_id uuid REFERENCES pacientes_dependentes(id) ON DELETE CASCADE;

ALTER TABLE receitas ADD COLUMN IF NOT EXISTS context_id uuid REFERENCES care_contexts(id) ON DELETE CASCADE;
ALTER TABLE receitas ADD COLUMN IF NOT EXISTS dependente_id uuid REFERENCES pacientes_dependentes(id) ON DELETE CASCADE;

ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS context_id uuid REFERENCES care_contexts(id) ON DELETE CASCADE;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS dependente_id uuid REFERENCES pacientes_dependentes(id) ON DELETE CASCADE;

ALTER TABLE sinais_vitais ADD COLUMN IF NOT EXISTS context_id uuid REFERENCES care_contexts(id) ON DELETE CASCADE;
ALTER TABLE sinais_vitais ADD COLUMN IF NOT EXISTS dependente_id uuid REFERENCES pacientes_dependentes(id) ON DELETE CASCADE;

ALTER TABLE sintomas ADD COLUMN IF NOT EXISTS context_id uuid REFERENCES care_contexts(id) ON DELETE CASCADE;
ALTER TABLE sintomas ADD COLUMN IF NOT EXISTS dependente_id uuid REFERENCES pacientes_dependentes(id) ON DELETE CASCADE;

ALTER TABLE checklist_daily_status ADD COLUMN IF NOT EXISTS context_id uuid REFERENCES care_contexts(id) ON DELETE CASCADE;
ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS context_id uuid REFERENCES care_contexts(id) ON DELETE CASCADE;

-- 11. Atualizar RLS policies das tabelas de dados para usar contextos
-- MEDICAMENTOS
DROP POLICY IF EXISTS "Users can manage their own medicamentos" ON medicamentos;

CREATE POLICY "Users can view medicamentos in their contexts"
ON medicamentos FOR SELECT
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can insert medicamentos in their contexts"
ON medicamentos FOR INSERT
WITH CHECK (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can update medicamentos in their contexts"
ON medicamentos FOR UPDATE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can delete medicamentos in their contexts"
ON medicamentos FOR DELETE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

-- LEMBRETES
DROP POLICY IF EXISTS "Users can manage their own lembretes" ON lembretes;

CREATE POLICY "Users can view lembretes in their contexts"
ON lembretes FOR SELECT
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can insert lembretes in their contexts"
ON lembretes FOR INSERT
WITH CHECK (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can update lembretes in their contexts"
ON lembretes FOR UPDATE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can delete lembretes in their contexts"
ON lembretes FOR DELETE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

-- RECEITAS
DROP POLICY IF EXISTS "Users can manage their own receitas" ON receitas;

CREATE POLICY "Users can view receitas in their contexts"
ON receitas FOR SELECT
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can insert receitas in their contexts"
ON receitas FOR INSERT
WITH CHECK (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can update receitas in their contexts"
ON receitas FOR UPDATE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can delete receitas in their contexts"
ON receitas FOR DELETE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

-- DIARY_ENTRIES
DROP POLICY IF EXISTS "Users can manage their own diary entries" ON diary_entries;

CREATE POLICY "Users can view diary entries in their contexts"
ON diary_entries FOR SELECT
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can insert diary entries in their contexts"
ON diary_entries FOR INSERT
WITH CHECK (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can update diary entries in their contexts"
ON diary_entries FOR UPDATE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can delete diary entries in their contexts"
ON diary_entries FOR DELETE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

-- SINAIS_VITAIS
DROP POLICY IF EXISTS "Users can manage their own sinais_vitais" ON sinais_vitais;

CREATE POLICY "Users can view sinais_vitais in their contexts"
ON sinais_vitais FOR SELECT
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can insert sinais_vitais in their contexts"
ON sinais_vitais FOR INSERT
WITH CHECK (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can update sinais_vitais in their contexts"
ON sinais_vitais FOR UPDATE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can delete sinais_vitais in their contexts"
ON sinais_vitais FOR DELETE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

-- SINTOMAS
DROP POLICY IF EXISTS "Users can manage their own sintomas" ON sintomas;

CREATE POLICY "Users can view sintomas in their contexts"
ON sintomas FOR SELECT
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can insert sintomas in their contexts"
ON sintomas FOR INSERT
WITH CHECK (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can update sintomas in their contexts"
ON sintomas FOR UPDATE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can delete sintomas in their contexts"
ON sintomas FOR DELETE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

-- CHECKLIST_DAILY_STATUS
DROP POLICY IF EXISTS "Users can manage their own checklist status" ON checklist_daily_status;

CREATE POLICY "Users can view checklist status in their contexts"
ON checklist_daily_status FOR SELECT
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can insert checklist status in their contexts"
ON checklist_daily_status FOR INSERT
WITH CHECK (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can update checklist status in their contexts"
ON checklist_daily_status FOR UPDATE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can delete checklist status in their contexts"
ON checklist_daily_status FOR DELETE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

-- 12. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_care_contexts_owner_user_id ON care_contexts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_care_contexts_dependente_id ON care_contexts(dependente_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_context_id ON medicamentos(context_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_context_id ON lembretes(context_id);
CREATE INDEX IF NOT EXISTS idx_receitas_context_id ON receitas(context_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_context_id ON diary_entries(context_id);
CREATE INDEX IF NOT EXISTS idx_sinais_vitais_context_id ON sinais_vitais(context_id);
CREATE INDEX IF NOT EXISTS idx_sintomas_context_id ON sintomas(context_id);
CREATE INDEX IF NOT EXISTS idx_checklist_daily_status_context_id ON checklist_daily_status(context_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_context_id ON movimentacoes_estoque(context_id);

-- 13. Criar triggers para updated_at
CREATE OR REPLACE FUNCTION update_care_contexts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_care_contexts_updated_at_trigger ON care_contexts;
CREATE TRIGGER update_care_contexts_updated_at_trigger
  BEFORE UPDATE ON care_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_care_contexts_updated_at();

DROP TRIGGER IF EXISTS update_cuidadores_updated_at_trigger ON cuidadores;
CREATE TRIGGER update_cuidadores_updated_at_trigger
  BEFORE UPDATE ON cuidadores
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_pacientes_dependentes_updated_at_trigger ON pacientes_dependentes;
CREATE TRIGGER update_pacientes_dependentes_updated_at_trigger
  BEFORE UPDATE ON pacientes_dependentes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();