-- Atualiza a função can_access_context para incluir cuidadores
CREATE OR REPLACE FUNCTION public.can_access_context(context_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM care_contexts c
    WHERE c.id = context_uuid
      AND (
        -- O usuário é o owner do contexto
        c.owner_user_id = auth.uid()
        OR
        -- O usuário é um cuidador do dependente deste contexto
        EXISTS (
          SELECT 1
          FROM cuidadores cu
          WHERE cu.dependente_id = c.dependente_id
            AND cu.user_id = auth.uid()
        )
        OR
        -- O usuário é o próprio dependente
        EXISTS (
          SELECT 1
          FROM pacientes_dependentes pd
          WHERE pd.id = c.dependente_id
            AND pd.user_id = auth.uid()
        )
      )
  );
$$;