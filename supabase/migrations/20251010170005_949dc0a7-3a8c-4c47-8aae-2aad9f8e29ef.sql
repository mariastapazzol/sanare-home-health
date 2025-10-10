-- Correção RLS - Políticas simplificadas baseadas em user_id

-- Função auxiliar para set updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ========================================
-- MEDICAMENTOS
-- ========================================
alter table public.medicamentos enable row level security;

-- Remover políticas antigas
drop policy if exists "Users can create medicamentos" on public.medicamentos;
drop policy if exists "Users can delete medicamentos" on public.medicamentos;
drop policy if exists "Users can update medicamentos" on public.medicamentos;
drop policy if exists "Users can view medicamentos" on public.medicamentos;

-- Novas políticas simples
create policy "meds_select_self" on public.medicamentos
  for select using (user_id = auth.uid());
  
create policy "meds_insert_self" on public.medicamentos
  for insert with check (user_id = auth.uid());
  
create policy "meds_update_self" on public.medicamentos
  for update using (user_id = auth.uid());
  
create policy "meds_delete_self" on public.medicamentos
  for delete using (user_id = auth.uid());

-- Garantir que dependente_id é nullable
alter table public.medicamentos alter column dependente_id drop not null;

-- Trigger de updated_at
drop trigger if exists trg_meds_upd on public.medicamentos;
create trigger trg_meds_upd before update on public.medicamentos
  for each row execute function public.set_updated_at();

-- ========================================
-- LEMBRETES
-- ========================================
alter table public.lembretes enable row level security;

-- Remover políticas antigas
drop policy if exists "Users can create lembretes" on public.lembretes;
drop policy if exists "Users can delete lembretes" on public.lembretes;
drop policy if exists "Users can update lembretes" on public.lembretes;
drop policy if exists "Users can view lembretes" on public.lembretes;

-- Novas políticas simples
create policy "lemb_select_self" on public.lembretes
  for select using (user_id = auth.uid());
  
create policy "lemb_insert_self" on public.lembretes
  for insert with check (user_id = auth.uid());
  
create policy "lemb_update_self" on public.lembretes
  for update using (user_id = auth.uid());
  
create policy "lemb_delete_self" on public.lembretes
  for delete using (user_id = auth.uid());

-- Garantir que dependente_id é nullable
alter table public.lembretes alter column dependente_id drop not null;

-- Trigger de updated_at
drop trigger if exists trg_lemb_upd on public.lembretes;
create trigger trg_lemb_upd before update on public.lembretes
  for each row execute function public.set_updated_at();

-- ========================================
-- TASK_STATUS (checklist principal)
-- ========================================
alter table public.task_status enable row level security;

-- Remover políticas antigas
drop policy if exists "Users can delete their task_status" on public.task_status;
drop policy if exists "Users can insert their task_status" on public.task_status;
drop policy if exists "Users can update their task_status" on public.task_status;
drop policy if exists "Users can view their task_status" on public.task_status;

-- Novas políticas simples
create policy "task_select_self" on public.task_status
  for select using (user_id = auth.uid());
  
create policy "task_insert_self" on public.task_status
  for insert with check (user_id = auth.uid());
  
create policy "task_update_self" on public.task_status
  for update using (user_id = auth.uid());
  
create policy "task_delete_self" on public.task_status
  for delete using (user_id = auth.uid());

-- Trigger de updated_at
drop trigger if exists trg_task_upd on public.task_status;
create trigger trg_task_upd before update on public.task_status
  for each row execute function public.set_updated_at();

-- ========================================
-- CHECKLIST_DAILY_STATUS
-- ========================================
alter table public.checklist_daily_status enable row level security;

-- Remover políticas antigas
drop policy if exists "Users can delete checklist in their contexts" on public.checklist_daily_status;
drop policy if exists "Users can insert checklist in their contexts" on public.checklist_daily_status;
drop policy if exists "Users can update checklist in their contexts" on public.checklist_daily_status;
drop policy if exists "Users can view checklist in their contexts" on public.checklist_daily_status;

-- Novas políticas simples
create policy "chkdaily_select_self" on public.checklist_daily_status
  for select using (user_id = auth.uid());
  
create policy "chkdaily_insert_self" on public.checklist_daily_status
  for insert with check (user_id = auth.uid());
  
create policy "chkdaily_update_self" on public.checklist_daily_status
  for update using (user_id = auth.uid());
  
create policy "chkdaily_delete_self" on public.checklist_daily_status
  for delete using (user_id = auth.uid());

-- Trigger de updated_at
drop trigger if exists trg_chkdaily_upd on public.checklist_daily_status;
create trigger trg_chkdaily_upd before update on public.checklist_daily_status
  for each row execute function public.set_updated_at();