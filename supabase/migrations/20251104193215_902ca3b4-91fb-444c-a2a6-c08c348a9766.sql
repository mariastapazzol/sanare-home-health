-- Function to create profile and initial data for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_birth_date date;
  user_name text;
  user_email text;
  unique_username text;
BEGIN
  -- Extract metadata from auth.users
  user_birth_date := (NEW.raw_user_meta_data->>'birth_date')::date;
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  user_email := NEW.email;
  
  -- Generate unique username (use email prefix + user_id suffix for uniqueness)
  unique_username := LOWER(split_part(NEW.email, '@', 1) || '_' || substring(NEW.id::text, 1, 8));

  -- Create profile
  INSERT INTO public.profiles (user_id, name, email, birth_date)
  VALUES (NEW.id, user_name, user_email, COALESCE(user_birth_date, CURRENT_DATE))
  ON CONFLICT (user_id) DO NOTHING;

  -- Create default user role as paciente_autonomo
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'paciente_autonomo')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create pacientes_autonomos record with unique username
  INSERT INTO public.pacientes_autonomos (user_id, nome, nome_usuario, nascimento)
  VALUES (
    NEW.id,
    user_name,
    unique_username,
    COALESCE(user_birth_date, CURRENT_DATE)
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create self care context
  INSERT INTO public.care_contexts (nome, tipo, owner_user_id)
  VALUES ('Meu Cuidado', 'self', NEW.id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill data for existing users without profiles
DO $$
DECLARE
  user_record RECORD;
  user_birth_date date;
  user_name text;
  unique_username text;
  counter int := 0;
BEGIN
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM public.profiles)
  LOOP
    -- Extract metadata
    user_birth_date := (user_record.raw_user_meta_data->>'birth_date')::date;
    user_name := COALESCE(user_record.raw_user_meta_data->>'name', split_part(user_record.email, '@', 1));
    
    -- Generate unique username
    unique_username := LOWER(split_part(user_record.email, '@', 1) || '_' || substring(user_record.id::text, 1, 8));
    
    -- Create profile
    INSERT INTO public.profiles (user_id, name, email, birth_date)
    VALUES (user_record.id, user_name, user_record.email, COALESCE(user_birth_date, CURRENT_DATE))
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_record.id, 'paciente_autonomo')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Only create pacientes_autonomos if user doesn't exist in any patient/caregiver table
    IF NOT EXISTS (
      SELECT 1 FROM pacientes_autonomos WHERE user_id = user_record.id
      UNION
      SELECT 1 FROM cuidadores WHERE user_id = user_record.id
      UNION
      SELECT 1 FROM pacientes_dependentes WHERE user_id = user_record.id
    ) THEN
      INSERT INTO public.pacientes_autonomos (user_id, nome, nome_usuario, nascimento)
      VALUES (
        user_record.id,
        user_name,
        unique_username,
        COALESCE(user_birth_date, CURRENT_DATE)
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    -- Create self care context if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM care_contexts 
      WHERE owner_user_id = user_record.id AND tipo = 'self'
    ) THEN
      INSERT INTO public.care_contexts (nome, tipo, owner_user_id)
      VALUES ('Meu Cuidado', 'self', user_record.id);
    END IF;
    
    counter := counter + 1;
  END LOOP;
  
  RAISE NOTICE 'Backfilled % users', counter;
END $$;