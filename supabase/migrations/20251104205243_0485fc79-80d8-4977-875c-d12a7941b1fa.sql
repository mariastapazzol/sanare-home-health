-- Listar e remover todas as políticas existentes de checklist_daily_status
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'checklist_daily_status' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.checklist_daily_status', policy_record.policyname);
  END LOOP;
END $$;

-- Criar políticas corretas usando can_access_context
CREATE POLICY "Users can view checklist status in their contexts"
ON public.checklist_daily_status FOR SELECT
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can insert checklist status in their contexts"
ON public.checklist_daily_status FOR INSERT
WITH CHECK (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can update checklist status in their contexts"
ON public.checklist_daily_status FOR UPDATE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can delete checklist status in their contexts"
ON public.checklist_daily_status FOR DELETE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));