-- Sprint 7: Client / owner management

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  emergency_contact text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_facility_id_idx on public.clients (facility_id);
create index if not exists clients_name_idx on public.clients (facility_id, name);

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dogs'
      and column_name = 'client_id'
  ) then
    alter table public.dogs
      add column client_id uuid references public.clients(id) on delete set null;
  end if;
end $$;

create index if not exists dogs_client_id_idx on public.dogs (client_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

alter table public.clients enable row level security;

drop policy if exists "clients_select_facility_members" on public.clients;
create policy "clients_select_facility_members"
  on public.clients
  for select
  using (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "clients_insert_facility_members" on public.clients;
create policy "clients_insert_facility_members"
  on public.clients
  for insert
  with check (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "clients_update_facility_members" on public.clients;
create policy "clients_update_facility_members"
  on public.clients
  for update
  using (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  )
  with check (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );
