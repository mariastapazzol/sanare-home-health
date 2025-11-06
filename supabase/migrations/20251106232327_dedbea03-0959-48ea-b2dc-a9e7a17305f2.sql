-- Create custom moods table
CREATE TABLE public.custom_moods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  context_id UUID,
  emoji TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_moods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view custom moods in their contexts"
ON public.custom_moods
FOR SELECT
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can insert custom moods in their contexts"
ON public.custom_moods
FOR INSERT
WITH CHECK (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can update custom moods in their contexts"
ON public.custom_moods
FOR UPDATE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

CREATE POLICY "Users can delete custom moods in their contexts"
ON public.custom_moods
FOR DELETE
USING (can_access_context(context_id) OR (user_id = auth.uid() AND context_id IS NULL));

-- Create index for better performance
CREATE INDEX idx_custom_moods_user_id ON public.custom_moods(user_id);
CREATE INDEX idx_custom_moods_context_id ON public.custom_moods(context_id);