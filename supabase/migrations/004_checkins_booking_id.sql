-- Sprint 9.5: Link check-ins to bookings

alter table public.dog_checkins
  add column if not exists booking_id uuid references public.bookings(id) on delete set null;

create index if not exists dog_checkins_booking_id_idx on public.dog_checkins (booking_id);
