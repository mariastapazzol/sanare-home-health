-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.dependentes CASCADE;
DROP TABLE IF EXISTS public.pacientes_autonomos CASCADE;
DROP TABLE IF EXISTS public.cuidadores CASCADE;
DROP TABLE IF EXISTS public.pacientes_dependentes CASCADE;

-- Create function to ensure unique usernames across all tables
CREATE OR REPLACE FUNCTION public.check_unique_username()
RETURNS TRIGGER AS $$
BEGIN
  -- Check in pacientes_autonomos
  IF EXISTS (SELECT 1 FROM public.pacientes_autonomos WHERE nome_usuario = NEW.nome_usuario) THEN
    RAISE EXCEPTION 'Nome de usuário já existe';
  END IF;
  
  -- Check in cuidadores
  IF EXISTS (SELECT 1 FROM public.cuidadores WHERE nome_usuario = NEW.nome_usuario) THEN
    RAISE EXCEPTION 'Nome de usuário já existe';
  END IF;
  
  -- Check in pacientes_dependentes
  IF EXISTS (SELECT 1 FROM public.pacientes_dependentes WHERE nome_usuario = NEW.nome_usuario) THEN
    RAISE EXCEPTION 'Nome de usuário já existe';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table for autonomous patients (Para Mim)
CREATE TABLE public.pacientes_autonomos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  nome_usuario TEXT NOT NULL UNIQUE,
  nascimento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for caregivers (Para Cuidar de Alguém - Etapa 1)
CREATE TABLE public.cuidadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  nome_usuario TEXT NOT NULL UNIQUE,
  telefone TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for dependent patients (Para Cuidar de Alguém - Etapa 2)
CREATE TABLE public.pacientes_dependentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  cuidador_id UUID NOT NULL,
  nome TEXT NOT NULL,
  nome_usuario TEXT NOT NULL UNIQUE,
  nascimento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (cuidador_id) REFERENCES public.cuidadores(id) ON DELETE CASCADE
);

-- Enable RLS on all tables
ALTER TABLE public.pacientes_autonomos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuidadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes_dependentes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pacientes_autonomos
CREATE POLICY "Users can view their own autonomous patient record" 
ON public.pacientes_autonomos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own autonomous patient record" 
ON public.pacientes_autonomos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own autonomous patient record" 
ON public.pacientes_autonomos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own autonomous patient record" 
ON public.pacientes_autonomos 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for cuidadores
CREATE POLICY "Users can view their own caregiver record" 
ON public.cuidadores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own caregiver record" 
ON public.cuidadores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own caregiver record" 
ON public.cuidadores 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own caregiver record" 
ON public.cuidadores 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for pacientes_dependentes
CREATE POLICY "Users can view their own dependent patient record" 
ON public.pacientes_dependentes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can view their dependent patients" 
ON public.pacientes_dependentes 
FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.cuidadores WHERE id = cuidador_id));

CREATE POLICY "Users can create their own dependent patient record" 
ON public.pacientes_dependentes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Caregivers can create dependent patients" 
ON public.pacientes_dependentes 
FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.cuidadores WHERE id = cuidador_id));

CREATE POLICY "Users can update their own dependent patient record" 
ON public.pacientes_dependentes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can update their dependent patients" 
ON public.pacientes_dependentes 
FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.cuidadores WHERE id = cuidador_id));

CREATE POLICY "Users can delete their own dependent patient record" 
ON public.pacientes_dependentes 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can delete their dependent patients" 
ON public.pacientes_dependentes 
FOR DELETE 
USING (auth.uid() IN (SELECT user_id FROM public.cuidadores WHERE id = cuidador_id));

-- Create triggers for unique username validation
CREATE TRIGGER check_unique_username_pacientes_autonomos
  BEFORE INSERT OR UPDATE ON public.pacientes_autonomos
  FOR EACH ROW EXECUTE FUNCTION public.check_unique_username();

CREATE TRIGGER check_unique_username_cuidadores
  BEFORE INSERT OR UPDATE ON public.cuidadores
  FOR EACH ROW EXECUTE FUNCTION public.check_unique_username();

CREATE TRIGGER check_unique_username_pacientes_dependentes
  BEFORE INSERT OR UPDATE ON public.pacientes_dependentes
  FOR EACH ROW EXECUTE FUNCTION public.check_unique_username();

-- Create triggers for updated_at
CREATE TRIGGER update_pacientes_autonomos_updated_at
  BEFORE UPDATE ON public.pacientes_autonomos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cuidadores_updated_at
  BEFORE UPDATE ON public.cuidadores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pacientes_dependentes_updated_at
  BEFORE UPDATE ON public.pacientes_dependentes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();