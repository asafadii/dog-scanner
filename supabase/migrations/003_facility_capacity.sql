-- Sprint 9: Facility capacity management

create table if not exists public.facility_capacity (
  facility_id uuid primary key references public.facilities(id) on delete cascade,
  daycare_capacity integer not null default 20 check (daycare_capacity > 0),
  boarding_capacity integer not null default 10 check (boarding_capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists facility_capacity_set_updated_at on public.facility_capacity;
create trigger facility_capacity_set_updated_at
  before update on public.facility_capacity
  for each row
  execute function public.set_updated_at();

alter table public.facility_capacity enable row level security;

drop policy if exists "facility_capacity_select_facility_members" on public.facility_capacity;
create policy "facility_capacity_select_facility_members"
  on public.facility_capacity
  for select
  using (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "facility_capacity_insert_facility_members" on public.facility_capacity;
create policy "facility_capacity_insert_facility_members"
  on public.facility_capacity
  for insert
  with check (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "facility_capacity_update_facility_members" on public.facility_capacity;
create policy "facility_capacity_update_facility_members"
  on public.facility_capacity
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
