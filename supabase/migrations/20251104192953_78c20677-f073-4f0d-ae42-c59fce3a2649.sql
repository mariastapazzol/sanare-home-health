-- Remove the public SELECT policy from tasks table that allows unauthenticated access
DROP POLICY IF EXISTS "Anyone can view active tasks" ON public.tasks;

-- Keep only the authenticated users policy
-- The "Authenticated users can view all tasks" policy already exists and is sufficient