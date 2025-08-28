-- Primeiro, vamos atualizar as tabelas para corresponder ao sistema de três tipos de usuários

-- Remove tabela dependentes antiga se existir
DROP TABLE IF EXISTS public.dependentes CASCADE;

-- Garante que todas as tabelas necessárias existam com a estrutura correta

-- Tabela cuidadores (se não existir)
CREATE TABLE IF NOT EXISTS public.cuidadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  nome_usuario TEXT NOT NULL UNIQUE,
  telefone TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela pacientes_autonomos (se não existir)
CREATE TABLE IF NOT EXISTS public.pacientes_autonomos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  nome_usuario TEXT NOT NULL UNIQUE,
  nascimento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela pacientes_dependentes (se não existir)
CREATE TABLE IF NOT EXISTS public.pacientes_dependentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cuidador_id UUID NOT NULL REFERENCES public.cuidadores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nome_usuario TEXT NOT NULL UNIQUE,
  nascimento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilita RLS em todas as tabelas
ALTER TABLE public.cuidadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes_autonomos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes_dependentes ENABLE ROW LEVEL SECURITY;

-- Políticas para cuidadores
DROP POLICY IF EXISTS "Users can view their own caregiver record" ON public.cuidadores;
DROP POLICY IF EXISTS "Users can create their own caregiver record" ON public.cuidadores;
DROP POLICY IF EXISTS "Users can update their own caregiver record" ON public.cuidadores;
DROP POLICY IF EXISTS "Users can delete their own caregiver record" ON public.cuidadores;

CREATE POLICY "Users can view their own caregiver record" 
ON public.cuidadores FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own caregiver record" 
ON public.cuidadores FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own caregiver record" 
ON public.cuidadores FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own caregiver record" 
ON public.cuidadores FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para pacientes autônomos
DROP POLICY IF EXISTS "Users can view their own autonomous patient record" ON public.pacientes_autonomos;
DROP POLICY IF EXISTS "Users can create their own autonomous patient record" ON public.pacientes_autonomos;
DROP POLICY IF EXISTS "Users can update their own autonomous patient record" ON public.pacientes_autonomos;
DROP POLICY IF EXISTS "Users can delete their own autonomous patient record" ON public.pacientes_autonomos;

CREATE POLICY "Users can view their own autonomous patient record" 
ON public.pacientes_autonomos FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own autonomous patient record" 
ON public.pacientes_autonomos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own autonomous patient record" 
ON public.pacientes_autonomos FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own autonomous patient record" 
ON public.pacientes_autonomos FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para pacientes dependentes
DROP POLICY IF EXISTS "Users can view their own dependent patient record" ON public.pacientes_dependentes;
DROP POLICY IF EXISTS "Users can create their own dependent patient record" ON public.pacientes_dependentes;
DROP POLICY IF EXISTS "Users can update their own dependent patient record" ON public.pacientes_dependentes;
DROP POLICY IF EXISTS "Users can delete their own dependent patient record" ON public.pacientes_dependentes;
DROP POLICY IF EXISTS "Caregivers can view their dependent patients" ON public.pacientes_dependentes;
DROP POLICY IF EXISTS "Caregivers can create dependent patients" ON public.pacientes_dependentes;
DROP POLICY IF EXISTS "Caregivers can update their dependent patients" ON public.pacientes_dependentes;
DROP POLICY IF EXISTS "Caregivers can delete their dependent patients" ON public.pacientes_dependentes;

CREATE POLICY "Users can view their own dependent patient record" 
ON public.pacientes_dependentes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dependent patient record" 
ON public.pacientes_dependentes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dependent patient record" 
ON public.pacientes_dependentes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dependent patient record" 
ON public.pacientes_dependentes FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can view their dependent patients" 
ON public.pacientes_dependentes FOR SELECT 
USING (auth.uid() IN (
  SELECT user_id FROM public.cuidadores WHERE id = pacientes_dependentes.cuidador_id
));

CREATE POLICY "Caregivers can create dependent patients" 
ON public.pacientes_dependentes FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.cuidadores WHERE id = pacientes_dependentes.cuidador_id
));

CREATE POLICY "Caregivers can update their dependent patients" 
ON public.pacientes_dependentes FOR UPDATE 
USING (auth.uid() IN (
  SELECT user_id FROM public.cuidadores WHERE id = pacientes_dependentes.cuidador_id
));

CREATE POLICY "Caregivers can delete their dependent patients" 
ON public.pacientes_dependentes FOR DELETE 
USING (auth.uid() IN (
  SELECT user_id FROM public.cuidadores WHERE id = pacientes_dependentes.cuidador_id
));

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_cuidadores_updated_at ON public.cuidadores;
DROP TRIGGER IF EXISTS update_pacientes_autonomos_updated_at ON public.pacientes_autonomos;
DROP TRIGGER IF EXISTS update_pacientes_dependentes_updated_at ON public.pacientes_dependentes;

CREATE TRIGGER update_cuidadores_updated_at
  BEFORE UPDATE ON public.cuidadores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pacientes_autonomos_updated_at
  BEFORE UPDATE ON public.pacientes_autonomos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pacientes_dependentes_updated_at
  BEFORE UPDATE ON public.pacientes_dependentes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para validação de username único
DROP TRIGGER IF EXISTS check_username_cuidadores ON public.cuidadores;
DROP TRIGGER IF EXISTS check_username_pacientes_autonomos ON public.pacientes_autonomos;
DROP TRIGGER IF EXISTS check_username_pacientes_dependentes ON public.pacientes_dependentes;

CREATE TRIGGER check_username_cuidadores
  BEFORE INSERT OR UPDATE ON public.cuidadores
  FOR EACH ROW
  EXECUTE FUNCTION public.check_unique_username();

CREATE TRIGGER check_username_pacientes_autonomos
  BEFORE INSERT OR UPDATE ON public.pacientes_autonomos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_unique_username();