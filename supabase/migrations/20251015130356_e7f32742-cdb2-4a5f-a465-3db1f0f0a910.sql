-- Add medicamento_id and usada columns to receitas table
ALTER TABLE public.receitas 
ADD COLUMN medicamento_id uuid REFERENCES public.medicamentos(id) ON DELETE CASCADE,
ADD COLUMN usada boolean NOT NULL DEFAULT false;