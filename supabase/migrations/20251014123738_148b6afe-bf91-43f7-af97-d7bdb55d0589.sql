-- Policies para o bucket prescricoes
-- Permite que usuários autenticados façam upload de prescrições em seus próprios contextos
CREATE POLICY "Authenticated users can upload prescriptions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescricoes' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

-- Permite que usuários autenticados visualizem prescrições de seus contextos
CREATE POLICY "Authenticated users can view prescriptions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescricoes'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

-- Permite que usuários autenticados atualizem prescrições de seus contextos
CREATE POLICY "Authenticated users can update prescriptions"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prescricoes'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);

-- Permite que usuários autenticados excluam prescrições de seus contextos
CREATE POLICY "Authenticated users can delete prescriptions"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescricoes'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM public.care_contexts 
    WHERE owner_user_id = auth.uid() OR caregiver_user_id = auth.uid()
  )
);