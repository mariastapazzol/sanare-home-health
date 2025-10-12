-- Garantir que care_contexts existam para todos os usuários
-- Self contexts para pacientes autônomos
INSERT INTO public.care_contexts (owner_user_id, type)
SELECT p.user_id, 'self'::text
FROM public.profiles p
WHERE p.role = 'paciente_autonomo'
AND NOT EXISTS (
  SELECT 1 FROM public.care_contexts cc 
  WHERE cc.owner_user_id = p.user_id AND cc.type = 'self'
);

-- Dependent contexts para pacientes dependentes
INSERT INTO public.care_contexts (owner_user_id, caregiver_user_id, type)
SELECT 
  p.user_id,
  p.caregiver_user_id,
  'dependent'::text
FROM public.profiles p
WHERE p.role = 'paciente_dependente'
AND p.caregiver_user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.care_contexts cc 
  WHERE cc.owner_user_id = p.user_id AND cc.type = 'dependent'
);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_medicamentos_context_id ON public.medicamentos(context_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_context_id ON public.lembretes(context_id);
CREATE INDEX IF NOT EXISTS idx_care_contexts_owner ON public.care_contexts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_care_contexts_caregiver ON public.care_contexts(caregiver_user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_daily_status_context ON public.checklist_daily_status(context_id, day);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);