-- Add receita_url column to medicamentos table for storing prescription images
ALTER TABLE public.medicamentos 
ADD COLUMN IF NOT EXISTS receita_url TEXT;