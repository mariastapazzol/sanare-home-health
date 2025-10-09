-- Adicionar campo receita_pendente na tabela medicamentos
ALTER TABLE public.medicamentos 
ADD COLUMN IF NOT EXISTS receita_pendente BOOLEAN DEFAULT false;