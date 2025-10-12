-- Adicionar valores ao enum user_role se não existirem
DO $$
BEGIN
  -- Adicionar 'cuidador' se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cuidador' AND enumtypid = 'user_role'::regtype) THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''cuidador''';
  END IF;
END $$;

DO $$
BEGIN
  -- Adicionar 'paciente_autonomo' se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'paciente_autonomo' AND enumtypid = 'user_role'::regtype) THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''paciente_autonomo''';
  END IF;
END $$;

DO $$
BEGIN
  -- Adicionar 'paciente_dependente' se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'paciente_dependente' AND enumtypid = 'user_role'::regtype) THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''paciente_dependente''';
  END IF;
END $$;