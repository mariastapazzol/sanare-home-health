-- 1) Drop dependent profiles policies first
DROP POLICY IF EXISTS "Caregivers can view their dependents profiles" ON public.profiles;
DROP POLICY IF EXISTS "Caregivers can update their dependents profiles" ON public.profiles;

-- 2) Drop all policies that depend on can_access_context
DROP POLICY IF EXISTS "sel_chk_meds" ON public.checklist_meds;
DROP POLICY IF EXISTS "iud_chk_meds" ON public.checklist_meds;
DROP POLICY IF EXISTS "sel_chk_lemb" ON public.checklist_lembretes;
DROP POLICY IF EXISTS "iud_chk_lemb" ON public.checklist_lembretes;
DROP POLICY IF EXISTS "Users can view checklist status in their contexts" ON public.checklist_daily_status;
DROP POLICY IF EXISTS "Users can insert checklist status in their contexts" ON public.checklist_daily_status;
DROP POLICY IF EXISTS "Users can update checklist status in their contexts" ON public.checklist_daily_status;
DROP POLICY IF EXISTS "Users can delete checklist status in their contexts" ON public.checklist_daily_status;
DROP POLICY IF EXISTS "Users can view lembretes in their contexts" ON public.lembretes;
DROP POLICY IF EXISTS "Users can insert lembretes in their contexts" ON public.lembretes;
DROP POLICY IF EXISTS "Users can update lembretes in their contexts" ON public.lembretes;
DROP POLICY IF EXISTS "Users can delete lembretes in their contexts" ON public.lembretes;
DROP POLICY IF EXISTS "Users can view medicamentos in their contexts" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can insert medicamentos in their contexts" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can update medicamentos in their contexts" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can delete medicamentos in their contexts" ON public.medicamentos;
DROP POLICY IF EXISTS "Users can view posologias in their contexts" ON public.posologias;
DROP POLICY IF EXISTS "Users can insert posologias in their contexts" ON public.posologias;
DROP POLICY IF EXISTS "Users can update posologias in their contexts" ON public.posologias;
DROP POLICY IF EXISTS "Users can delete posologias in their contexts" ON public.posologias;
DROP POLICY IF EXISTS "Users can view diary entries in their contexts" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can insert diary entries in their contexts" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can update diary entries in their contexts" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can delete diary entries in their contexts" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can view receitas in their contexts" ON public.receitas;
DROP POLICY IF EXISTS "Users can insert receitas in their contexts" ON public.receitas;
DROP POLICY IF EXISTS "Users can update receitas in their contexts" ON public.receitas;
DROP POLICY IF EXISTS "Users can delete receitas in their contexts" ON public.receitas;
DROP POLICY IF EXISTS "Users can delete sintomas in their contexts" ON public.sintomas;
DROP POLICY IF EXISTS "Users can insert sintomas in their contexts" ON public.sintomas;
DROP POLICY IF EXISTS "Users can update sintomas in their contexts" ON public.sintomas;
DROP POLICY IF EXISTS "Users can view sintomas in their contexts" ON public.sintomas;
DROP POLICY IF EXISTS "Users can delete sinais_vitais in their contexts" ON public.sinais_vitais;
DROP POLICY IF EXISTS "Users can insert sinais_vitais in their contexts" ON public.sinais_vitais;
DROP POLICY IF EXISTS "Users can update sinais_vitais in their contexts" ON public.sinais_vitais;
DROP POLICY IF EXISTS "Users can view sinais_vitais in their contexts" ON public.sinais_vitais;

-- 3) Drop triggers
DROP TRIGGER IF EXISTS create_self_care_context_trigger ON public.profiles;
DROP TRIGGER IF EXISTS create_context_after_profile ON public.profiles;
DROP TRIGGER IF EXISTS auto_create_context_trigger ON public.pacientes_autonomos;
DROP TRIGGER IF EXISTS auto_create_profile_trigger ON public.pacientes_autonomos;

-- 4) Drop functions and tables
DROP FUNCTION IF EXISTS public.can_access_context(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_self_care_context() CASCADE;
DROP FUNCTION IF EXISTS public.auto_create_context_autonomo() CASCADE;
DROP FUNCTION IF EXISTS public.auto_create_profile_autonomo() CASCADE;

DROP TABLE IF EXISTS public.care_contexts CASCADE;
DROP TABLE IF EXISTS public.cuidadores CASCADE;
DROP TABLE IF EXISTS public.pacientes_dependentes CASCADE;

-- 5) Simplify profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS caregiver_user_id;

-- Drop and recreate role enum
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('paciente_autonomo');

-- Add role column back
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'paciente_autonomo'::public.user_role NOT NULL;

-- 6) Remove context_id columns and recreate simpler RLS
ALTER TABLE public.medicamentos DROP COLUMN IF EXISTS context_id;
ALTER TABLE public.medicamentos DROP COLUMN IF EXISTS dependente_id;
ALTER TABLE public.medicamentos ALTER COLUMN user_id SET NOT NULL;
CREATE POLICY "Users can manage their own medicamentos"
ON public.medicamentos FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.lembretes DROP COLUMN IF EXISTS context_id;
ALTER TABLE public.lembretes DROP COLUMN IF EXISTS dependente_id;
ALTER TABLE public.lembretes ALTER COLUMN user_id SET NOT NULL;
CREATE POLICY "Users can manage their own lembretes"
ON public.lembretes FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.receitas DROP COLUMN IF EXISTS context_id;
ALTER TABLE public.receitas ALTER COLUMN user_id SET NOT NULL;
CREATE POLICY "Users can manage their own receitas"
ON public.receitas FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.diary_entries DROP COLUMN IF EXISTS context_id;
ALTER TABLE public.diary_entries ALTER COLUMN user_id SET NOT NULL;
CREATE POLICY "Users can manage their own diary entries"
ON public.diary_entries FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.sintomas DROP COLUMN IF EXISTS context_id;
ALTER TABLE public.sintomas ALTER COLUMN user_id SET NOT NULL;
CREATE POLICY "Users can manage their own sintomas"
ON public.sintomas FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.sinais_vitais DROP COLUMN IF EXISTS context_id;
ALTER TABLE public.sinais_vitais ALTER COLUMN user_id SET NOT NULL;
CREATE POLICY "Users can manage their own sinais_vitais"
ON public.sinais_vitais FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.checklist_daily_status DROP COLUMN IF EXISTS context_id;
ALTER TABLE public.checklist_daily_status ALTER COLUMN user_id SET NOT NULL;
CREATE POLICY "Users can manage their own checklist status"
ON public.checklist_daily_status FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.checklist_meds DROP COLUMN IF EXISTS context_id;
CREATE POLICY "Users can manage checklist_meds"
ON public.checklist_meds FOR ALL
USING (EXISTS (SELECT 1 FROM public.medicamentos m WHERE m.id = checklist_meds.medicamento_id AND m.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.medicamentos m WHERE m.id = checklist_meds.medicamento_id AND m.user_id = auth.uid()));

ALTER TABLE public.checklist_lembretes DROP COLUMN IF EXISTS context_id;
CREATE POLICY "Users can manage checklist_lembretes"
ON public.checklist_lembretes FOR ALL
USING (EXISTS (SELECT 1 FROM public.lembretes l WHERE l.id = checklist_lembretes.lembrete_id AND l.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.lembretes l WHERE l.id = checklist_lembretes.lembrete_id AND l.user_id = auth.uid()));

CREATE POLICY "Users can manage posologias for their medicamentos"
ON public.posologias FOR ALL
USING (EXISTS (SELECT 1 FROM public.medicamentos m WHERE m.id = posologias.medicamento_id AND m.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.medicamentos m WHERE m.id = posologias.medicamento_id AND m.user_id = auth.uid()));