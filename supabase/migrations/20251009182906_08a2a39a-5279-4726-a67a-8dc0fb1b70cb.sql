-- Drop existing policies for medicamentos
DROP POLICY IF EXISTS "Users can view their own medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can create their own medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can update their own medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can delete their own medicamentos" ON public.medicamentos;

-- Create new policies for medicamentos that consider dependente_id
-- Users can view their own medicamentos (without dependente_id)
CREATE POLICY "Users can view their own medicamentos" 
ON public.medicamentos 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  -- Dependentes can view medicamentos where their dependente_id matches
  dependente_id IN (
    SELECT id FROM public.pacientes_dependentes WHERE user_id = auth.uid()
  )
);

-- Users can create medicamentos for themselves or their dependents
CREATE POLICY "Users can create medicamentos" 
ON public.medicamentos 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    dependente_id IS NULL OR
    -- Must be creating for a dependent they own
    dependente_id IN (
      SELECT id FROM public.pacientes_dependentes WHERE cuidador_id = auth.uid()
    )
  )
);

-- Users can update their own medicamentos or dependents' medicamentos
CREATE POLICY "Users can update medicamentos" 
ON public.medicamentos 
FOR UPDATE 
USING (
  auth.uid() = user_id AND (
    dependente_id IS NULL OR
    dependente_id IN (
      SELECT id FROM public.pacientes_dependentes WHERE cuidador_id = auth.uid()
    )
  )
);

-- Users can delete their own medicamentos or dependents' medicamentos
CREATE POLICY "Users can delete medicamentos" 
ON public.medicamentos 
FOR DELETE 
USING (
  auth.uid() = user_id AND (
    dependente_id IS NULL OR
    dependente_id IN (
      SELECT id FROM public.pacientes_dependentes WHERE cuidador_id = auth.uid()
    )
  )
);

-- Drop existing policies for lembretes
DROP POLICY IF EXISTS "Users can view their own lembretes" ON public.lembretes;
DROP POLICY IF EXISTS "Users can create their own lembretes" ON public.lembretes;
DROP POLICY IF EXISTS "Users can update their own lembretes" ON public.lembretes;
DROP POLICY IF EXISTS "Users can delete their own lembretes" ON public.lembretes;

-- Create new policies for lembretes that consider dependente_id
-- Users can view their own lembretes (without dependente_id)
CREATE POLICY "Users can view lembretes" 
ON public.lembretes 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  -- Dependentes can view lembretes where their dependente_id matches
  dependente_id IN (
    SELECT id FROM public.pacientes_dependentes WHERE user_id = auth.uid()
  )
);

-- Users can create lembretes for themselves or their dependents
CREATE POLICY "Users can create lembretes" 
ON public.lembretes 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    dependente_id IS NULL OR
    -- Must be creating for a dependent they own
    dependente_id IN (
      SELECT id FROM public.pacientes_dependentes WHERE cuidador_id = auth.uid()
    )
  )
);

-- Users can update their own lembretes or dependents' lembretes
CREATE POLICY "Users can update lembretes" 
ON public.lembretes 
FOR UPDATE 
USING (
  auth.uid() = user_id AND (
    dependente_id IS NULL OR
    dependente_id IN (
      SELECT id FROM public.pacientes_dependentes WHERE cuidador_id = auth.uid()
    )
  )
);

-- Users can delete their own lembretes or dependents' lembretes
CREATE POLICY "Users can delete lembretes" 
ON public.lembretes 
FOR DELETE 
USING (
  auth.uid() = user_id AND (
    dependente_id IS NULL OR
    dependente_id IN (
      SELECT id FROM public.pacientes_dependentes WHERE cuidador_id = auth.uid()
    )
  )
);