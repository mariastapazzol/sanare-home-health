-- Add user_id DEFAULT auth.uid() to tables
ALTER TABLE public.lembretes ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.medicamentos ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.posologias ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.diary_entries ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.receitas ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Drop existing RLS policies for lembretes
DROP POLICY IF EXISTS "Users can delete lembretes in their contexts" ON public.lembretes;
DROP POLICY IF EXISTS "Users can insert lembretes in their contexts" ON public.lembretes;
DROP POLICY IF EXISTS "Users can update lembretes in their contexts" ON public.lembretes;
DROP POLICY IF EXISTS "Users can view lembretes in their contexts" ON public.lembretes;

-- Create new RLS policies for lembretes
CREATE POLICY "Users can view lembretes in their contexts"
ON public.lembretes FOR SELECT
USING (can_access_context(context_id));

CREATE POLICY "Users can insert lembretes in their contexts"
ON public.lembretes FOR INSERT
WITH CHECK (can_access_context(context_id));

CREATE POLICY "Users can update lembretes in their contexts"
ON public.lembretes FOR UPDATE
USING (can_access_context(context_id));

CREATE POLICY "Users can delete lembretes in their contexts"
ON public.lembretes FOR DELETE
USING (can_access_context(context_id));

-- Drop existing RLS policies for medicamentos
DROP POLICY IF EXISTS "Users can delete medicamentos in their contexts" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can insert medicamentos in their contexts" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can update medicamentos in their contexts" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can view medicamentos in their contexts" ON public.medicamentos;

-- Create new RLS policies for medicamentos
CREATE POLICY "Users can view medicamentos in their contexts"
ON public.medicamentos FOR SELECT
USING (can_access_context(context_id));

CREATE POLICY "Users can insert medicamentos in their contexts"
ON public.medicamentos FOR INSERT
WITH CHECK (can_access_context(context_id));

CREATE POLICY "Users can update medicamentos in their contexts"
ON public.medicamentos FOR UPDATE
USING (can_access_context(context_id));

CREATE POLICY "Users can delete medicamentos in their contexts"
ON public.medicamentos FOR DELETE
USING (can_access_context(context_id));

-- Drop existing RLS policies for posologias
DROP POLICY IF EXISTS "Users can create their own posologias" ON public.posologias;
DROP POLICY IF EXISTS "Users can delete their own posologias" ON public.posologias;
DROP POLICY IF EXISTS "Users can update their own posologias" ON public.posologias;
DROP POLICY IF EXISTS "Users can view their own posologias" ON public.posologias;

-- Create new RLS policies for posologias (via medicamento's context)
CREATE POLICY "Users can view posologias in their contexts"
ON public.posologias FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.medicamentos m
    WHERE m.id = posologias.medicamento_id
    AND can_access_context(m.context_id)
  )
);

CREATE POLICY "Users can insert posologias in their contexts"
ON public.posologias FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.medicamentos m
    WHERE m.id = posologias.medicamento_id
    AND can_access_context(m.context_id)
  )
);

CREATE POLICY "Users can update posologias in their contexts"
ON public.posologias FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.medicamentos m
    WHERE m.id = posologias.medicamento_id
    AND can_access_context(m.context_id)
  )
);

CREATE POLICY "Users can delete posologias in their contexts"
ON public.posologias FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.medicamentos m
    WHERE m.id = posologias.medicamento_id
    AND can_access_context(m.context_id)
  )
);

-- Drop existing RLS policies for diary_entries
DROP POLICY IF EXISTS "Users can delete diary entries in their contexts" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can insert diary entries in their contexts" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can update diary entries in their contexts" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can view diary entries in their contexts" ON public.diary_entries;

-- Create new RLS policies for diary_entries
CREATE POLICY "Users can view diary entries in their contexts"
ON public.diary_entries FOR SELECT
USING (can_access_context(context_id));

CREATE POLICY "Users can insert diary entries in their contexts"
ON public.diary_entries FOR INSERT
WITH CHECK (can_access_context(context_id));

CREATE POLICY "Users can update diary entries in their contexts"
ON public.diary_entries FOR UPDATE
USING (can_access_context(context_id));

CREATE POLICY "Users can delete diary entries in their contexts"
ON public.diary_entries FOR DELETE
USING (can_access_context(context_id));

-- Drop existing RLS policies for receitas
DROP POLICY IF EXISTS "Users can delete receitas in their contexts" ON public.receitas;
DROP POLICY IF EXISTS "Users can insert receitas in their contexts" ON public.receitas;
DROP POLICY IF EXISTS "Users can update receitas in their contexts" ON public.receitas;
DROP POLICY IF EXISTS "Users can view receitas in their contexts" ON public.receitas;

-- Create new RLS policies for receitas
CREATE POLICY "Users can view receitas in their contexts"
ON public.receitas FOR SELECT
USING (can_access_context(context_id));

CREATE POLICY "Users can insert receitas in their contexts"
ON public.receitas FOR INSERT
WITH CHECK (can_access_context(context_id));

CREATE POLICY "Users can update receitas in their contexts"
ON public.receitas FOR UPDATE
USING (can_access_context(context_id));

CREATE POLICY "Users can delete receitas in their contexts"
ON public.receitas FOR DELETE
USING (can_access_context(context_id));