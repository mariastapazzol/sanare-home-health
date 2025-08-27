-- Fix security definer functions by setting proper search_path
CREATE OR REPLACE FUNCTION public.check_unique_username()
RETURNS TRIGGER AS $$
BEGIN
  -- Check in pacientes_autonomos
  IF EXISTS (SELECT 1 FROM public.pacientes_autonomos WHERE nome_usuario = NEW.nome_usuario) THEN
    RAISE EXCEPTION 'Nome de usuário já existe';
  END IF;
  
  -- Check in cuidadores
  IF EXISTS (SELECT 1 FROM public.cuidadores WHERE nome_usuario = NEW.nome_usuario) THEN
    RAISE EXCEPTION 'Nome de usuário já existe';
  END IF;
  
  -- Check in pacientes_dependentes
  IF EXISTS (SELECT 1 FROM public.pacientes_dependentes WHERE nome_usuario = NEW.nome_usuario) THEN
    RAISE EXCEPTION 'Nome de usuário já existe';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;