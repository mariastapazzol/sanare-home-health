-- Garantir que todos os pacientes autônomos existentes tenham profiles
INSERT INTO public.profiles (user_id, name, email, role, birth_date, username)
SELECT 
  pa.user_id,
  pa.nome,
  (SELECT email FROM auth.users WHERE id = pa.user_id),
  'paciente_autonomo'::public.user_role,
  pa.nascimento,
  pa.nome_usuario
FROM public.pacientes_autonomos pa
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = pa.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- Garantir que todos os pacientes autônomos tenham care_contexts self
INSERT INTO public.care_contexts (owner_user_id, type)
SELECT pa.user_id, 'self'::text
FROM public.pacientes_autonomos pa
WHERE NOT EXISTS (
  SELECT 1 FROM public.care_contexts cc 
  WHERE cc.owner_user_id = pa.user_id AND cc.type = 'self'
)
ON CONFLICT DO NOTHING;

-- Criar trigger para automaticamente criar profile quando paciente autônomo é criado
CREATE OR REPLACE FUNCTION public.auto_create_profile_autonomo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role, birth_date, username)
  VALUES (
    NEW.user_id,
    NEW.nome,
    (SELECT email FROM auth.users WHERE id = NEW.user_id),
    'paciente_autonomo'::public.user_role,
    NEW.nascimento,
    NEW.nome_usuario
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    birth_date = EXCLUDED.birth_date,
    username = EXCLUDED.username;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_create_profile_autonomo
AFTER INSERT ON public.pacientes_autonomos
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_profile_autonomo();

-- Criar trigger para automaticamente criar care_context self para pacientes autônomos
CREATE OR REPLACE FUNCTION public.auto_create_context_autonomo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'paciente_autonomo' THEN
    INSERT INTO public.care_contexts (owner_user_id, type)
    VALUES (NEW.user_id, 'self'::text)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_create_context_autonomo
AFTER INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.role = 'paciente_autonomo')
EXECUTE FUNCTION public.auto_create_context_autonomo();