-- Sprint 8: Booking system foundation

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  service_type text not null check (service_type in ('daycare', 'boarding')),
  start_date date not null,
  end_date date not null,
  transport_required boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_date_range_check check (end_date >= start_date)
);

create index if not exists bookings_facility_id_idx on public.bookings (facility_id);
create index if not exists bookings_dog_id_idx on public.bookings (dog_id);
create index if not exists bookings_start_date_idx on public.bookings (facility_id, start_date);
create index if not exists bookings_status_idx on public.bookings (facility_id, status);

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row
  execute function public.set_updated_at();

alter table public.bookings enable row level security;

drop policy if exists "bookings_select_facility_members" on public.bookings;
create policy "bookings_select_facility_members"
  on public.bookings
  for select
  using (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "bookings_insert_facility_members" on public.bookings;
create policy "bookings_insert_facility_members"
  on public.bookings
  for insert
  with check (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "bookings_update_facility_members" on public.bookings;
create policy "bookings_update_facility_members"
  on public.bookings
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
