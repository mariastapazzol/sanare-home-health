-- Remover a constraint única atual que usa user_id
ALTER TABLE public.checklist_daily_status 
DROP CONSTRAINT IF EXISTS checklist_daily_status_user_id_day_item_type_item_id_horario_key;

-- Adicionar nova constraint única usando context_id
ALTER TABLE public.checklist_daily_status 
ADD CONSTRAINT checklist_daily_status_context_unique 
UNIQUE (context_id, day, item_type, item_id, horario);

-- Criar índice para melhor performance nas queries por context_id
CREATE INDEX IF NOT EXISTS idx_checklist_context_day_item 
ON public.checklist_daily_status(context_id, day, item_type, item_id, horario);