-- Drop existing RLS policies for checklist_daily_status
DROP POLICY IF EXISTS "chkdaily_select_self" ON public.checklist_daily_status;
DROP POLICY IF EXISTS "chkdaily_insert_self" ON public.checklist_daily_status;
DROP POLICY IF EXISTS "chkdaily_update_self" ON public.checklist_daily_status;
DROP POLICY IF EXISTS "chkdaily_delete_self" ON public.checklist_daily_status;

-- Create new RLS policies that use context_id to allow caregiver access
CREATE POLICY "Users can view checklist status in their contexts"
ON public.checklist_daily_status
FOR SELECT
USING (can_access_context(context_id));

CREATE POLICY "Users can insert checklist status in their contexts"
ON public.checklist_daily_status
FOR INSERT
WITH CHECK (can_access_context(context_id));

CREATE POLICY "Users can update checklist status in their contexts"
ON public.checklist_daily_status
FOR UPDATE
USING (can_access_context(context_id));

CREATE POLICY "Users can delete checklist status in their contexts"
ON public.checklist_daily_status
FOR DELETE
USING (can_access_context(context_id));