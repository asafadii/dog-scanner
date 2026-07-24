-- Billing write-block: helper + RLS on bookings/dogs/clients inserts (and dogs/clients updates)

-- Returns true if the facility's write access should be blocked
-- (past the 7-day grace period, or subscription canceled)
create or replace function public.is_facility_write_blocked(
  target_facility_id uuid
) returns boolean
language sql
stable
as $$
  select coalesce(
    (
      select
        case
          when subscription_status = 'canceled' then true
          when subscription_status = 'past_due'
            and past_due_since is not null
            and past_due_since < (now() - interval '7 days')
          then true
          else false
        end
      from public.facilities
      where id = target_facility_id
    ),
    false
  );
$$;

-- Bookings: block creating NEW bookings when blocked (status
-- transitions/updates stay open — enforced at API layer instead)
drop policy if exists "bookings_insert_facility_members" on public.bookings;
create policy "bookings_insert_facility_members"
  on public.bookings
  for insert
  with check (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
    and not public.is_facility_write_blocked(facility_id)
  );

-- Dogs: block creating AND editing profiles when blocked
drop policy if exists "dogs_insert_facility_members" on public.dogs;
create policy "dogs_insert_facility_members"
  on public.dogs
  for insert
  with check (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
    and not public.is_facility_write_blocked(facility_id)
  );

drop policy if exists "dogs_update_facility_members" on public.dogs;
create policy "dogs_update_facility_members"
  on public.dogs
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
    and not public.is_facility_write_blocked(facility_id)
  );

-- Clients: same pattern as dogs
drop policy if exists "clients_insert_facility_members" on public.clients;
create policy "clients_insert_facility_members"
  on public.clients
  for insert
  with check (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
    and not public.is_facility_write_blocked(facility_id)
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
    and not public.is_facility_write_blocked(facility_id)
  );
