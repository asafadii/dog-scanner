drop policy if exists "Portal users can read linked facilities" on public.facilities;
create policy "Portal users can read linked facilities"
on public.facilities
for select
using (
  id in (
    select facility_id from public.client_account_links
    where client_account_id = auth.uid()
  )
);
