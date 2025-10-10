-- Adicionar coluna context_id às tabelas medicamentos e lembretes
ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES care_contexts(id);
ALTER TABLE lembretes ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES care_contexts(id);

-- Migrar dados existentes de medicamentos
-- Para medicamentos com dependente_id, encontrar o contexto dependent correspondente
UPDATE medicamentos m
SET context_id = cc.id
FROM care_contexts cc
INNER JOIN pacientes_dependentes pd ON pd.user_id = cc.owner_user_id
WHERE m.dependente_id = pd.id 
  AND cc.type = 'dependent'
  AND m.context_id IS NULL;

-- Para medicamentos sem dependente_id (do próprio usuário), usar contexto self
UPDATE medicamentos m
SET context_id = cc.id
FROM care_contexts cc
WHERE m.dependente_id IS NULL
  AND m.user_id = cc.owner_user_id
  AND cc.type = 'self'
  AND m.context_id IS NULL;

-- Migrar dados existentes de lembretes
-- Para lembretes com dependente_id, encontrar o contexto dependent correspondente
UPDATE lembretes l
SET context_id = cc.id
FROM care_contexts cc
INNER JOIN pacientes_dependentes pd ON pd.user_id = cc.owner_user_id
WHERE l.dependente_id = pd.id 
  AND cc.type = 'dependent'
  AND l.context_id IS NULL;

-- Para lembretes sem dependente_id (do próprio usuário), usar contexto self
UPDATE lembretes l
SET context_id = cc.id
FROM care_contexts cc
WHERE l.dependente_id IS NULL
  AND l.user_id = cc.owner_user_id
  AND cc.type = 'self'
  AND l.context_id IS NULL;

-- Tornar context_id obrigatório após migração dos dados
ALTER TABLE medicamentos ALTER COLUMN context_id SET NOT NULL;
ALTER TABLE lembretes ALTER COLUMN context_id SET NOT NULL;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_medicamentos_context_id ON medicamentos(context_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_context_id ON lembretes(context_id);

-- Atualizar RLS policies para medicamentos
DROP POLICY IF EXISTS meds_select_self ON medicamentos;
DROP POLICY IF EXISTS meds_insert_self ON medicamentos;
DROP POLICY IF EXISTS meds_update_self ON medicamentos;
DROP POLICY IF EXISTS meds_delete_self ON medicamentos;

CREATE POLICY "Users can view medicamentos in their contexts"
ON medicamentos FOR SELECT
USING (
  context_id IN (
    SELECT id FROM care_contexts
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert medicamentos in their contexts"
ON medicamentos FOR INSERT
WITH CHECK (
  context_id IN (
    SELECT id FROM care_contexts
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update medicamentos in their contexts"
ON medicamentos FOR UPDATE
USING (
  context_id IN (
    SELECT id FROM care_contexts
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete medicamentos in their contexts"
ON medicamentos FOR DELETE
USING (
  context_id IN (
    SELECT id FROM care_contexts
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

-- Atualizar RLS policies para lembretes
DROP POLICY IF EXISTS lemb_select_self ON lembretes;
DROP POLICY IF EXISTS lemb_insert_self ON lembretes;
DROP POLICY IF EXISTS lemb_update_self ON lembretes;
DROP POLICY IF EXISTS lemb_delete_self ON lembretes;

CREATE POLICY "Users can view lembretes in their contexts"
ON lembretes FOR SELECT
USING (
  context_id IN (
    SELECT id FROM care_contexts
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert lembretes in their contexts"
ON lembretes FOR INSERT
WITH CHECK (
  context_id IN (
    SELECT id FROM care_contexts
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update lembretes in their contexts"
ON lembretes FOR UPDATE
USING (
  context_id IN (
    SELECT id FROM care_contexts
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete lembretes in their contexts"
ON lembretes FOR DELETE
USING (
  context_id IN (
    SELECT id FROM care_contexts
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);