-- Add missing values to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cuidador';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'paciente_dependente';