-- Sprint 11: Pricing, payments, and reports

create table if not exists public.pricing_rules (
  facility_id uuid primary key references public.facilities(id) on delete cascade,
  daycare_rate numeric(10,2) not null default 25.00 check (daycare_rate >= 0),
  boarding_rate numeric(10,2) not null default 40.00 check (boarding_rate >= 0),
  transport_fee numeric(10,2) not null default 10.00 check (transport_fee >= 0),
  food_fee numeric(10,2) not null default 5.00 check (food_fee >= 0),
  seasonal_surcharge_enabled boolean not null default false,
  seasonal_surcharge_percent numeric(5,2) not null default 0 check (seasonal_surcharge_percent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists pricing_rules_set_updated_at on public.pricing_rules;
create trigger pricing_rules_set_updated_at
  before update on public.pricing_rules
  for each row
  execute function public.set_updated_at();

alter table public.pricing_rules enable row level security;

drop policy if exists "pricing_rules_select_facility_members" on public.pricing_rules;
create policy "pricing_rules_select_facility_members"
  on public.pricing_rules
  for select
  using (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "pricing_rules_insert_facility_members" on public.pricing_rules;
create policy "pricing_rules_insert_facility_members"
  on public.pricing_rules
  for insert
  with check (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "pricing_rules_update_facility_members" on public.pricing_rules;
create policy "pricing_rules_update_facility_members"
  on public.pricing_rules
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

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.dog_checkins(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  service_type text not null check (service_type in ('daycare', 'boarding')),
  units integer not null check (units > 0),
  rate numeric(10,2) not null check (rate >= 0),
  transport_fee numeric(10,2) not null default 0 check (transport_fee >= 0),
  food_fee numeric(10,2) not null default 0 check (food_fee >= 0),
  surcharge_percent numeric(5,2) not null default 0 check (surcharge_percent >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  total numeric(10,2) not null check (total >= 0),
  payment_method text not null check (payment_method in ('cash', 'card', 'transfer')),
  paid_at timestamptz not null default now(),
  recorded_by uuid not null references public.profiles(id),
  unique (checkin_id)
);

create index if not exists payments_facility_id_paid_at_idx
  on public.payments (facility_id, paid_at desc);

create index if not exists payments_booking_id_idx
  on public.payments (booking_id);

alter table public.payments enable row level security;

drop policy if exists "payments_select_facility_members" on public.payments;
create policy "payments_select_facility_members"
  on public.payments
  for select
  using (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "payments_insert_facility_members" on public.payments;
create policy "payments_insert_facility_members"
  on public.payments
  for insert
  with check (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

create table if not exists public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  food_addon boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists booking_items_booking_id_idx
  on public.booking_items (booking_id);

alter table public.booking_items enable row level security;

drop policy if exists "booking_items_select_facility_members" on public.booking_items;
create policy "booking_items_select_facility_members"
  on public.booking_items
  for select
  using (
    booking_id in (
      select b.id
      from public.bookings b
      where b.facility_id in (
        select facility_id from public.profiles where id = auth.uid()
      )
    )
  );

drop policy if exists "booking_items_insert_facility_members" on public.booking_items;
create policy "booking_items_insert_facility_members"
  on public.booking_items
  for insert
  with check (
    booking_id in (
      select b.id
      from public.bookings b
      where b.facility_id in (
        select facility_id from public.profiles where id = auth.uid()
      )
    )
  );

drop policy if exists "booking_items_update_facility_members" on public.booking_items;
create policy "booking_items_update_facility_members"
  on public.booking_items
  for update
  using (
    booking_id in (
      select b.id
      from public.bookings b
      where b.facility_id in (
        select facility_id from public.profiles where id = auth.uid()
      )
    )
  )
  with check (
    booking_id in (
      select b.id
      from public.bookings b
      where b.facility_id in (
        select facility_id from public.profiles where id = auth.uid()
      )
    )
  );
