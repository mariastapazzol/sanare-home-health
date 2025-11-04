-- Fix check_unique_username function to exclude the current record from duplicate check
CREATE OR REPLACE FUNCTION public.check_unique_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only check if nome_usuario is being changed or it's an INSERT
  IF (TG_OP = 'INSERT') OR (OLD.nome_usuario IS DISTINCT FROM NEW.nome_usuario) THEN
    
    -- Check in pacientes_autonomos (exclude current record if updating)
    IF EXISTS (
      SELECT 1 FROM public.pacientes_autonomos 
      WHERE nome_usuario = NEW.nome_usuario 
      AND (TG_OP = 'INSERT' OR id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid))
    ) THEN
      RAISE EXCEPTION 'Nome de usuário já existe';
    END IF;
    
    -- Check in cuidadores (exclude current record if updating)
    IF EXISTS (
      SELECT 1 FROM public.cuidadores 
      WHERE nome_usuario = NEW.nome_usuario 
      AND (TG_OP = 'INSERT' OR id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid))
    ) THEN
      RAISE EXCEPTION 'Nome de usuário já existe';
    END IF;
    
    -- Check in pacientes_dependentes (exclude current record if updating)
    IF EXISTS (
      SELECT 1 FROM public.pacientes_dependentes 
      WHERE nome_usuario = NEW.nome_usuario 
      AND (TG_OP = 'INSERT' OR id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid))
    ) THEN
      RAISE EXCEPTION 'Nome de usuário já existe';
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;