-- Sprint 13: Portal dog documents and client read access for dogs/bookings

create table if not exists public.dog_documents (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  document_type text not null check (document_type in ('vaccination', 'pedigree', 'other')),
  file_path text not null,
  uploaded_by_client_account_id uuid references public.client_accounts(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists dog_documents_dog_id_idx
  on public.dog_documents (dog_id, created_at desc);

create index if not exists dog_documents_facility_id_idx
  on public.dog_documents (facility_id);

alter table public.dog_documents enable row level security;

drop policy if exists "dog_documents_select_facility_staff" on public.dog_documents;
create policy "dog_documents_select_facility_staff"
  on public.dog_documents
  for select
  using (
    facility_id in (
      select facility_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "dog_documents_select_linked_clients" on public.dog_documents;
create policy "dog_documents_select_linked_clients"
  on public.dog_documents
  for select
  using (
    dog_id in (
      select d.id
      from public.dogs d
      where d.client_id in (
        select client_id
        from public.client_account_links
        where client_account_id = auth.uid()
      )
    )
  );

drop policy if exists "dogs_select_linked_client_accounts" on public.dogs;
create policy "dogs_select_linked_client_accounts"
  on public.dogs
  for select
  using (
    client_id in (
      select client_id
      from public.client_account_links
      where client_account_id = auth.uid()
    )
  );

drop policy if exists "bookings_select_linked_client_accounts" on public.bookings;
create policy "bookings_select_linked_client_accounts"
  on public.bookings
  for select
  using (
    client_id in (
      select client_id
      from public.client_account_links
      where client_account_id = auth.uid()
    )
  );
