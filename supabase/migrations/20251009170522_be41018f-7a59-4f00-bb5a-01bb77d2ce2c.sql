-- Criar tabela para persistir estado diário de medicamentos e lembretes
CREATE TABLE IF NOT EXISTS public.checklist_daily_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  context_id uuid REFERENCES public.care_contexts(id) ON DELETE CASCADE,
  day date NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('medicamento', 'lembrete')),
  item_id uuid NOT NULL,
  horario text NOT NULL,
  checked boolean NOT NULL DEFAULT false,
  inactive boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, day, item_type, item_id, horario)
);

-- Enable RLS
ALTER TABLE public.checklist_daily_status ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para checklist_daily_status
CREATE POLICY "Users can view their own checklist status"
  ON public.checklist_daily_status
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR context_id IN (
      SELECT id FROM care_contexts 
      WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own checklist status"
  ON public.checklist_daily_status
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR context_id IN (
      SELECT id FROM care_contexts 
      WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own checklist status"
  ON public.checklist_daily_status
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR context_id IN (
      SELECT id FROM care_contexts 
      WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own checklist status"
  ON public.checklist_daily_status
  FOR DELETE
  USING (
    auth.uid() = user_id 
    OR context_id IN (
      SELECT id FROM care_contexts 
      WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_checklist_daily_status_updated_at
  BEFORE UPDATE ON public.checklist_daily_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_checklist_daily_status_user_day ON public.checklist_daily_status(user_id, day);
CREATE INDEX idx_checklist_daily_status_context_day ON public.checklist_daily_status(context_id, day);