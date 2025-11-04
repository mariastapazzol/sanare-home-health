-- Remover políticas antigas de medicamentos
DROP POLICY IF EXISTS "Users can delete medicamentos in their contexts" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can insert medicamentos in their contexts" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can update medicamentos in their contexts" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can view medicamentos in their contexts" ON public.medicamentos;
DROP POLICY IF EXISTS "med del" ON public.medicamentos;
DROP POLICY IF EXISTS "med ins" ON public.medicamentos;
DROP POLICY IF EXISTS "med sel" ON public.medicamentos;
DROP POLICY IF EXISTS "med upd" ON public.medicamentos;

-- Remover políticas antigas de lembretes
DROP POLICY IF EXISTS "Users can delete lembretes in their contexts" ON public.lembretes;
DROP POLICY IF EXISTS "Users can insert lembretes in their contexts" ON public.lembretes;
DROP POLICY IF EXISTS "Users can update lembretes in their contexts" ON public.lembretes;
DROP POLICY IF EXISTS "Users can view lembretes in their contexts" ON public.lembretes;
DROP POLICY IF EXISTS "lem del" ON public.lembretes;
DROP POLICY IF EXISTS "lem ins" ON public.lembretes;
DROP POLICY IF EXISTS "lem sel" ON public.lembretes;
DROP POLICY IF EXISTS "lem upd" ON public.lembretes;

-- Criar políticas para medicamentos usando can_access_context
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

-- Criar políticas para lembretes usando can_access_context
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