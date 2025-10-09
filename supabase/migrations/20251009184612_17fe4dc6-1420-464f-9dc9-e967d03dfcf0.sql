-- Corrigir RLS policies para medicamentos permitindo paciente_autonomo

-- Remover policies antigas
DROP POLICY IF EXISTS "Users can create medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can view their own medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can update medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can delete medicamentos" ON public.medicamentos;

-- Policy SELECT: 
-- 1. Autônomo vê seus próprios (user_id = auth.uid() AND dependente_id IS NULL)
-- 2. Dependente vê itens dele (dependente_id IN (...))
-- 3. Cuidador vê itens dos seus dependentes (dependente_id IN (...))
CREATE POLICY "Users can view medicamentos"
ON public.medicamentos
FOR SELECT
USING (
  -- Paciente autônomo vê seus próprios itens (sem dependente)
  (auth.uid() = user_id AND dependente_id IS NULL)
  OR
  -- Dependente vê itens criados para ele
  (dependente_id IN (
    SELECT id FROM public.pacientes_dependentes 
    WHERE user_id = auth.uid()
  ))
  OR
  -- Cuidador vê itens dos dependentes que gerencia
  (dependente_id IN (
    SELECT id FROM public.pacientes_dependentes 
    WHERE cuidador_id = auth.uid()
  ))
);

-- Policy INSERT:
-- 1. Autônomo pode criar (user_id = auth.uid() AND dependente_id IS NULL)
-- 2. Cuidador pode criar para dependentes
CREATE POLICY "Users can create medicamentos"
ON public.medicamentos
FOR INSERT
WITH CHECK (
  -- Paciente autônomo cria seus próprios itens (sem dependente)
  (auth.uid() = user_id AND dependente_id IS NULL)
  OR
  -- Cuidador cria para seus dependentes
  (auth.uid() = user_id AND dependente_id IN (
    SELECT id FROM public.pacientes_dependentes 
    WHERE cuidador_id = auth.uid()
  ))
);

-- Policy UPDATE:
CREATE POLICY "Users can update medicamentos"
ON public.medicamentos
FOR UPDATE
USING (
  -- Paciente autônomo atualiza seus próprios itens
  (auth.uid() = user_id AND dependente_id IS NULL)
  OR
  -- Cuidador atualiza itens dos dependentes que gerencia
  (auth.uid() = user_id AND dependente_id IN (
    SELECT id FROM public.pacientes_dependentes 
    WHERE cuidador_id = auth.uid()
  ))
);

-- Policy DELETE:
CREATE POLICY "Users can delete medicamentos"
ON public.medicamentos
FOR DELETE
USING (
  -- Paciente autônomo deleta seus próprios itens
  (auth.uid() = user_id AND dependente_id IS NULL)
  OR
  -- Cuidador deleta itens dos dependentes que gerencia
  (auth.uid() = user_id AND dependente_id IN (
    SELECT id FROM public.pacientes_dependentes 
    WHERE cuidador_id = auth.uid()
  ))
);

-- Corrigir RLS policies para lembretes com mesma lógica

-- Remover policies antigas
DROP POLICY IF EXISTS "Users can create lembretes" ON public.lembretes;
DROP POLICY IF EXISTS "Users can view lembretes" ON public.lembretes;
DROP POLICY IF EXISTS "Users can update lembretes" ON public.lembretes;
DROP POLICY IF EXISTS "Users can delete lembretes" ON public.lembretes;

-- Policy SELECT:
CREATE POLICY "Users can view lembretes"
ON public.lembretes
FOR SELECT
USING (
  -- Paciente autônomo vê seus próprios itens (sem dependente)
  (auth.uid() = user_id AND dependente_id IS NULL)
  OR
  -- Dependente vê itens criados para ele
  (dependente_id IN (
    SELECT id FROM public.pacientes_dependentes 
    WHERE user_id = auth.uid()
  ))
  OR
  -- Cuidador vê itens dos dependentes que gerencia
  (dependente_id IN (
    SELECT id FROM public.pacientes_dependentes 
    WHERE cuidador_id = auth.uid()
  ))
);

-- Policy INSERT:
CREATE POLICY "Users can create lembretes"
ON public.lembretes
FOR INSERT
WITH CHECK (
  -- Paciente autônomo cria seus próprios itens (sem dependente)
  (auth.uid() = user_id AND dependente_id IS NULL)
  OR
  -- Cuidador cria para seus dependentes
  (auth.uid() = user_id AND dependente_id IN (
    SELECT id FROM public.pacientes_dependentes 
    WHERE cuidador_id = auth.uid()
  ))
);

-- Policy UPDATE:
CREATE POLICY "Users can update lembretes"
ON public.lembretes
FOR UPDATE
USING (
  -- Paciente autônomo atualiza seus próprios itens
  (auth.uid() = user_id AND dependente_id IS NULL)
  OR
  -- Cuidador atualiza itens dos dependentes que gerencia
  (auth.uid() = user_id AND dependente_id IN (
    SELECT id FROM public.pacientes_dependentes 
    WHERE cuidador_id = auth.uid()
  ))
);

-- Policy DELETE:
CREATE POLICY "Users can delete lembretes"
ON public.lembretes
FOR DELETE
USING (
  -- Paciente autônomo deleta seus próprios itens
  (auth.uid() = user_id AND dependente_id IS NULL)
  OR
  -- Cuidador deleta itens dos dependentes que gerencia
  (auth.uid() = user_id AND dependente_id IN (
    SELECT id FROM public.pacientes_dependentes 
    WHERE cuidador_id = auth.uid()
  ))
);