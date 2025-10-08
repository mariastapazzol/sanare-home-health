-- Criar tabela sintomas
CREATE TABLE public.sintomas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo_sintoma TEXT NOT NULL,
  intensidade INTEGER NOT NULL CHECK (intensidade >= 1 AND intensidade <= 10),
  duracao TEXT NOT NULL,
  fatores_relacionados JSONB NOT NULL DEFAULT '[]'::jsonb,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela sintomas
ALTER TABLE public.sintomas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sintomas
CREATE POLICY "Users can view their own sintomas"
ON public.sintomas
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sintomas"
ON public.sintomas
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sintomas"
ON public.sintomas
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sintomas"
ON public.sintomas
FOR DELETE
USING (auth.uid() = user_id);

-- Criar tabela sinais_vitais
CREATE TABLE public.sinais_vitais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pressao_sistolica NUMERIC,
  pressao_diastolica NUMERIC,
  frequencia_cardiaca NUMERIC,
  saturacao_oxigenio NUMERIC,
  temperatura NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela sinais_vitais
ALTER TABLE public.sinais_vitais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sinais_vitais
CREATE POLICY "Users can view their own sinais_vitais"
ON public.sinais_vitais
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sinais_vitais"
ON public.sinais_vitais
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sinais_vitais"
ON public.sinais_vitais
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sinais_vitais"
ON public.sinais_vitais
FOR DELETE
USING (auth.uid() = user_id);