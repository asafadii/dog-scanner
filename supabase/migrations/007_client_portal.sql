-- Sprint 12: Client portal identity and account linking

alter table public.clients
  add column if not exists invite_code text unique;

create table if not exists public.client_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists client_accounts_set_updated_at on public.client_accounts;
create trigger client_accounts_set_updated_at
  before update on public.client_accounts
  for each row
  execute function public.set_updated_at();

alter table public.client_accounts enable row level security;

drop policy if exists "client_accounts_select_own" on public.client_accounts;
create policy "client_accounts_select_own"
  on public.client_accounts
  for select
  using (id = auth.uid());

drop policy if exists "client_accounts_update_own" on public.client_accounts;
create policy "client_accounts_update_own"
  on public.client_accounts
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create table if not exists public.client_account_links (
  id uuid primary key default gen_random_uuid(),
  client_account_id uuid not null references public.client_accounts(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_account_id, client_id)
);

create index if not exists client_account_links_client_account_id_idx
  on public.client_account_links (client_account_id);

create index if not exists client_account_links_client_id_idx
  on public.client_account_links (client_id);

create index if not exists client_account_links_facility_id_idx
  on public.client_account_links (facility_id);

alter table public.client_account_links enable row level security;

drop policy if exists "client_account_links_select_own" on public.client_account_links;
create policy "client_account_links_select_own"
  on public.client_account_links
  for select
  using (client_account_id = auth.uid());

drop policy if exists "client_account_links_select_facility_staff" on public.client_account_links;
create policy "client_account_links_select_facility_staff"
  on public.client_account_links
  for select
  using (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "clients_select_linked_client_accounts" on public.clients;
create policy "clients_select_linked_client_accounts"
  on public.clients
  for select
  using (
    id in (
      select client_id
      from public.client_account_links
      where client_account_id = auth.uid()
    )
  );
