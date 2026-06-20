-- Sprint 14: QR check-in tokens

create table if not exists public.checkin_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  created_by_client_account_id uuid references public.client_accounts(id) on delete set null,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists checkin_tokens_token_idx
  on public.checkin_tokens (token);

create index if not exists checkin_tokens_booking_id_idx
  on public.checkin_tokens (booking_id);

alter table public.checkin_tokens enable row level security;
