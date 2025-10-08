-- Create tasks table
CREATE TABLE public.tasks (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  "order" int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create task_status table for tracking daily completion
CREATE TABLE public.task_status (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL,
  task_id bigint NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  day date NOT NULL,
  checked boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id, day)
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on task_status
ALTER TABLE public.task_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks (public read for active tasks)
CREATE POLICY "Anyone can view active tasks"
ON public.tasks
FOR SELECT
USING (active = true);

CREATE POLICY "Authenticated users can view all tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for task_status (user-specific)
CREATE POLICY "Users can view their own task status"
ON public.task_status
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task status"
ON public.task_status
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task status"
ON public.task_status
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task status"
ON public.task_status
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create RPC function to get server time in São Paulo timezone
CREATE OR REPLACE FUNCTION public.server_time_sampa()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT now() AT TIME ZONE 'America/Sao_Paulo';
$$;

-- Create trigger to update updated_at on task_status
CREATE TRIGGER update_task_status_updated_at
BEFORE UPDATE ON public.task_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default tasks
INSERT INTO public.tasks (title, "order", active) VALUES
  ('Tomar medicação da manhã', 1, true),
  ('Medir pressão arterial', 2, true),
  ('Tomar medicação da tarde', 3, true),
  ('Verificar sinais vitais', 4, true),
  ('Tomar medicação da noite', 5, true);