-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('paciente_autonomo', 'cuidador', 'dependente');

-- Drop old profiles table and recreate with new structure
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  caregiver_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  username text UNIQUE,
  birth_date date NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dependente_requires_caregiver CHECK (
    (role = 'dependente' AND caregiver_user_id IS NOT NULL) OR
    (role != 'dependente' AND caregiver_user_id IS NULL)
  )
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create care_contexts table
CREATE TABLE public.care_contexts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('self', 'dependent')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on care_contexts
ALTER TABLE public.care_contexts ENABLE ROW LEVEL SECURITY;

-- Add context_id to functional tables
ALTER TABLE public.diary_entries ADD COLUMN context_id uuid REFERENCES public.care_contexts(id) ON DELETE CASCADE;
ALTER TABLE public.sintomas ADD COLUMN context_id uuid REFERENCES public.care_contexts(id) ON DELETE CASCADE;
ALTER TABLE public.sinais_vitais ADD COLUMN context_id uuid REFERENCES public.care_contexts(id) ON DELETE CASCADE;
ALTER TABLE public.task_status ADD COLUMN context_id uuid REFERENCES public.care_contexts(id) ON DELETE CASCADE;

-- Create trigger function for profiles updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- Create trigger function for care_contexts updated_at
CREATE OR REPLACE FUNCTION public.update_care_contexts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for care_contexts updated_at
CREATE TRIGGER update_care_contexts_updated_at
BEFORE UPDATE ON public.care_contexts
FOR EACH ROW
EXECUTE FUNCTION public.update_care_contexts_updated_at();

-- Create trigger function to auto-create care context for autonomous patient or caregiver
CREATE OR REPLACE FUNCTION public.create_self_care_context()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('paciente_autonomo', 'cuidador') THEN
    INSERT INTO public.care_contexts (owner_user_id, type)
    VALUES (NEW.user_id, 'self');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-creating self care context
CREATE TRIGGER create_self_care_context_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_self_care_context();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can view their dependents profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() = caregiver_user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can update their dependents profiles"
ON public.profiles
FOR UPDATE
USING (auth.uid() = caregiver_user_id);

-- RLS Policies for care_contexts
CREATE POLICY "Users can view their own contexts"
ON public.care_contexts
FOR SELECT
USING (auth.uid() = owner_user_id OR auth.uid() = caregiver_user_id);

CREATE POLICY "Users can insert their own contexts"
ON public.care_contexts
FOR INSERT
WITH CHECK (auth.uid() = owner_user_id OR auth.uid() = caregiver_user_id);

CREATE POLICY "Users can update their own contexts"
ON public.care_contexts
FOR UPDATE
USING (auth.uid() = owner_user_id OR auth.uid() = caregiver_user_id);

CREATE POLICY "Users can delete their own contexts"
ON public.care_contexts
FOR DELETE
USING (auth.uid() = owner_user_id OR auth.uid() = caregiver_user_id);

-- RLS Policies for diary_entries with context_id
DROP POLICY IF EXISTS "Users can view their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can create their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can update their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can delete their own diary entries" ON public.diary_entries;

CREATE POLICY "Users can view diary entries in their contexts"
ON public.diary_entries
FOR SELECT
USING (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert diary entries in their contexts"
ON public.diary_entries
FOR INSERT
WITH CHECK (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update diary entries in their contexts"
ON public.diary_entries
FOR UPDATE
USING (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete diary entries in their contexts"
ON public.diary_entries
FOR DELETE
USING (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

-- RLS Policies for sintomas with context_id
DROP POLICY IF EXISTS "Users can view their own sintomas" ON public.sintomas;
DROP POLICY IF EXISTS "Users can create their own sintomas" ON public.sintomas;
DROP POLICY IF EXISTS "Users can update their own sintomas" ON public.sintomas;
DROP POLICY IF EXISTS "Users can delete their own sintomas" ON public.sintomas;

CREATE POLICY "Users can view sintomas in their contexts"
ON public.sintomas
FOR SELECT
USING (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert sintomas in their contexts"
ON public.sintomas
FOR INSERT
WITH CHECK (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update sintomas in their contexts"
ON public.sintomas
FOR UPDATE
USING (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete sintomas in their contexts"
ON public.sintomas
FOR DELETE
USING (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

-- RLS Policies for sinais_vitais with context_id
DROP POLICY IF EXISTS "Users can view their own sinais_vitais" ON public.sinais_vitais;
DROP POLICY IF EXISTS "Users can create their own sinais_vitais" ON public.sinais_vitais;
DROP POLICY IF EXISTS "Users can update their own sinais_vitais" ON public.sinais_vitais;
DROP POLICY IF EXISTS "Users can delete their own sinais_vitais" ON public.sinais_vitais;

CREATE POLICY "Users can view sinais_vitais in their contexts"
ON public.sinais_vitais
FOR SELECT
USING (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert sinais_vitais in their contexts"
ON public.sinais_vitais
FOR INSERT
WITH CHECK (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update sinais_vitais in their contexts"
ON public.sinais_vitais
FOR UPDATE
USING (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete sinais_vitais in their contexts"
ON public.sinais_vitais
FOR DELETE
USING (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

-- RLS Policies for task_status with context_id
DROP POLICY IF EXISTS "Users can view their own task status" ON public.task_status;
DROP POLICY IF EXISTS "Users can insert their own task status" ON public.task_status;
DROP POLICY IF EXISTS "Users can update their own task status" ON public.task_status;
DROP POLICY IF EXISTS "Users can delete their own task status" ON public.task_status;

CREATE POLICY "Users can view task_status in their contexts"
ON public.task_status
FOR SELECT
USING (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert task_status in their contexts"
ON public.task_status
FOR INSERT
WITH CHECK (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update task_status in their contexts"
ON public.task_status
FOR UPDATE
USING (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete task_status in their contexts"
ON public.task_status
FOR DELETE
USING (
  context_id IN (
    SELECT id FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);