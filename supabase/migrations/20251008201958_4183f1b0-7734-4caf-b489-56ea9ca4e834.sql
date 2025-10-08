-- 1) CUIDADOR: remover dependência de username
do $$
begin
  if exists (select 1 from pg_indexes where indexname = 'ux_cuidadores_username') then
    drop index ux_cuidadores_username;
  end if;
end$$;

alter table public.cuidadores
  alter column nome_usuario drop not null;

-- 2) DEPENDENTE: username passa a ser único GLOBAL (login por username)
do $$
begin
  -- drop do índice antigo por (cuidador_id, nome_usuario)
  if exists (select 1 from pg_indexes where indexname = 'ux_dep_cuidador_username') then
    drop index ux_dep_cuidador_username;
  end if;
end$$;

-- unicidade global (case-insensitive) para evitar ambiguidades no login
create unique index if not exists ux_dep_username_global
  on public.pacientes_dependentes (lower(nome_usuario));

-- validação simples de formato (mín 3; letras, números, ., _)
alter table public.pacientes_dependentes
  add constraint dep_username_format_chk
  check (nome_usuario ~ '^[A-Za-z0-9._]{3,}$');

-- garantir que 'nascimento' exista para cuidadores
alter table public.cuidadores
  add column if not exists nascimento date;