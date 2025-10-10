-- ============================================
-- CORREÇÃO: Checklist + Autônomo
-- ============================================

-- 1) Tornar context_id nullable em task_status (se não for)
ALTER TABLE task_status ALTER COLUMN context_id DROP NOT NULL;

-- 2) Remover policies antigas de task_status
DROP POLICY IF EXISTS "Users can view task_status in their contexts" ON task_status;
DROP POLICY IF EXISTS "Users can insert task_status in their contexts" ON task_status;
DROP POLICY IF EXISTS "Users can update task_status in their contexts" ON task_status;
DROP POLICY IF EXISTS "Users can delete task_status in their contexts" ON task_status;

-- 3) Criar novas policies para task_status
-- Permitir quando: (user_id = auth.uid() E context_id IS NULL) OU (context_id pertence ao usuário)
CREATE POLICY "Users can view their task_status"
ON task_status FOR SELECT
USING (
  (user_id = auth.uid() AND context_id IS NULL)
  OR
  (context_id IN (
    SELECT id FROM care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  ))
);

CREATE POLICY "Users can insert their task_status"
ON task_status FOR INSERT
WITH CHECK (
  (user_id = auth.uid() AND context_id IS NULL)
  OR
  (context_id IN (
    SELECT id FROM care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  ))
);

CREATE POLICY "Users can update their task_status"
ON task_status FOR UPDATE
USING (
  (user_id = auth.uid() AND context_id IS NULL)
  OR
  (context_id IN (
    SELECT id FROM care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  ))
);

CREATE POLICY "Users can delete their task_status"
ON task_status FOR DELETE
USING (
  (user_id = auth.uid() AND context_id IS NULL)
  OR
  (context_id IN (
    SELECT id FROM care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  ))
);

-- 4) Garantir defaults e triggers em todas as tabelas relevantes
-- Medicamentos
ALTER TABLE medicamentos 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Lembretes  
ALTER TABLE lembretes
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Checklist daily status
ALTER TABLE checklist_daily_status
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN checked SET DEFAULT false,
  ALTER COLUMN inactive SET DEFAULT false;

-- Task status
ALTER TABLE task_status
  ALTER COLUMN checked SET DEFAULT false;

-- 5) Criar/atualizar trigger de updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplicar trigger em medicamentos
DROP TRIGGER IF EXISTS update_medicamentos_updated_at ON medicamentos;
CREATE TRIGGER update_medicamentos_updated_at
  BEFORE UPDATE ON medicamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em lembretes
DROP TRIGGER IF EXISTS update_lembretes_updated_at ON lembretes;
CREATE TRIGGER update_lembretes_updated_at
  BEFORE UPDATE ON lembretes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em checklist_daily_status
DROP TRIGGER IF EXISTS update_checklist_daily_status_updated_at ON checklist_daily_status;
CREATE TRIGGER update_checklist_daily_status_updated_at
  BEFORE UPDATE ON checklist_daily_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em task_status (se tiver updated_at)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_status' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_task_status_updated_at ON task_status;
    CREATE TRIGGER update_task_status_updated_at
      BEFORE UPDATE ON task_status
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 6) Garantir que FKs de dependente_id são ON DELETE CASCADE
-- (apenas se necessário, sem quebrar dados existentes)
-- Nota: As FKs atuais já devem permitir NULL, então não vamos alterar