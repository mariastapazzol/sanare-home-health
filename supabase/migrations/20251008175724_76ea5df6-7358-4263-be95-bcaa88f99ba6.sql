-- Create storage bucket for medication images
INSERT INTO storage.buckets (id, name, public)
VALUES ('medicamentos', 'medicamentos', true);

-- Create RLS policies for medication images
CREATE POLICY "Users can upload their own medication images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'medicamentos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own medication images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'medicamentos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own medication images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'medicamentos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own medication images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'medicamentos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);