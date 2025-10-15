-- Criar tabela para receitas independentes
CREATE TABLE public.receitas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  imagem_url TEXT NOT NULL,
  context_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para receitas
CREATE POLICY "Users can view receitas in their contexts"
ON public.receitas
FOR SELECT
USING (
  context_id IN (
    SELECT id FROM care_contexts
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert receitas in their contexts"
ON public.receitas
FOR INSERT
WITH CHECK (
  context_id IN (
    SELECT id FROM care_contexts
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update receitas in their contexts"
ON public.receitas
FOR UPDATE
USING (
  context_id IN (
    SELECT id FROM care_contexts
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete receitas in their contexts"
ON public.receitas
FOR DELETE
USING (
  context_id IN (
    SELECT id FROM care_contexts
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_receitas_updated_at
BEFORE UPDATE ON public.receitas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();