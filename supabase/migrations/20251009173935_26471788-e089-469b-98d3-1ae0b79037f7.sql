-- Primeiro, preencher context_id para registros existentes
-- Para cada user_id, encontrar o care_context correspondente (tipo 'self')
UPDATE public.checklist_daily_status
SET context_id = (
  SELECT id FROM care_contexts 
  WHERE owner_user_id = checklist_daily_status.user_id 
  AND type = 'self'
  LIMIT 1
)
WHERE context_id IS NULL;

-- Remover registros que ainda não têm context_id (casos órfãos)
DELETE FROM public.checklist_daily_status WHERE context_id IS NULL;

-- Agora modificar a tabela para usar context_id como chave principal
-- Remover a constraint única antiga
ALTER TABLE public.checklist_daily_status 
DROP CONSTRAINT IF EXISTS checklist_daily_status_user_day_item_key;

-- Tornar context_id obrigatório
ALTER TABLE public.checklist_daily_status 
ALTER COLUMN context_id SET NOT NULL;

-- Criar nova constraint única usando context_id ao invés de user_id
ALTER TABLE public.checklist_daily_status 
ADD CONSTRAINT checklist_daily_status_context_day_item_key 
UNIQUE (context_id, day, item_type, item_id, horario);

-- Atualizar RLS policies para permitir acesso compartilhado
DROP POLICY IF EXISTS "Users can view their own checklist status" ON public.checklist_daily_status;
DROP POLICY IF EXISTS "Users can insert their own checklist status" ON public.checklist_daily_status;
DROP POLICY IF EXISTS "Users can update their own checklist status" ON public.checklist_daily_status;
DROP POLICY IF EXISTS "Users can delete their own checklist status" ON public.checklist_daily_status;

-- Novas policies baseadas em context_id
CREATE POLICY "Users can view checklist in their contexts"
ON public.checklist_daily_status
FOR SELECT
USING (
  context_id IN (
    SELECT id FROM care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert checklist in their contexts"
ON public.checklist_daily_status
FOR INSERT
WITH CHECK (
  context_id IN (
    SELECT id FROM care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update checklist in their contexts"
ON public.checklist_daily_status
FOR UPDATE
USING (
  context_id IN (
    SELECT id FROM care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete checklist in their contexts"
ON public.checklist_daily_status
FOR DELETE
USING (
  context_id IN (
    SELECT id FROM care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

-- Atualizar índice para performance (apenas se não existir)
DROP INDEX IF EXISTS idx_checklist_daily_status_user_day;
DROP INDEX IF EXISTS idx_checklist_daily_status_context_day;
CREATE INDEX idx_checklist_daily_status_context_day 
ON public.checklist_daily_status(context_id, day);