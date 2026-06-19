-- Sprint 10: Kennels & placement assignment

create table if not exists public.kennels (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  name text not null,
  capacity integer not null default 1 check (capacity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, name)
);

create index if not exists kennels_facility_id_idx on public.kennels (facility_id);

drop trigger if exists kennels_set_updated_at on public.kennels;
create trigger kennels_set_updated_at
  before update on public.kennels
  for each row
  execute function public.set_updated_at();

alter table public.kennels enable row level security;

drop policy if exists "kennels_select_facility_members" on public.kennels;
create policy "kennels_select_facility_members"
  on public.kennels
  for select
  using (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "kennels_insert_facility_members" on public.kennels;
create policy "kennels_insert_facility_members"
  on public.kennels
  for insert
  with check (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "kennels_update_facility_members" on public.kennels;
create policy "kennels_update_facility_members"
  on public.kennels
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

create table if not exists public.kennel_assignments (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.dog_checkins(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  location_type text not null check (
    location_type in ('kennel', 'daycare', 'grooming', 'isolation')
  ),
  kennel_id uuid references public.kennels(id) on delete set null,
  assigned_at timestamptz not null default now(),
  assigned_by uuid not null references public.profiles(id),
  notes text,
  check (
    (location_type = 'kennel' and kennel_id is not null)
    or (location_type <> 'kennel' and kennel_id is null)
  )
);

create index if not exists kennel_assignments_checkin_id_idx
  on public.kennel_assignments (checkin_id, assigned_at desc);

create index if not exists kennel_assignments_facility_id_idx
  on public.kennel_assignments (facility_id);

alter table public.kennel_assignments enable row level security;

drop policy if exists "kennel_assignments_select_facility_members" on public.kennel_assignments;
create policy "kennel_assignments_select_facility_members"
  on public.kennel_assignments
  for select
  using (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "kennel_assignments_insert_facility_members" on public.kennel_assignments;
create policy "kennel_assignments_insert_facility_members"
  on public.kennel_assignments
  for insert
  with check (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );
