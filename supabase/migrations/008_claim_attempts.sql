-- Sprint 12.1: Rate limiting for invite-code claim endpoint

create table if not exists public.claim_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  user_id uuid references auth.users(id) on delete set null,
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists claim_attempts_ip_attempted_at_idx
  on public.claim_attempts (ip_address, attempted_at desc);

create index if not exists claim_attempts_user_attempted_at_idx
  on public.claim_attempts (user_id, attempted_at desc)
  where user_id is not null;

alter table public.claim_attempts enable row level security;
