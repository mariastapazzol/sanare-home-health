-- Fix cuidador_id foreign key: handle existing constraints

-- 1) Drop all existing policies on pacientes_dependentes
drop policy if exists "Caregivers can create dependent patients" on public.pacientes_dependentes;
drop policy if exists "Caregivers can delete their dependent patients" on public.pacientes_dependentes;
drop policy if exists "Caregivers can update their dependent patients" on public.pacientes_dependentes;
drop policy if exists "Caregivers can view their dependent patients" on public.pacientes_dependentes;
drop policy if exists "Users can create their own dependent patient record" on public.pacientes_dependentes;
drop policy if exists "Users can delete their own dependent patient record" on public.pacientes_dependentes;
drop policy if exists "Users can update their own dependent patient record" on public.pacientes_dependentes;
drop policy if exists "Users can view their own dependent patient record" on public.pacientes_dependentes;
drop policy if exists dep_by_caregiver_all on public.pacientes_dependentes;
drop policy if exists dep_self_select on public.pacientes_dependentes;
drop policy if exists dep_self_update on public.pacientes_dependentes;

-- 2) Migrate existing data: convert cuidador_id from cuidadores.id to user_id (if not already migrated)
update public.pacientes_dependentes d
set cuidador_id = c.user_id
from public.cuidadores c
where d.cuidador_id = c.id
  and exists (select 1 from public.cuidadores where id = d.cuidador_id);

-- 3) Drop all existing FK constraints on cuidador_id
alter table public.pacientes_dependentes
  drop constraint if exists pacientes_dependentes_cuidador_id_fkey,
  drop constraint if exists pacientes_dependentes_cuidador_fk;

-- 4) Ensure uuid type
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_name = 'pacientes_dependentes' 
      and column_name = 'cuidador_id' 
      and data_type != 'uuid'
  ) then
    alter table public.pacientes_dependentes
      alter column cuidador_id type uuid using cuidador_id::uuid;
  end if;
end$$;

-- 5) Create new FK pointing to auth.users
alter table public.pacientes_dependentes
  add constraint pacientes_dependentes_cuidador_fk
  foreign key (cuidador_id) references auth.users(id) on delete cascade;

-- 6) Add index for performance
create index if not exists idx_pacientes_dep_cuidador on public.pacientes_dependentes(cuidador_id);

-- 7) Recreate policies using auth.uid() for cuidador_id
create policy dep_by_caregiver_all on public.pacientes_dependentes
  for all using (cuidador_id = auth.uid())
  with check (cuidador_id = auth.uid());

create policy dep_self_select on public.pacientes_dependentes
  for select using (user_id = auth.uid());

create policy dep_self_update on public.pacientes_dependentes
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());