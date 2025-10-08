-- 1) Remover triggers legados e funções relacionadas a profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_for_user ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;

-- 2) Garantir FKs/UUID/RLS nas tabelas existentes
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE public.cuidadores            ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.pacientes_autonomos   ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.pacientes_dependentes ALTER COLUMN id SET DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cuidadores_user_fk') THEN
    ALTER TABLE public.cuidadores
      ADD CONSTRAINT cuidadores_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='pacientes_autonomos_user_fk') THEN
    ALTER TABLE public.pacientes_autonomos
      ADD CONSTRAINT pacientes_autonomos_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='pacientes_dependentes_user_fk') THEN
    ALTER TABLE public.pacientes_dependentes
      ADD CONSTRAINT pacientes_dependentes_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='pacientes_dependentes_cuidador_fk') THEN
    ALTER TABLE public.pacientes_dependentes
      ADD CONSTRAINT pacientes_dependentes_cuidador_fk FOREIGN KEY (cuidador_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_pacientes_dep_cuidador ON public.pacientes_dependentes(cuidador_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_cuidadores_username ON public.cuidadores(nome_usuario);
CREATE UNIQUE INDEX IF NOT EXISTS ux_autonomos_username ON public.pacientes_autonomos(nome_usuario);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dep_cuidador_username ON public.pacientes_dependentes(cuidador_id, nome_usuario);

ALTER TABLE public.cuidadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes_autonomos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes_dependentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cuidadores_self_all ON public.cuidadores;
CREATE POLICY cuidadores_self_all ON public.cuidadores
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS autonomos_self_all ON public.pacientes_autonomos;
CREATE POLICY autonomos_self_all ON public.pacientes_autonomos
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS dep_self_select ON public.pacientes_dependentes;
CREATE POLICY dep_self_select ON public.pacientes_dependentes
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS dep_self_update ON public.pacientes_dependentes;
CREATE POLICY dep_self_update ON public.pacientes_dependentes
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS dep_by_caregiver_all ON public.pacientes_dependentes;
CREATE POLICY dep_by_caregiver_all ON public.pacientes_dependentes
  FOR ALL
  USING (cuidador_id = auth.uid())
  WITH CHECK (cuidador_id = auth.uid());