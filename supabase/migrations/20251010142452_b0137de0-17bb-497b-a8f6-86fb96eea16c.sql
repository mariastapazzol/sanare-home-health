-- Add prescription-related columns to medicamentos table
ALTER TABLE public.medicamentos 
ADD COLUMN IF NOT EXISTS requires_prescription boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS prescription_status text NOT NULL DEFAULT 'missing',
ADD COLUMN IF NOT EXISTS prescription_image_url text;

-- Add check constraint for prescription_status enum
ALTER TABLE public.medicamentos 
DROP CONSTRAINT IF EXISTS check_prescription_status;

ALTER TABLE public.medicamentos 
ADD CONSTRAINT check_prescription_status 
CHECK (prescription_status IN ('valid', 'missing', 'used'));

-- Create storage bucket for prescriptions
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescricoes', 'prescricoes', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for prescricoes bucket
CREATE POLICY "Users can view their own prescriptions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescricoes' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can upload their own prescriptions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prescricoes' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can update their own prescriptions"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prescricoes' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own prescriptions"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prescricoes' AND
  auth.uid()::text = (storage.foldername(name))[2]
);